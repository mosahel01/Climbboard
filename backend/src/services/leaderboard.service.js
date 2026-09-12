import { getRedis } from '../config/redis.js';
import { keys } from '../utils/keys.js';
import { getUserById } from './auth.service.js';

/**
 * Fetch a page of a game's sorted-set leaderboard using Redis ZREVRANGE.
 * Pagination happens inside Redis - the whole set is never read into memory.
 */
export async function getLeaderboard(gameId, page = 1, limit = 20) {
  return getLeaderboardRoom(gameId, page, limit);
}

export async function getUserRank(gameId, userId) {
  const redis = await getRedis();
  const key = keys.leaderboard(gameId);

  const [score, rank] = await Promise.all([redis.zscore(key, userId), redis.zrevrank(key, userId)]);

  if (score == null) {
    return { gameId, userId, score: null, rank: null };
  }
  return { gameId, userId, score: Number.parseFloat(score), rank: rank + 1 };
}

export async function getGlobalLeaderboard(page = 1, limit = 20) {
  return getLeaderboardRoom('global', page, limit);
}

async function getLeaderboardRoom(room, page, limit) {
  const redis = await getRedis();
  const key = room === 'global' ? keys.globalLeaderboard() : keys.leaderboard(room);
  const total = await redis.zcard(key);
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const raw = await redis.zrevrange(key, start, end, 'WITHSCORES');

  const userIds = [];
  for (let i = 0; i < raw.length; i += 2) userIds.push(raw[i]);

  const movementKey = keys.movement(room);
  const movements = userIds.length
    ? await redis.hmget(movementKey, ...userIds)
    : [];

  const resolveTrend = (userId, movementRaw) => {
    if (!movementRaw) return null;
    try {
      const m = JSON.parse(movementRaw);
      return m.delta;
    } catch {
      return null;
    }
  };

  const entries = [];
  for (let i = 0; i < raw.length; i += 2) {
    const userId = raw[i];
    const user = await getUserById(userId);
    entries.push({
      rank: start + i / 2 + 1,
      userId,
      username: user ? user.username : 'Unknown',
      score: Number.parseFloat(raw[i + 1]),
      trend: resolveTrend(userId, movements[i / 2]),
    });
  }
  return { entries, pagination: { page, limit, total } };
}

export async function getUserStats(userId) {
  const redis = await getRedis();
  const gameIds = await redis.smembers(keys.allGameIds());
  if (gameIds.length === 0) return { gamesPlayed: [], totalBestScore: 0, globalRank: null, gamesParticipated: 0 };

  const perGame = await Promise.all(
    gameIds.map(async (gameId) => {
      const [score, rank] = await Promise.all([
        redis.zscore(keys.leaderboard(gameId), userId),
        redis.zrevrank(keys.leaderboard(gameId), userId),
      ]);
      return {
        gameId,
        score: score == null ? null : Number.parseFloat(score),
        rank: score == null ? null : rank + 1,
      };
    }),
  );

  const played = perGame.filter((g) => g.score != null);
  const totalBestScore = played.reduce((sum, g) => sum + g.score, 0);

  const globalRank = await redis.zrevrank(keys.globalLeaderboard(), userId);
  const globalScore = await redis.zscore(keys.globalLeaderboard(), userId);

  return {
    gamesPlayed: played,
    totalBestScore,
    globalScore: globalScore == null ? null : Number.parseFloat(globalScore),
    globalRank: globalRank == null ? null : globalRank + 1,
    gamesParticipated: played.length,
  };
}

/**
 * Global score = sum of a user's personal-best score across all games.
 * Implemented by reading the user's score from every game zset (few games)
 * and writing the total into the global zset with ZADD.
 */
export async function recomputeGlobalScore(userId) {
  const redis = await getRedis();
  const gameIds = await redis.smembers(keys.allGameIds());
  if (gameIds.length === 0) return;

  const scores = await Promise.all(
    gameIds.map((gameId) => redis.zscore(keys.leaderboard(gameId), userId).then((s) => s || 0)),
  );

  const total = scores.reduce((sum, s) => sum + Number.parseFloat(s), 0);
  await redis.zadd(keys.globalLeaderboard(), total, userId);
}