import test from 'node:test';
import assert from 'node:assert/strict';
import { request, getApp, setupDatabase, teardownDatabase, registerUser } from './helpers.js';

let alice;
let bob;

test.before(async () => {
  await setupDatabase();
  alice = await registerUser('feature_a');
  bob = await registerUser('feature_b');
});

test.after(async () => teardownDatabase());

async function submit(user, score) {
  const res = await request(getApp())
    .post('/api/games/g-1/scores')
    .set('Authorization', `Bearer ${user.token}`)
    .send({ score });
  assert.equal(res.status, 200);
  return res.body.data;
}

test('every submission lands on the live activity feed (public endpoint)', async () => {
  const a = await submit(alice, 1000);
  const b = await submit(bob, 900);

  const feed = await request(getApp()).get('/api/activity?limit=10');
  assert.equal(feed.status, 200);
  const entries = feed.body.data.entries;
  assert.ok(entries.length >= 2);
  assert.equal(entries[0].id, b.entryId); // most recent first
  assert.ok(entries.some((e) => e.id === a.entryId));
  assert.ok(entries.every((e) => e.username && e.gameName && typeof e.score === 'number'));
});

test('score submission response carries new badges', async () => {
  const res = await submit(alice, 1500);
  assert.ok(Array.isArray(res.newBadges));
  // alice already earned rookie + hotshot + etc, so we can't assume a specific value,
  // but the shape must be an array.
  assert.equal(typeof res.isNewBest, 'boolean');
});

test('leaderboard exposes trend (movement) for a player who moved up', async () => {
  // bob scored 900; let alice overtake him by a big margin and check trend fields exist.
  await submit(bob, 3000); // bob -> rank 1
  const before = await submit(alice, 2000);
  await submit(alice, 5000); // alice jumps ahead of bob

  const lb = await request(getApp()).get('/api/games/g-1/leaderboard?limit=20');
  assert.equal(lb.status, 200);
  const aliceEntry = lb.body.data.entries.find((e) => e.userId === alice.user.id);
  assert.equal(aliceEntry.rank, 1);
  assert.equal(typeof aliceEntry.trend, 'number');
  void before;
});

test('public player profile returns stats and badges without email', async () => {
  const res = await request(getApp()).get(`/api/users/${alice.user.id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.username, alice.user.username);
  assert.equal(res.body.data.user.email, undefined);
  assert.ok(Array.isArray(res.body.data.badges));
  assert.ok(res.body.data.stats);
  assert.ok(Array.isArray(res.body.data.recentScores));
});

test('own profile (/users/me) includes email and badges', async () => {
  const res = await request(getApp()).get('/api/users/me').set('Authorization', `Bearer ${alice.token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.email, alice.user.email);
  assert.ok(Array.isArray(res.body.data.badges));
});

test('dashboard endpoint returns market position + neighbours + activity', async () => {
  const res = await request(getApp()).get('/api/users/me/dashboard').set('Authorization', `Bearer ${alice.token}`);
  assert.equal(res.status, 200);
  const d = res.body.data;
  assert.equal(d.user.username, alice.user.username);
  assert.ok(Array.isArray(d.badges));
  assert.ok(Array.isArray(d.activity));
  assert.ok(Array.isArray(d.leaderComparison));
  assert.ok(d.leaderComparison.every((g) => typeof g.pctOfLeader === 'number' || g.pctOfLeader === null));
  assert.ok(Array.isArray(d.globalNeighbours));
  assert.ok(d.globalNeighbours.some((n) => n.isMe)); // alice has a global score
  assert.ok(Array.isArray(d.recentScores));
});

test('dashboard requires auth', async () => {
  const res = await request(getApp()).get('/api/users/me/dashboard');
  assert.equal(res.status, 401);
});

test('profile for an unknown user returns 404', async () => {
  const res = await request(getApp()).get('/api/users/u-999999');
  assert.equal(res.status, 404);
});