import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { env, isProduction } from './config/env.js';
import { pingRedis, closeRedis } from './config/redis.js';
import { setupSockets } from './sockets/index.js';

async function start() {
  try {
    await pingRedis();
  } catch (err) {
    console.error('[fatal] Could not connect to Redis. Is redis-server running?');
    console.error(`[fatal] REDIS_URL=${env.redisUrl}`);
    console.error('[fatal] Hint: run `npm run redis` in backend/, or start Redis yourself.');
    console.error('[fatal] Detail:', err.message);
    process.exit(1);
  }

  const app = createApp();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: { origin: env.clientUrl, credentials: true },
  });
  setupSockets(io);
  app.set('io', io);

  server.listen(env.port, () => {
    console.log(`[server] BazariRank API listening on http://localhost:${env.port}`);
    console.log(`[socket] Socket.IO connected clients allowed from ${env.clientUrl}`);
    if (!isProduction) {
      console.log('[server] seeding tip: run `npm run seed` in backend/ to populate demo data.');
    }
  });

  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await io.close().catch(() => {});
      await closeRedis();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();