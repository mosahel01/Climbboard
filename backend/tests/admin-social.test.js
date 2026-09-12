import test from 'node:test';
import assert from 'node:assert/strict';
import { request, getApp, setupDatabase, teardownDatabase, registerUser } from './helpers.js';
import { getRedis } from '../src/config/redis.js';
import { keys } from '../src/utils/keys.js';

let alice;
let bob;
let admin;

test.before(async () => {
  await setupDatabase();
  alice = await registerUser('soc_a');
  bob = await registerUser('soc_b');
  const reg = await registerUser('admin_x');
  const redis = await getRedis();
  await redis.hset(keys.user(reg.user.id), { role: 'admin' });
  admin = { ...reg };
});

test.after(async () => teardownDatabase());

const auth = (user) => ({ Authorization: `Bearer ${user.token}` });

async function submit(user, score) {
  const res = await request(getApp())
    .post('/api/games/g-1/scores')
    .set(auth(user))
    .send({ score });
  assert.equal(res.status, 200);
  return res.body.data;
}

test('social: follow / unfollow updates both sides + profile state', async () => {
  const follow = await request(getApp())
    .post(`/api/users/${bob.user.id}/follow`)
    .set(auth(alice));
  assert.equal(follow.status, 200);
  assert.equal(follow.body.data.isFollowing, true);

  const profA = await request(getApp()).get(`/api/users/${alice.user.id}`).set(auth(bob));
  assert.equal(profA.body.data.social.followingCount, 1);
  assert.equal(profA.body.data.social.followerCount, 0);
  assert.equal(profA.body.data.social.isFollowing, false);

  const profB = await request(getApp()).get(`/api/users/${bob.user.id}`).set(auth(alice));
  assert.equal(profB.body.data.social.followerCount, 1);
  assert.equal(profB.body.data.social.followingCount, 0);
  assert.equal(profB.body.data.social.isFollowing, true);

  const unfollow = await request(getApp())
    .delete(`/api/users/${bob.user.id}/follow`)
    .set(auth(alice));
  assert.equal(unfollow.status, 200);
  assert.equal(unfollow.body.data.isFollowing, false);
});

test('social: cannot follow yourself', async () => {
  const res = await request(getApp()).post(`/api/users/${alice.user.id}/follow`).set(auth(alice));
  assert.equal(res.status, 400);
});

test('social: following-filtered activity feed only shows followed players', async () => {
  const a = await submit(alice, 7200);
  const b = await submit(bob, 6400);

  await request(getApp()).post(`/api/users/${bob.user.id}/follow`).set(auth(alice));

  const all = await request(getApp()).get('/api/activity?limit=20').set(auth(alice));
  const following = await request(getApp()).get('/api/activity?feed=following&limit=20').set(auth(alice));
  assert.equal(following.status, 200);
  assert.ok(all.body.data.entries.some((e) => e.id === a.entryId));
  const bobOnly = following.body.data.entries.filter((e) => e.userId === bob.user.id);
  assert.ok(bobOnly.length > 0);
  assert.ok(following.body.data.entries.every((e) => e.userId === bob.user.id || e.userId === alice.user.id));
  void b;
});

test('achievements: progress endpoint returns catalogue with numbers', async () => {
  const res = await request(getApp()).get('/api/users/me/achievements').set(auth(alice));
  assert.equal(res.status, 200);
  const { badges, summary } = res.body.data;
  assert.ok(badges.length >= 8);
  assert.ok(badges.every((b) => typeof b.progress === 'number' && typeof b.target === 'number'));
  assert.ok(badges.some((b) => b.earned));
  assert.equal(summary.earned, badges.filter((b) => b.earned).length);
});

test('admin: forbidden for non-admins, works for admins', async () => {
  const denied = await request(getApp()).get('/api/admin/overview').set(auth(bob));
  assert.equal(denied.status, 403);

  const ok = await request(getApp()).get('/api/admin/overview').set(auth(admin));
  assert.equal(ok.status, 200);
  assert.equal(typeof ok.body.data.users, 'number');
});

test('admin: can ban a user, who is then locked out of login', async () => {
  const ban = await request(getApp())
    .patch(`/api/admin/users/${bob.user.id}`)
    .set(auth(admin))
    .send({ banned: true });
  assert.equal(ban.status, 200);
  assert.equal(ban.body.data.banned, true);

  const login = await request(getApp())
    .post('/api/auth/login')
    .send({ email: bob.user.email, password: bob.password });
  assert.equal(login.status, 403);
  assert.equal(login.body.error.code, 'ACCOUNT_BANNED');

  const submit = await request(getApp())
    .post('/api/games/g-1/scores')
    .set(auth(bob))
    .send({ score: 100 });
  assert.equal(submit.status, 403);

  const unban = await request(getApp())
    .patch(`/api/admin/users/${bob.user.id}`)
    .set(auth(admin))
    .send({ banned: false });
  assert.equal(unban.status, 200);
  assert.equal(unban.body.data.banned, false);
});

test('admin: cannot modify self, can promote + delete a user', async () => {
  const self = await request(getApp())
    .patch(`/api/admin/users/${admin.user.id}`)
    .set(auth(admin))
    .send({ role: 'user' });
  assert.equal(self.status, 400);

  const promote = await request(getApp())
    .patch(`/api/admin/users/${alice.user.id}`)
    .set(auth(admin))
    .send({ role: 'admin' });
  assert.equal(promote.status, 200);
  assert.equal(promote.body.data.role, 'admin');

  await submit(bob, 5500);
  const del = await request(getApp())
    .delete(`/api/admin/users/${alice.user.id}`)
    .set(auth(admin));
  assert.equal(del.status, 200);

  const gone = await request(getApp()).get(`/api/users/${alice.user.id}`).set(auth(admin));
  assert.equal(gone.status, 404);

  const lb = await request(getApp()).get('/api/games/g-1/leaderboard?limit=50');
  assert.ok(!lb.body.data.entries.some((e) => e.userId === alice.user.id));
});

test('admin: games overview lists participation counters', async () => {
  const res = await request(getApp()).get('/api/admin/games').set(auth(admin));
  assert.equal(res.status, 200);
  const game = res.body.data.games.find((g) => g.gameId === 'g-1');
  assert.ok(game);
  assert.equal(typeof game.players, 'number');
  assert.equal(typeof game.submissions, 'number');
});