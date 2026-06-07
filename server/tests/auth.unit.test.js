const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('@prisma/client', () => {
  const mPrisma = {
    styleProfile: { create: jest.fn().mockResolvedValue({ id: 'sp_test', archetypes: ['Cultural Fusion'] }), findUnique: jest.fn().mockResolvedValue({ id: 'sp_test', userId: 'user_1' }), findFirst: jest.fn().mockResolvedValue({ id: 'sp_test' }) },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

describe('Auth endpoints', () => {
  let app;
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret';
    process.env.DEV_AUTH = 'true';
    app = require('../index');
  });

  test('POST /api/auth/test-token (dev) returns token and refresh', async () => {
    const res = await request(app).post('/api/auth/test-token').send({ userId: 'user_1', roles: ['user'] });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refresh');
  });

  test('POST /api/auth/refresh returns new token for valid refresh', async () => {
    const testToken = jwt.sign({ sub: 'user_1', roles: ['user'], type: 'refresh' }, 'test_secret', { expiresIn: '1h' });
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: testToken });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
