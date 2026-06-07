const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const bullBoardRouter = require('./queue/bullBoard');
const { moderationQueue, feedQueue, moderationDlq, feedDlq, connection } = require('./queue/client');
const feedProcessor = require('./workers/feedProcessor');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:19006,http://localhost:8081';

function signCloudinaryParams(params) {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(sorted + API_SECRET).digest('hex');
}

function authMiddleware(req, res, next) {
  const auth = req.header('authorization');
  if (!auth) return next();
  const parts = auth.split(' ');
  if (parts.length !== 2) return next();
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.sub || decoded.userId || null, roles: decoded.roles || [] };
  } catch (err) {
    console.warn('Invalid JWT:', err.message);
  }
  return next();
}
app.use(authMiddleware);

// Admin auth: require JWT with role 'admin' (no basic fallback)
function adminAuthMiddleware(req, res, next) {
  if (req.user && req.user.roles && req.user.roles.includes('admin')) return next();
  return res.status(403).json({ error: 'forbidden' });
}

const WardrobeItemSchema = z.object({
  imageUrl: z.string().url(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const StyleProfileSchema = z.object({
  userId: z.string().nullable().optional(),
  archetypes: z.array(z.string()).min(1),
  bodyShape: z.string().nullable().optional(),
  measurements: z.record(z.number()).optional(),
  fitPreference: z.string().optional(),
  occasionPriorities: z.array(z.string()).optional(),
  colorPrefs: z.array(z.string()).optional(),
  favoriteDesigners: z.array(z.string()).optional(),
  budgetBand: z.string().optional(),
  sustainabilityPriority: z.boolean().optional(),
  wardrobeItems: z.array(WardrobeItemSchema).optional(),
});

// We'll create the HTTP server and attach socket.io
const server = http.createServer(app);
const { Server } = require('socket.io');

// compute allowed origins list
const allowedOrigins = ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // allow non-browser clients or server-to-server (no origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    }
  }
});

// Socket auth middleware: verify token if present and attach socket.user
io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = { id: decoded.sub || decoded.userId || null, roles: decoded.roles || [] };
  } catch (e) {
    console.warn('socket auth failed', e.message);
    // reject connection if token invalid
    return next(new Error('unauthorized'));
  }
  return next();
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id, 'user=', socket.user && socket.user.id);

  socket.on('subscribe', async (profileId) => {
    if (!profileId) return;
    const room = `profile:${profileId}`;
    try {
      // require authentication to join profile rooms
      if (!socket.user || !socket.user.id) {
        socket.emit('error', { code: 'unauthenticated', message: 'Must provide valid token to subscribe' });
        return;
      }
      // check ownership or admin role
      const profile = await prisma.styleProfile.findUnique({ where: { id: profileId }, select: { userId: true } });
      if (!profile) {
        socket.emit('error', { code: 'not_found', message: 'Profile not found' });
        return;
      }
      const isOwner = profile.userId && socket.user.id && profile.userId === socket.user.id;
      const isAdmin = socket.user.roles && socket.user.roles.includes('admin');
      if (!isOwner && !isAdmin) {
        socket.emit('error', { code: 'forbidden', message: 'Not authorized to subscribe to this profile' });
        return;
      }
      socket.join(room);
      socket.emit('subscribed', { profileId });
      console.log(`socket ${socket.id} joined ${room}`);
    } catch (err) {
      console.error('subscribe error', err);
      socket.emit('error', { code: 'server_error' });
    }
  });

  socket.on('unsubscribe', (profileId) => {
    if (!profileId) return;
    const room = `profile:${profileId}`;
    socket.leave(room);
  });
});

// Subscribe to Redis channel for feed updates
(async () => {
  try {
    const sub = connection.duplicate();
    await sub.connect();
    await sub.subscribe('feed:updates', (message) => {
      try {
        const data = JSON.parse(message);
        const room = `profile:${data.profileId}`;
        io.to(room).emit('feedUpdate', data);
        console.log('emitted feedUpdate for', data.profileId);
      } catch (e) {
        console.error('failed to parse feed update', e);
      }
    });
  } catch (err) {
    console.error('redis subscribe error', err);
  }
})();

// mount bull board behind admin auth
app.use('/admin/queues', adminAuthMiddleware, bullBoardRouter);

app.get('/api/uploads/sign', async (req, res) => {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return res.status(500).json({ error: 'Cloudinary keys not configured on server.' });
  }
  try {
    const folder = req.query.folder || 'wardrobe';
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = { timestamp, folder };
    const signature = signCloudinaryParams(paramsToSign);
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    return res.json({
      url,
      fields: {
        api_key: API_KEY,
        timestamp,
        signature,
        folder
      }
    });
  } catch (err) {
    console.error('sign error', err);
    return res.status(500).json({ error: 'failed to sign' });
  }
});

// GET feed API
app.get('/api/feed', async (req, res) => {
  const { profileId, userId, page = 1, perPage = 20 } = req.query;
  try {
    let where = {};
    if (profileId) where = { styleProfileId: profileId };
    else if (userId) {
      const profile = await prisma.styleProfile.findFirst({ where: { userId }, select: { id: true } });
      if (!profile) return res.json({ items: [] });
      where = { styleProfileId: profile.id };
    } else {
      return res.status(400).json({ error: 'profileId or userId required' });
    }
    const skip = (Number(page) - 1) * Number(perPage);
    const items = await prisma.feedItem.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(perPage) });
    return res.json({ items });
  } catch (err) {
    console.error('feed error', err);
    return res.status(500).json({ error: 'failed' });
  }
});

app.post('/api/style-profile', async (req, res) => {
  const userFromReq = req.user && req.user.id ? req.user.id : null;
  const parse = StyleProfileSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'validation_error', details: parse.error.format() });
  }
  const payload = parse.data;

  try {
    const writeUserId = userFromReq || payload.userId || null;

    const styleProfile = await prisma.styleProfile.create({
      data: {
        userId: writeUserId,
        archetypes: payload.archetypes,
        bodyShape: payload.bodyShape || null,
        measurements: payload.measurements || null,
        fitPreference: payload.fitPreference || null,
        occasionPriorities: payload.occasionPriorities || [],
        colorPrefs: payload.colorPrefs || [],
        favoriteDesigners: payload.favoriteDesigners || [],
        budgetBand: payload.budgetBand || null,
        sustainability: !!payload.sustainabilityPriority,
      }
    });

    const items = payload.wardrobeItems || [];
    const createdItems = [];
    for (const it of items) {
      const wi = await prisma.wardrobeItem.create({
        data: {
          styleProfileId: styleProfile.id,
          imageUrl: it.imageUrl,
          category: it.category || 'unknown',
          tags: it.tags || [],
          moderationStatus: 'PENDING'
        }
      });
      await prisma.moderationJob.create({ data: { wardrobeItemId: wi.id, status: 'PENDING' } });
      // enqueue moderation job with retry/backoff
      await moderationQueue.add('moderate', { wardrobeItemId: wi.id, imageUrl: it.imageUrl }, { attempts: 5, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true, removeOnFail: false, timeout: 60000 });
      createdItems.push(wi);
    }

    const feedJob = await prisma.feedJob.create({ data: { styleProfileId: styleProfile.id, status: 'PENDING' } });
    // enqueue feed generation job (include feedJobId for idempotency)
    await feedQueue.add('generateFeed', { styleProfileId: styleProfile.id, feedJobId: feedJob.id }, { attempts: 5, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true, removeOnFail: false, timeout: 60000 });

    // attempt a short synchronous generation for preview (best-effort)
    let feedPreview = [];
    try {
      const timeoutMs = 1500;
      const genPromise = feedProcessor.generateFeedForProfile(styleProfile);
      feedPreview = await Promise.race([genPromise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs))]);
      if (!Array.isArray(feedPreview)) feedPreview = [];
      feedPreview = feedPreview.slice(0, 3);
      // if preview generated items, mark the feedJob as completed to avoid worker duplication
      if (feedPreview.length > 0) {
        await prisma.feedJob.update({ where: { id: feedJob.id }, data: { status: 'COMPLETED' } });
        // publish update so connected clients see the preview immediately
        try { await connection.publish('feed:updates', JSON.stringify({ profileId: styleProfile.id, items: feedPreview })); } catch(e) { console.warn('publish preview failed', e); }
      }
    } catch (e) {
      feedPreview = [];
    }

    return res.json({ styleProfileId: styleProfile.id, feedJobId: feedJob.id, wardrobeItems: createdItems, feedPreview });
  } catch (err) {
    console.error('style-profile error', err);
    return res.status(500).json({ error: 'Failed to save style profile' });
  }
});

// Admin DLQ inspection
app.get('/api/admin/dlq/:queue', adminAuthMiddleware, async (req, res) => {
  const { queue } = req.params;
  try {
    let q;
    if (queue === 'moderation') q = moderationDlq;
    else if (queue === 'feed') q = feedDlq;
    else return res.status(400).json({ error: 'unknown queue' });
    const jobs = await q.getJobs(['waiting','delayed','failed','completed']);
    return res.json({ jobs: jobs.map(j => ({ id: j.id, name: j.name, data: j.data, failedReason: j.failedReason })) });
  } catch (err) {
    console.error('dlq error', err);
    return res.status(500).json({ error: 'failed' });
  }
});

app.get('/api/admin/moderation/pending', adminAuthMiddleware, async (req, res) => {
  try {
    const pending = await prisma.moderationJob.findMany({ where: { status: 'PENDING' }, include: { wardrobeItem: true } });
    return res.json({ pending });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'failed' });
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));

module.exports = app;
