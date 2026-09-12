import { getRedis } from '../config/redis.js';
import { keys, buildEntryId } from '../utils/keys.js';
import { getUserById } from './auth.service.js';
import { getGame, gameExists } from './game.service.js';
import { recomputeGlobalScore, getUserRank } from './leaderboard.service.js';
import { awardBadges } from './badge.service.js';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

const ACTIVITY_TTL_MS = 120_000; // keep "recent move" flags for 2 minutes
const ACTIVITY_FEED_MAX = 200;

/**
 * Submit a score for a game.
 *
 * Rules:
 * - Every submission is recorded in the user's history (zset ordered by time)
 *   and pushed onto the global live activity feed.
 * - A user's leaderboard score is their personal BEST. ZADD ... GT only raises
 *   a member's score, so a lower score can never decrease the leaderboard.
 * - Rank movements are tracked so the UI can show ▲/▼ like a live market ticker.
 */
export async function submitScore(userId, gameId, score) {
  const redis = await getRedis();

  if (!Number.isInteger(score) || score < env.minScore || score > env.maxScore) {
    throw new AppError(
      `Score must be an integer between ${env.minScore} and ${env.maxScore}.`,
      422,
      'INVALID_SCORE',
    );
  }

  if (!(await gameExists(gameId))) {
    throw new AppError('The requested game does not exist.', 404, 'GAME_NOT_FOUND');
  }

  const user = await getUserById(userId);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  if (user.banned === '1' || user.banned === 'true') {
    throw new AppError('This account has been banned and can no longer submit scores.', 403, 'ACCOUNT_BANNED');
  }

  const game = await getGame(gameId);
  const now = new Date();
  const createdAt = now.toISOString();

  const historyId = await redis.incr(keys.counters.history());
  const entryId = buildEntryId(historyId);

  const [prevBestRaw, oldRankRaw] = await Promise.all([
    redis.zscore(keys.leaderboard(gameId), userId),
    redis.zrevrank(keys.leaderboard(gameId), userId),
  ]);
  const prevBest = prevBestRaw == null ? null : Number.parseFloat(prevBestRaw);
  const isNewBest = prevBest == null || score > prevBest;
  const bestScore = isNewBest ? score : prevBest;
  const oldRank = oldRankRaw == null ? null : oldRankRaw + 1;

  await redis.pipeline()
    .hset(keys.historyEntry(entryId), { userId, gameId, score, createdAt })
    .zadd(keys.history(userId), now.getTime(), entryId) // zset score = timestamp (ms)
    .zadd(keys.leaderboard(gameId), 'GT', score, userId) // GT: only raise, never lower
    .incr(keys.counters.submissions())
    .incr(keys.counters.gameSubmissions(gameId))
    .exec();

  if (isNewBest) {
    await recomputeGlobalScore(userId);
  }

  const rankInfo = await getUserRank(gameId, userId);
  const rank = rankInfo.rank;
  const rankJump = oldRank == null ? 0 : Math.max(0, oldRank - rank);

  // Track rank movement for the live ticker (▲/▼ on leaderboards).
  if (oldRank != null && oldRank !== rank) {
    const movement = JSON.stringify({ delta: rankJump > 0 ? rankJump : rank - oldRank, at: now.getTime() });
    await redis
      .pipeline()
      .hset(keys.movement(gameId), userId, movement)
      .pexpire(keys.movement(gameId), ACTIVITY_TTL_MS)
      .exec();
  }

  // Remember the user's biggest single rank jump (powers the Market Mover achievement).
  if (rankJump > 0) {
    await redis.zadd(keys.userMaxJump(userId), 'GT', rankJump, 'max');
  }

  // Award any newly-earned achievement badges.
  const newBadges = await awardBadges(userId, { rankJump });

  // Live activity feed entry (every submission, bounded list).
  const activity = {
    id: entryId,
    userId,
    username: user.username,
    gameId,
    gameName: game.name,
    score,
    bestScore,
    isNewBest,
    rank,
    rankJump,
    createdAt,
  };
  await redis.pipeline().lpush(keys.activityFeed(), JSON.stringify(activity)).ltrim(keys.activityFeed(), 0, ACTIVITY_FEED_MAX - 1).exec();

  return {
    isNewBest,
    entryId,
    score: bestScore,
    submittedScore: score,
    rank,
    rankJump,
    newBadges,
    activity,
  };
}

export async function getActivityFeed(limit = 30) {
  const redis = await getRedis();
  const raw = await redis.lrange(keys.activityFeed(), 0, Math.min(limit, ACTIVITY_FEED_MAX) - 1);
  return raw.map((item) => {
    try {
      return JSON.parse(item);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

/** Career stats per game for a user, bucketed from their recorded history. */
export async function getUserStatsByGame(userId) {
  const redis = await getRedis();
  const entryIds = await redis.zrevrange(keys.history(userId), 0, 499);

  const byGame = new Map();
  for (const entryId of entryIds) {
    const entry = await redis.hgetall(keys.historyEntry(entryId));
    if (!entry.gameId) continue;
    const score = Number.parseFloat(entry.score);
    if (!Number.isFinite(score)) continue;

    let bucket = byGame.get(entry.gameId);
    if (!bucket) {
      bucket = { attempts: 0, total: 0, best: 0, lastPlayedAt: null };
      byGame.set(entry.gameId, bucket);
    }
    bucket.attempts += 1;
    bucket.total += score;
    if (score > bucket.best) bucket.best = score;
    if (entry.createdAt && (bucket.lastPlayedAt == null || entry.createdAt > bucket.lastPlayedAt)) {
      bucket.lastPlayedAt = entry.createdAt;
    }
  }

  const result = {};
  for (const [gameId, b] of byGame.entries()) {
    result[gameId] = {
      attempts: b.attempts,
      avgScore: Math.round(b.total / b.attempts),
      bestScore: b.best,
      lastPlayedAt: b.lastPlayedAt,
    };
  }
  return result;
}

export async function getSubmissionCountByUser(userIdList) {
  const redis = await getRedis();
  const counts = {};
  await Promise.all(
    userIdList.map(async (userId) => {
      counts[userId] = await redis.zcard(keys.history(userId));
    }),
  );
  return counts;
}

export async function getScoreHistory(userId, page = 1, limit = 20) {
  const redis = await getRedis();
  const key = keys.history(userId);

  const total = await redis.zcard(key);
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const entryIds = await redis.zrevrange(key, start, end);

  if (entryIds.length === 0) return { scores: [], pagination: { page, limit, total } };

  const raw = await Promise.all(entryIds.map((id) => redis.hgetall(keys.historyEntry(id))));

  const gameIds = [...new Set(raw.map((r) => r.gameId).filter(Boolean))];
  const gameNames = new Map();
  await Promise.all(
    gameIds.map(async (gid) => {
      try {
        const game = await getGame(gid);
        gameNames.set(gid, game.name);
      } catch {
        gameNames.set(gid, gid);
      }
    }),
  );

  const scores = raw.map((entry) => ({
    id: entry.id || undefined,
    gameId: entry.gameId,
    gameName: gameNames.get(entry.gameId) || entry.gameId,
    score: Number.parseFloat(entry.score),
    submittedAt: entry.createdAt,
  }));

  return { scores, pagination: { page, limit, total } };
}