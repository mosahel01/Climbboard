import { getRedis } from '../config/redis.js';
import { keys } from '../utils/keys.js';
import { getPublicUser, getUserById } from './auth.service.js';
import { getUserStats } from './leaderboard.service.js';
import { getScoreHistory, getActivityFeed } from './score.service.js';
import { getUserBadges } from './badge.service.js';
import { getGame } from './game.service.js';

export async function getPlayerProfile(userId) {
  const [user, stats, badges, recent] = await Promise.all([
    getPublicUser(userId),
    getUserStats(userId),
    getUserBadges(userId),
    getScoreHistory(userId, 1, 5),
  ]);
  return { user, stats, badges, recentScores: recent.scores };
}

/**
 * Market-style "position" comparisons for a user's home dashboard:
 * how their personal best stacks up against the #1 player in each game,
 * and the global ladder neighbours around their own rank.
 */
async function getLeaderComparison(userId, stats) {
  const redis = await getRedis();

  return Promise.all(
    stats.gamesPlayed.map(async (g) => {
      const mine = g.score;
      let leaderScore = null;
      let leaderName = null;

      const top = await redis.zrevrange(keys.leaderboard(g.gameId), 0, 0, 'WITHSCORES');
      if (top.length >= 2) {
        leaderScore = Number.parseFloat(top[1]);
        const leader = await getUserById(top[0]);
        leaderName = leader ? leader.username : 'Unknown';
      }

      let gameName = g.gameId;
      try {
        gameName = (await getGame(g.gameId)).name;
      } catch {
        /* keep id as fallback */
      }

      return {
        gameId: g.gameId,
        gameName,
        rank: g.rank,
        myScore: mine,
        leaderScore,
        leaderName,
        pctOfLeader: leaderScore ? Math.round((mine / leaderScore) * 100) : null,
      };
    }),
  );
}

async function getGlobalNeighbours(userId) {
  const redis = await getRedis();
  const key = keys.globalLeaderboard();
  const total = await redis.zcard(key);
  if (total === 0) return [];

  const index = await redis.zrevrank(key, userId);
  if (index == null) return [];

  const start = Math.max(0, index - 3);
  const end = Math.min(total - 1, index + 3);
  const raw = await redis.zrevrange(key, start, end, 'WITHSCORES');

  const neighbours = [];
  for (let i = 0; i < raw.length; i += 2) {
    const id = raw[i];
    const user = await getUserById(id);
    neighbours.push({
      rank: start + i / 2 + 1,
      userId: id,
      username: user ? user.username : 'Unknown',
      score: Number.parseFloat(raw[i + 1]),
      isMe: id === userId,
    });
  }
  return neighbours;
}

export async function getDashboardData(userId) {
  const [user, stats, badges, recent, activity] = await Promise.all([
    getPublicUser(userId),
    getUserStats(userId),
    getUserBadges(userId),
    getScoreHistory(userId, 1, 5),
    getActivityFeed(30),
  ]);

  const [leaderComparison, globalNeighbours] = await Promise.all([
    getLeaderComparison(userId, stats),
    getGlobalNeighbours(userId),
  ]);

  return {
    user,
    stats,
    badges,
    recentScores: recent.scores,
    activity,
    leaderComparison,
    globalNeighbours,
  };
}