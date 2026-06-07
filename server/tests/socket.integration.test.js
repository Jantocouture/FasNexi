const ioClient = require('socket.io-client');
const IORedis = require('ioredis');
const jwt = require('jsonwebtoken');

jest.setTimeout(30000);

describe('Socket integration (with real Redis)', () => {
  let redisPub;
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_secret_int';
    process.env.DEV_AUTH = 'true';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    // start server (server/index.js listens on 4000 on require)
    require('../index');
    // wait a bit for server to be ready
    await new Promise((r) => setTimeout(r, 1500));
    redisPub = new IORedis(process.env.REDIS_URL);
    await redisPub.connect();
  });

  afterAll(async () => {
    if (redisPub) await redisPub.disconnect();
  });

  test('client subscribes and receives feedUpdate from Redis', (done) => {
    (async () => {
      // mint test tokens via dev endpoint
      const request = require('supertest');
      const app = require('../index');
      const res = await request(app).post('/api/auth/test-token').send({ userId: 'int_user', roles: ['user'] });
      expect(res.statusCode).toBe(200);
      const { token } = res.body;

      const socket = ioClient.connect('http://localhost:4000', { transports: ['websocket'], auth: { token } });
      socket.on('connect', () => {
        socket.emit('subscribe', 'sp_int');
      });
      socket.on('subscribed', async () => {
        // publish to Redis
        await redisPub.publish('feed:updates', JSON.stringify({ profileId: 'sp_int', items: [{ id: 'i1', payload: { title: 'live' } }] }));
      });
      socket.on('feedUpdate', (data) => {
        try {
          expect(data.profileId).toBe('sp_int');
          expect(Array.isArray(data.items)).toBe(true);
          socket.disconnect();
          done();
        } catch (e) {
          done(e);
        }
      });
      socket.on('connect_error', (err) => {
        done(err);
      });
    })();
  });
});
