import request from 'supertest';
import { createApp } from '../src/app.js';
import { getRedis, closeRedis } from '../src/config/redis.js';
import { keys, buildGameId } from '../src/utils/keys.js';

export { request };

let app;

export async function setupDatabase() {
  const redis = await getRedis();
  await redis.flushdb();
  seedTestGame(redis);
}

export async function teardownDatabase() {
  await closeRedis();
}

export function getApp() {
  if (!app) app = createApp();
  return app;
}

async function seedTestGame(redis) {
  await redis.hset(keys.game(buildGameId(1)), {
    name: 'Test Game',
    description: 'A game used by the automated tests.',
    createdAt: new Date().toISOString(),
  });
  await redis.sadd(keys.allGameIds(), buildGameId(1));
}

export async function registerUser(userKey, { username, email, password = 'password123' } = {}) {
  const body = {
    username: username || `tester_${userKey}`,
    email: email || `tester_${userKey}@example.com`,
    password,
  };
  const res = await request(getApp()).post('/api/auth/register').send(body);
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { ...res.body.data, password: body.password };
}

export async function login(userEmail, password = 'password123') {
  const res = await request(getApp()).post('/api/auth/login').send({ email: userEmail, password });
  if (res.status !== 200) {
    throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}