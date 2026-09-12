import { getRedis } from '../config/redis.js';
import { keys } from '../utils/keys.js';
import { badgeInfo } from '../constants/badges.js';

export async function getUserBadges(userId) {
  const redis = await getRedis();
  const ids = await redis.smembers(keys.userBadges(userId));
  return ids.map(badgeInfo);
}

/**
 * Recompute which badges a user has earned based on their current state
 * and award any newly earned ones. Returns the list of new badge ids.
 */
export async function awardBadges(userId, { rankJump = 0 } = {}) {
  const redis = await getRedis();

  const [gameIds, totalSubmissions] = await Promise.all([
    redis.smembers(keys.allGameIds()),
    redis.zcard(keys.history(userId)),
  ]);

  let bestScore = 0;
  let bestRank = Infinity;
  let gamesPlayed = 0;

  for (const gameId of gameIds) {
    const score = await redis.zscore(keys.leaderboard(gameId), userId);
    if (score == null) continue;
    const rank = (await redis.zrevrank(keys.leaderboard(gameId), userId)) + 1;
    gamesPlayed += 1;
    if (score > bestScore) bestScore = score;
    if (rank < bestRank) bestRank = rank;
  }

  const earned = new Set();
  if (totalSubmissions >= 1) earned.add('rookie');
  if (totalSubmissions >= 20) earned.add('marathoner');
  if (bestScore >= 1000) earned.add('hotshot');
  if (bestScore >= 5000) earned.add('veteran');
  if (bestScore >= 10000) earned.add('legend');
  if (bestRank <= 10) earned.add('top_ten');
  if (bestRank <= 3) earned.add('podium');
  if (bestRank === 1) earned.add('chart_topper');
  if (rankJump >= 3) earned.add('market_mover');
  if (gamesPlayed >= 3) earned.add('all_rounder');
  if (gameIds.length > 0 && gamesPlayed === gameIds.length) earned.add('complete_set');

  if (earned.size === 0) return [];

  const previous = await redis.smembers(keys.userBadges(userId));
  const newIds = [...earned].filter((id) => !previous.includes(id));

  if (newIds.length > 0) {
    await redis.sadd(keys.userBadges(userId), ...earned);
  }

  return newIds;
}