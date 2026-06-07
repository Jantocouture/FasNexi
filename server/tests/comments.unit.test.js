const ioClient = require('socket.io-client');
const jwt = require('jsonwebtoken');

jest.mock('@prisma/client', () => {
  const mPrisma = {
    post: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'post1') return Promise.resolve({ id: 'post1', authorId: 'user1' });
        return Promise.resolve(null);
      })
    },
    comment: {
      create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'c1', ...data })),
      findMany: jest.fn().mockResolvedValue([{ id: 'c1', postId: 'post1', content: 'hey', author: { id: 'user1', name: 'User1' }, createdAt: new Date() }])
    }
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

// mock redis client
jest.mock('../queue/client', () => {
  const EventEmitter = require('events');
  const emitter = new EventEmitter();
  const connection = {
    _emitter: emitter,
    duplicate() { return this; },
    async connect() { /* noop */ },
    async publish(channel, message) { process.nextTick(() => emitter.emit(channel, message)); },
    async subscribe(channel, cb) { this._cb = cb; emitter.on(channel, (msg) => cb(msg)); }
  };
  return { connection };
});

describe('Comments API unit tests', () => {
  let app;
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret';
    app = require('../index');
  });

  test('POST comment and receive via socket', (done) => {
    const token = jwt.sign({ sub: 'user1', roles: ['user'] }, 'test_secret');
    const socket = ioClient.connect('http://localhost:4000', { transports: ['websocket'], auth: { token } });
    socket.on('connect', () => {
      socket.emit('subscribePost', 'post1');
      // create comment via HTTP
      const request = require('supertest');
      request(app).post('/api/posts/post1/comments').set('Authorization', `Bearer ${token}`).send({ content: 'hello' }).then(res => {
        expect(res.statusCode).toBe(200);
      }).catch(err => done(err));
    });
    socket.on('comment', (c) => {
      try {
        expect(c).toBeTruthy();
        socket.disconnect();
        done();
      } catch (e) { done(e); }
    });
    socket.on('connect_error', (err) => done(err));
  });
});
