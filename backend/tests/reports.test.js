import test from 'node:test';
import assert from 'node:assert/strict';
import { request, getApp, setupDatabase, teardownDatabase, registerUser } from './helpers.js';

test.before(async () => setupDatabase());
test.after(async () => teardownDatabase());

// Build history within a controlled window: 3 users, 2 submissions each today.
test.before(async () => {
  let d = 0;
  for (const name of ['rp_a', 'rp_b', 'rp_c']) {
    d += 1;
    const user = await registerUser(name);
    const token = user.token;
    const base = d * 1000;
    await request(getApp()).post('/api/games/g-1/scores').set('Authorization', `Bearer ${token}`).send({ score: base });
    await request(getApp()).post('/api/games/g-1/scores').set('Authorization', `Bearer ${token}`).send({ score: base + 500 });
  }
});

test('report returns top players inside the requested window', async () => {
  const from = new Date(Date.now() - 2 * 86400_000).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 1 * 86400_000).toISOString().slice(0, 10);

  const res = await request(getApp()).get(`/api/reports/top-players?from=${from}&to=${to}&limit=10`);
  assert.equal(res.status, 200);

  const top = res.body.data.entries[0];
  assert.equal(top.username, 'tester_rp_c');
  assert.equal(top.totalScore, 6500); // 3000 + 3500
  assert.equal(top.numberOfSubmissions, 2);
  assert.equal(top.bestScore, 3500);
  assert.ok(top.gamesPlayed >= 1);
});

test('report respects date filtering', async () => {
  const from = '2000-01-01';
  const to = '2000-01-02';
  const res = await request(getApp()).get(`/api/reports/top-players?from=${from}&to=${to}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.entries.length, 0);
});

test('invalid date range is rejected', async () => {
  const res = await request(getApp()).get('/api/reports/top-players?from=2026-12-31&to=2026-01-01');
  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, 'INVALID_DATE_RANGE');
});

test('malformed date is rejected', async () => {
  const res = await request(getApp()).get('/api/reports/top-players?from=notadate&to=2026-12-31');
  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, 'INVALID_DATE');
});

test('missing date params are rejected', async () => {
  const res = await request(getApp()).get('/api/reports/top-players');
  assert.equal(res.status, 422);
});