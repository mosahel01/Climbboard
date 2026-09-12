import { getRedis } from '../config/redis.js';
import { keys } from '../utils/keys.js';
import { badgeInfo, BADGE_LIST } from '../constants/badges.js';
import { getUserBadges } from './badge.service.js';

/**
 * Compute live progress for every badge. Returns the full badge catalogue
 * plus the caller's earned set, so the UI can show progress bars and "next up".
 */
export async function getAchievements(userId) {
  const redis = await getRedis();
  const gameIds = await redis.smembers(keys.allGameIds());

  const [totalSubmissions, earned, maxJumpRaw] = await Promise.all([
    redis.zcard(keys.history(userId)),
    getUserBadges(userId),
    redis.zscore(keys.userMaxJump(userId), 'max'),
  ]);

  let bestScore = 0;
  let bestRank = Infinity;
  let gamesPlayed = 0;

  for (const gameId of gameIds) {
    const [scoreRaw, rankRaw] = await Promise.all([
      redis.zscore(keys.leaderboard(gameId), userId),
      redis.zrevrank(keys.leaderboard(gameId), userId),
    ]);
    if (scoreRaw == null) continue;
    const score = Number.parseFloat(scoreRaw);
    const rank = rankRaw + 1;
    gamesPlayed += 1;
    if (score > bestScore) bestScore = score;
    if (rank < bestRank) bestRank = rank;
  }

  const totalGames = gameIds.length;
  const maxJump = maxJumpRaw == null ? 0 : Number.parseInt(maxJumpRaw, 10);
  const earnedIds = new Set(earned.map((b) => b.id.split(':').pop()));

  const pct = (current, target) => Math.max(0, Math.min(100, Math.round((current / target) * 100)));
  const rankPct = (rank, target) =>
    rank == null ? 0 : rank <= target ? 100 : Math.min(90, Math.round((target / rank) * 100));

  const rows = BADGE_LIST.map((badge) => {
    let current;
    let target;
    let progress;

    switch (badge.id) {
      case 'rookie':
        current = totalSubmissions;
        target = 1;
        progress = pct(current, target);
        break;
      case 'marathoner':
        current = totalSubmissions;
        target = 20;
        progress = pct(current, target);
        break;
      case 'hotshot':
        current = bestScore;
        target = 1000;
        progress = pct(current, target);
        break;
      case 'veteran':
        current = bestScore;
        target = 5000;
        progress = pct(current, target);
        break;
      case 'legend':
        current = bestScore;
        target = 10000;
        progress = pct(current, target);
        break;
      case 'top_ten':
        current = bestRank === Infinity ? null : bestRank;
        target = 10;
        progress = rankPct(current, target);
        break;
      case 'podium':
        current = bestRank === Infinity ? null : bestRank;
        target = 3;
        progress = rankPct(current, target);
        break;
      case 'chart_topper':
        current = bestRank === Infinity ? null : bestRank;
        target = 1;
        progress = rankPct(current, target);
        break;
      case 'all_rounder':
        current = gamesPlayed;
        target = 3;
        progress = pct(current, target);
        break;
      case 'complete_set':
        current = gamesPlayed;
        target = totalGames;
        progress = pct(current, target);
        break;
      case 'market_mover':
        current = maxJump;
        target = 3;
        progress = pct(current, target);
        break;
      default:
        current = 0;
        target = 1;
        progress = 0;
        break;
    }

    return {
      id: badge.id,
      name: badge.name,
      emoji: badge.emoji,
      description: badge.description,
      earned: earnedIds.has(badge.id),
      current: current == null ? 0 : current,
      target,
      progress: earnedIds.has(badge.id) ? 100 : progress,
    };
  });

  return {
    badges: rows,
    summary: {
      earned: rows.filter((b) => b.earned).length,
      total: rows.length,
    },
  };
}