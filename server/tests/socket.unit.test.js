const ioClient = require('socket.io-client');
const jwt = require('jsonwebtoken');
const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

// Mock Prisma and queue client BEFORE requiring server
jest.mock('@prisma/client', () => {
  const mPrisma = {
    styleProfile: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where && where.id === 'sp_owner') return Promise.resolve({ id: 'sp_owner', userId: 'user_owner' });
        if (where && where.id === 'sp_other') return Promise.resolve({ id: 'sp_other', userId: 'user_other' });
        return Promise.resolve(null);
      })
    }
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

// mock queue client with in-memory pub/sub
jest.mock('../queue/client', () => {
  const EventEmitter = require('events');
  const emitter = new EventEmitter();
  const connection = {
    _emitter: emitter,
    duplicate() { return this; },
    async connect() { /* no-op */ },
    async subscribe(channel, cb) { this._cb = cb; },
    async publish(channel, message) { if (this._cb) this._cb(message); emitter.emit(channel, message); },
  };
  return { connection, moderationQueue: { add: jest.fn() }, feedQueue: { add: jest.fn() }, moderationDlq: { add: jest.fn() }, feedDlq: { add: jest.fn() } };
});

describe('Socket auth & subscribe (unit)', () => {
  let serverApp;
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret';
    // Require server after mocks
    serverApp = require('../index');
  });

  test('connect with valid JWT and subscribe as owner', (done) => {
    const token = jwt.sign({ sub: 'user_owner', roles: ['user'] }, 'test_secret');
    const socket = ioClient.connect('http://localhost:4000', { transports: ['websocket'], auth: { token } });
    socket.on('connect', () => {
      socket.emit('subscribe', 'sp_owner');
    });
    socket.on('subscribed', (msg) => {
      expect(msg).toHaveProperty('profileId', 'sp_owner');
      socket.disconnect();
      done();
    });
    socket.on('connect_error', (err) => {
      done.fail(err);
    });
  }, 10000);

  test('connect with invalid JWT is rejected', (done) => {
    const token = 'invalid.token.value';
    const socket = ioClient.connect('http://localhost:4000', { transports: ['websocket'], auth: { token }, reconnection: false });
    socket.on('connect', () => done.fail(new Error('should not connect')));
    socket.on('connect_error', (err) => {
      expect(err).toBeTruthy();
      socket.close();
      done();
    });
  }, 10000);

  test('subscribe forbidden for non-owner', (done) => {
    const token = jwt.sign({ sub: 'some_user', roles: ['user'] }, 'test_secret');
    const socket = ioClient.connect('http://localhost:4000', { transports: ['websocket'], auth: { token } });
    socket.on('connect', () => {
      socket.emit('subscribe', 'sp_other');
    });
    socket.on('error', (err) => {
      // server emits error object for forbidden
      expect(err).toHaveProperty('code');
      socket.disconnect();
      done();
    });
  }, 10000);

  test('receives feedUpdate when published', (done) => {
    const token = jwt.sign({ sub: 'user_owner', roles: ['user'] }, 'test_secret');
    const socket = ioClient.connect('http://localhost:4000', { transports: ['websocket'], auth: { token } });
    socket.on('connect', () => {
      socket.emit('subscribe', 'sp_owner');
    });
    socket.on('subscribed', async () => {
      // publish via mocked connection
      const { connection } = require('../queue/client');
      await connection.publish('feed:updates', JSON.stringify({ profileId: 'sp_owner', items: [{ id: '1', payload: { title: 'x' } }] }));
    });
    socket.on('feedUpdate', (data) => {
      expect(data).toHaveProperty('profileId', 'sp_owner');
      expect(Array.isArray(data.items)).toBe(true);
      socket.disconnect();
      done();
    });
  }, 10000);
});
