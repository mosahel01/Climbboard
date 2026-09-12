import test from 'node:test';
import assert from 'node:assert/strict';
import { request, getApp, setupDatabase, teardownDatabase, registerUser } from './helpers.js';

test.before(async () => setupDatabase());
test.after(async () => teardownDatabase());

let seedCounter = 0;

async function seedLeaderboard(count = 5) {
  const users = [];
  for (let i = 0; i < count; i += 1) {
    seedCounter += 1;
    const user = await registerUser(`${seedCounter}_${i}`);
    const score = (i + 1) * 1000; // user 0 -> 1000, user 4 -> 5000
    await request(getApp())
      .post('/api/games/g-1/scores')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ score });
    users.push(user);
  }
  return users;
}

test('empty leaderboard returns empty entries', async () => {
  const res = await request(getApp()).get('/api/games/g-1/leaderboard?page=1&limit=20');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.entries, []);
  assert.equal(res.body.data.pagination.total, 0);
});

test('leaderboard is correctly ordered highest-first', async () => {
  await setupDatabase(); // isolated context
  seedCounter = 0;
  await seedLeaderboard(5);
  const res = await request(getApp()).get('/api/games/g-1/leaderboard?limit=20');

  assert.equal(res.status, 200);
  const entries = res.body.data.entries;
  assert.equal(entries.length, 5);
  assert.equal(entries[0].score, 5000);
  assert.equal(entries[0].rank, 1);
  assert.equal(entries[4].score, 1000);
  assert.equal(entries[4].rank, 5);
  for (let i = 0; i < entries.length - 1; i += 1) {
    assert.ok(entries[i].score >= entries[i + 1].score);
  }
});

test('rank endpoint returns correct zero-index-adjusted rank', async () => {
  const user = await registerUser('rankcheck');
  await request(getApp()).post('/api/games/g-1/scores').set('Authorization', `Bearer ${user.token}`).send({ score: 7000 });

  const res = await request(getApp()).get('/api/games/g-1/rank').set('Authorization', `Bearer ${user.token}`);
  assert.equal(res.body.data.rank, 1);
  assert.equal(res.body.data.score, 7000);
});

test('leaderboard pagination works', async () => {
  await setupDatabase(); // isolated context
  seedCounter = 100;
  await seedLeaderboard(6);
  const p1 = await request(getApp()).get('/api/games/g-1/leaderboard?page=1&limit=4');
  const p2 = await request(getApp()).get('/api/games/g-1/leaderboard?page=2&limit=4');

  assert.equal(p1.body.data.pagination.total, p2.body.data.pagination.total);
  assert.equal(p1.body.data.entries.length, 4);
  assert.equal(p2.body.data.entries.length, 2);
  assert.equal(p1.body.data.entries[0].rank, 1);
  assert.equal(p2.body.data.entries[0].rank, 5);
  const idsSet = new Set([...p1.body.data.entries, ...p2.body.data.entries].map((e) => e.userId));
  assert.equal(idsSet.size, 6);
});

test('global leaderboard aggregates best scores', async () => {
  await setupDatabase(); // isolated context
  let counter = 100;
  for (const points of [1000, 2000, 3000]) {
    const user = await registerUser(`${counter++}`);
    await request(getApp())
      .post('/api/games/g-1/scores')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ score: points });
  }
  const res = await request(getApp()).get('/api/leaderboard/global?limit=20');
  assert.equal(res.status, 200);
  const top = res.body.data.entries[0];
  assert.equal(top.score, 3000);
  assert.equal(top.rank, 1);
});

test('current user rank is included when authenticated', async () => {
  const user = await registerUser('lbcurrent');
  await request(getApp()).post('/api/games/g-1/scores').set('Authorization', `Bearer ${user.token}`).send({ score: 4242 });
  const res = await request(getApp())
    .get('/api/games/g-1/leaderboard?limit=20')
    .set('Authorization', `Bearer ${user.token}`);
  assert.equal(res.body.data.currentUser.userId, user.user.id);
  assert.equal(typeof res.body.data.currentUser.rank, 'number');
});