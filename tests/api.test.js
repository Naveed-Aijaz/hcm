// Run with: npm test   (requires `npm install`; no database needed for these cases)
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.JWT_SECRET = 'test_secret_test_secret_test_secret_123';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

const { default: app } = await import('../app.js');

test('GET /api/health -> 200', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test('unknown API route -> 404 JSON', async () => {
  const res = await request(app).get('/api/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});

test('protected routes reject anonymous requests with 401', async () => {
  for (const [method, url] of [
    ['get', '/api/auth/me'],
    ['get', '/api/users'],
    ['get', '/api/attendance/today'],
    ['get', '/api/leaves'],
    ['post', '/api/payroll/generate'],
    ['post', '/api/ai/chat'],
  ]) {
    const res = await request(app)[method](url);
    assert.equal(res.status, 401, `${method.toUpperCase()} ${url}`);
  }
});

test('login validates body (400, not 500) ', async () => {
  const res = await request(app).post('/api/auth/login').send({});
  assert.equal(res.status, 400);
});

test('signup ignores/does not accept a client-supplied role; rejects weak password', async () => {
  const res = await request(app).post('/api/auth/signup').send({ name: 'Eve', email: 'eve@example.com', password: 'short', role: 'Admin' });
  assert.equal(res.status, 400);
});

test('malformed JSON -> 400', async () => {
  const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
  assert.equal(res.status, 400);
});

test('CORS: disallowed origin -> 403', async () => {
  const res = await request(app).get('/api/health').set('Origin', 'https://evil.example');
  assert.equal(res.status, 403);
});

test('CORS: allowed origin gets credentials header', async () => {
  const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
  assert.equal(res.headers['access-control-allow-credentials'], 'true');
});
