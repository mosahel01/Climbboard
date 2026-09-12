import Redis from 'ioredis';
import { env, isProduction } from './env.js';

let client = null;

export function createRedisClient(url = env.redisUrl) {
  const redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
    retryStrategy: (times) => Math.min(times * 500, 5000),
  });

  redis.on('connect', () => console.log('[redis] connected'));
  redis.on('ready', () => console.log('[redis] ready'));
  redis.on('error', (err) => {
    console.error('[redis] error:', err.message);
  });
  redis.on('close', () => console.log('[redis] connection closed'));
  redis.on('reconnecting', (delay) =>
    console.log(`[redis] reconnecting in ${delay}ms`),
  );

  return redis;
}

export async function getRedis() {
  if (!client) {
    client = createRedisClient();
    await new Promise((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = (err) => {
        cleanup();
        reject(err);
      };
      const cleanup = () => {
        client.off('ready', onReady);
        client.off('error', onError);
      };
      client.once('ready', onReady);
      client.once('error', onError);
    });
  }
  return client;
}

export async function closeRedis() {
  if (client) {
    await client.quit().catch(() => client.disconnect());
    client = null;
  }
}

export async function pingRedis() {
  const redis = await getRedis();
  const pong = await redis.ping();
  if (pong !== 'PONG') throw new Error('Redis ping failed');
  if (!isProduction) console.log('[redis] ping OK');
  return pong;
}