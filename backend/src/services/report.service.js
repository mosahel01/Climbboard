import { getRedis } from '../config/redis.js';
import { keys } from '../utils/keys.js';
import { getUserById } from './auth.service.js';
import { AppError } from '../utils/errors.js';

/**
 * Period-based "top players" report.
 *
 * Redis zsets only store the CURRENT best score - they cannot answer
 * arbitrary historical questions like "best players between two dates".
 * So this report reads the per-user history zsets (ordered by timestamp)
 * and aggregates scores in the requested window.
 *
 * Tradeoff: this is O(users) with each user limited to the entries inside
 * the window. It is efficient for this project's scale and keeps Redis
 * as the single data store. See README "Design decisions & tradeoffs".
 */
export async function topPlayers({ from, to, limit = 10 }) {
  const redis = await getRedis();

  const fromTs = toTimestamp(from, true);
  const toTs = toTimestamp(to, false);

  if (fromTs > toTs) {
    throw new AppError('`from` must be before or equal to `to`.', 422, 'INVALID_DATE_RANGE');
  }

  const userIds = await redis.smembers(keys.allUserIds());

  const aggregated = [];

  for (const userId of userIds) {
    const entryIds = await redis.zrangebyscore(keys.history(userId), fromTs, toTs);
    if (entryIds.length === 0) continue;

    const entries = await Promise.all(
      entryIds.map((id) => redis.hgetall(keys.historyEntry(id)).then((e) => ({ ...e, id }))),
    );

    const games = new Set(entries.map((e) => e.gameId).filter(Boolean));
    let totalScore = 0;
    let bestScore = 0;
    for (const entry of entries) {
      const score = Number.parseFloat(entry.score) || 0;
      totalScore += score;
      if (score > bestScore) bestScore = score;
    }

    const user = await getUserById(userId);
    aggregated.push({
      userId,
      username: user ? user.username : 'Unknown',
      totalScore,
      numberOfSubmissions: entries.length,
      bestScore,
      gamesPlayed: games.size,
    });
  }

  aggregated.sort((a, b) => b.totalScore - a.totalScore);

  const ranked = aggregated.slice(0, limit).map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));

  return { range: { from, to }, entries: ranked };
}

function toTimestamp(dateStr, startOfDay) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Invalid date: "${dateStr}". Use YYYY-MM-DD.`, 422, 'INVALID_DATE');
  }
  if (startOfDay) {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }
  return date.getTime();
}