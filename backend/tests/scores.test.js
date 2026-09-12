import test from 'node:test';
import assert from 'node:assert/strict';
import { request, getApp, setupDatabase, teardownDatabase, registerUser } from './helpers.js';

test.before(async () => setupDatabase());
test.after(async () => teardownDatabase());

test('valid score submission returns new best and rank', async () => {
  const user = await registerUser('score1');
  const res = await request(getApp())
    .post('/api/games/g-1/scores')
    .set('Authorization', `Bearer ${user.token}`)
    .send({ score: 9500 });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.isNewBest, true);
  assert.equal(res.body.data.score, 9500);
  assert.equal(res.body.data.rank, 1);
});

test('invalid score is rejected (negative + non-number)', async () => {
  const user = await registerUser('score2');
  for (const bad of [-5, 'abc', 1.5, null]) {
    const res = await request(getApp())
      .post('/api/games/g-1/scores')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ score: bad });
    assert.equal(res.status, 422, `score ${bad} should be rejected`);
  }
});

test('higher score replaces leaderboard score (new best)', async () => {
  const user = await registerUser('score3');
  const a = await request(getApp()).post('/api/games/g-1/scores').set('Authorization', `Bearer ${user.token}`).send({ score: 500 });
  assert.equal(a.body.data.score, 500);

  const b = await request(getApp()).post('/api/games/g-1/scores').set('Authorization', `Bearer ${user.token}`).send({ score: 700 });
  assert.equal(b.body.data.isNewBest, true);
  assert.equal(b.body.data.score, 700);
});

test('lower score does not replace leaderboard score', async () => {
  const user = await registerUser('score4');
  await request(getApp()).post('/api/games/g-1/scores').set('Authorization', `Bearer ${user.token}`).send({ score: 900 });
  const late = await request(getApp()).post('/api/games/g-1/scores').set('Authorization', `Bearer ${user.token}`).send({ score: 400 });

  assert.equal(late.body.data.isNewBest, false);
  assert.equal(late.body.data.score, 900);

  const rankRes = await request(getApp())
    .get('/api/games/g-1/rank')
    .set('Authorization', `Bearer ${user.token}`);
  assert.equal(rankRes.body.data.score, 900);
});

test('every submission is recorded in score history', async () => {
  const user = await registerUser('score5');

  const sub = async (score) =>
    request(getApp()).post('/api/games/g-1/scores').set('Authorization', `Bearer ${user.token}`).send({ score });

  await sub(1000);
  await sub(2000);
  await sub(1500);

  const history = await request(getApp())
    .get('/api/users/me/scores')
    .set('Authorization', `Bearer ${user.token}`);

  assert.equal(history.body.data.pagination.total, 3);
  const scores = history.body.data.scores.map((s) => s.score);
  assert.deepEqual(scores, [1500, 2000, 1000]); // newest first
  assert.equal(history.body.data.scores[0].gameName, 'Test Game');
});

test('submitting to an unknown game returns 404', async () => {
  const user = await registerUser('score6');
  const res = await request(getApp())
    .post('/api/games/g-999/scores')
    .set('Authorization', `Bearer ${user.token}`)
    .send({ score: 100 });
  assert.equal(res.status, 404);
});