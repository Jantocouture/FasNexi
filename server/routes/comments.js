const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function requireAuth(req, res, next) {
  const auth = req.header('authorization');
  if (!auth) return res.status(401).json({ error: 'missing_authorization' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid_authorization' });
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.sub || decoded.userId || null, roles: decoded.roles || [] };
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

const CreateCommentSchema = z.object({ content: z.string().min(1).max(1000), parentId: z.string().optional() });

// create comment on a post
router.post('/posts/:postId/comments', requireAuth, async (req, res) => {
  const { postId } = req.params;
  const parsed = CreateCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'validation', details: parsed.error.format() });
  try {
    // ensure post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: 'post_not_found' });
    const data = { postId, content: parsed.data.content, authorId: req.user.id };
    if (parsed.data.parentId) data.parentId = parsed.data.parentId;
    const comment = await prisma.comment.create({ data });
    // publish comment to redis so sockets can emit
    try { if (global.redisConnection) global.redisConnection.publish('post:comments', JSON.stringify({ postId, comment })); } catch (e) {}
    return res.json({ comment });
  } catch (err) {
    console.error('create comment error', err);
    return res.status(500).json({ error: 'failed' });
  }
});

// list comments for a post (flat list; client can nest replies)
router.get('/posts/:postId/comments', async (req, res) => {
  const { postId } = req.params;
  const { page = 1, perPage = 50 } = req.query;
  try {
    const skip = (Number(page) - 1) * Number(perPage);
    const comments = await prisma.comment.findMany({ where: { postId }, include: { author: true }, orderBy: { createdAt: 'asc' }, skip, take: Number(perPage) });
    return res.json({ comments });
  } catch (err) {
    console.error('list comments error', err);
    return res.status(500).json({ error: 'failed' });
  }
});

// delete comment (author or admin)
router.delete('/comments/:commentId', requireAuth, async (req, res) => {
  const { commentId } = req.params;
  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: 'not_found' });
    const isOwner = comment.authorId === req.user.id;
    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'forbidden' });
    await prisma.comment.delete({ where: { id: commentId } });
    return res.json({ ok: true });
  } catch (err) {
    console.error('delete comment error', err);
    return res.status(500).json({ error: 'failed' });
  }
});

module.exports = router;
