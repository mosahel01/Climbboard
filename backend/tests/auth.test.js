import test from 'node:test';
import assert from 'node:assert/strict';
import { request, getApp, setupDatabase, teardownDatabase, registerUser } from './helpers.js';

const uniqueEmail = (u) => `auth_${u}@example.com`;

test.before(async () => {
  await setupDatabase();
  await registerUser('dup', { email: uniqueEmail('dup') });
});

test.after(async () => teardownDatabase());

test('registration returns a JWT and the public user', async () => {
  const unique = Date.now();
  const res = await request(getApp())
    .post('/api/auth/register')
    .send({ username: `fresh_${unique}`, email: uniqueEmail(`fresh_${unique}`), password: 'secret123' });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.token);
  assert.equal(res.body.data.user.email, uniqueEmail(`fresh_${unique}`));
  assert.equal(res.body.data.user.passwordHash, undefined);
  assert.ok(res.body.data.user.id);
});

test('registration rejects invalid username', async () => {
  const res = await request(getApp())
    .post('/api/auth/register')
    .send({ username: 'a', email: 'x@example.com', password: 'secret123' });
  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('registration rejects duplicate email with 409', async () => {
  const res = await request(getApp())
    .post('/api/auth/register')
    .send({ username: 'other_user', email: uniqueEmail('dup'), password: 'secret123' });
  assert.equal(res.status, 409);
  assert.equal(res.body.error.code, 'EMAIL_TAKEN');
});

test('registration rejects duplicate username with 409', async () => {
  const res = await request(getApp())
    .post('/api/auth/register')
    .send({ username: 'tester_dup', email: uniqueEmail('other'), password: 'secret123' });
  assert.equal(res.status, 409);
  assert.equal(res.body.error.code, 'USERNAME_TAKEN');
});

test('login succeeds with correct password', async () => {
  const res = await request(getApp())
    .post('/api/auth/login')
    .send({ email: uniqueEmail('dup'), password: 'password123' });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.token);
});

test('login fails with wrong password', async () => {
  const res = await request(getApp())
    .post('/api/auth/login')
    .send({ email: uniqueEmail('dup'), password: 'wrong-password' });
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
});

test('protected route rejects missing token', async () => {
  const res = await request(getApp()).get('/api/users/me');
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'AUTH_REQUIRED');
});

test('protected route rejects a garbage token', async () => {
  const res = await request(getApp())
    .get('/api/users/me')
    .set('Authorization', 'Bearer not.a.token');
  assert.equal(res.status, 401);
});

test('protected route works with a valid token', async () => {
  const user = await registerUser('mecheck');
  const res = await request(getApp())
    .get('/api/users/me')
    .set('Authorization', `Bearer ${user.token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.email, user.user.email);
});