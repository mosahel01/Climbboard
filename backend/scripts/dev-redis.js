/**
 * Dev helper for environments without a system Redis.
 *
 * - Uses a locally built redis binary at ../.tools/bin/redis-server if present.
 * - Otherwise falls back to redis-memory-server (install: npm i -D redis-memory-server).
 * - Otherwise instructs how to start Redis.
 *
 * In production / normal dev, just run redis-server yourself or use Docker
 * (see docker-compose.yml at the project root).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const candidates = [
  path.resolve(here, '../.tools/bin/redis-server'),
  path.resolve(here, '../bin/redis-server'),
];

const argv = process.argv.slice(2);
const stop = argv.includes('--stop');

const pidFile = path.join(os.tmpdir(), 'bazarirank-redis.pid');

function stopRedis() {
  if (fs.existsSync(pidFile)) {
    const pid = Number.parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
    try {
      process.kill(pid, 'SIGTERM');
      console.log('Stopped dev redis (pid ' + pid + ').');
    } catch {
      console.log('Dev redis not running. Removing stale pid file.');
    }
    fs.unlinkSync(pidFile);
  } else {
    console.log('No dev redis pid file found.');
  }
  process.exit(0);
}

async function start() {
  const binary = candidates.find((p) => fs.existsSync(p));
  if (binary) {
    console.log('Starting local redis-server at', binary);
    const child = spawn(
      binary,
      ['--port', '6379', '--save', '', '--appendonly', 'no', '--loglevel', 'notice'],
      { stdio: 'inherit', detached: true },
    );
    child.on('spawn', () => fs.writeFileSync(pidFile, String(child.pid)));
    child.unref();
    console.log('Dev redis listening on redis://localhost:6379 (pid ' + child.pid + ')');
    console.log('Stop it with: npm run redis:stop');
    return;
  }

  try {
    const { RedisMemoryServer } = await import('redis-memory-server');
    const server = new RedisMemoryServer({ instance: { port: 6379 } });
    const host = await server.getHost();
    const port = await server.getPort();
    console.log('Started redis-memory-server at', `redis://${host}:${port}`);
    return;
  } catch {
    // fall through to instructions
  }

  console.log([
    'No redis binary found.',
    'Options:',
    '  1. Install Redis and run `redis-server` (system package / brew / apt).',
    '  2. Use Docker: `docker compose up redis` from the project root.',
    '  3. In this sandbox: `npm install --no-save redis-memory-server` then re-run this script.',
  ].join('\n'));
  process.exit(1);
}

if (stop) {
  stopRedis();
} else {
  start();
}