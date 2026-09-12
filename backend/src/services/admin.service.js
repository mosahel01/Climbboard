import { getRedis } from '../config/redis.js';
import { keys } from '../utils/keys.js';
import { getUserById, toPublicUser } from './auth.service.js';
import { getGame } from './game.service.js';
import { AppError, NotFoundError, BadRequestError } from '../utils/errors.js';

const ROLES = ['user', 'admin'];

export async function getOverview() {
  const redis = await getRedis();
  const [users, games, submissions, activityCount] = await Promise.all([
    redis.scard(keys.allUserIds()),
    redis.scard(keys.allGameIds()),
    redis.get(keys.counters.submissions()),
    redis.llen(keys.activityFeed()),
  ]);
  return {
    users,
    games,
    submissions: Number.parseInt(submissions || '0', 10),
    activityCount,
  };
}

async function enrichUser(userId, includeEmail = false) {
  const redis = await getRedis();
  const user = await getUserById(userId);
  if (!user) return null;

  const gameIds = await redis.smembers(keys.allGameIds());
  let totalBest = 0;
  for (const gameId of gameIds) {
    const s = await redis.zscore(keys.leaderboard(gameId), userId);
    if (s) totalBest += Number.parseFloat(s);
  }
  const [submissions, badgeCount, globalRank] = await Promise.all([
    redis.zcard(keys.history(userId)),
    redis.scard(keys.userBadges(userId)),
    redis.zrevrank(keys.globalLeaderboard(), userId),
  ]);

  const publicUser = toPublicUser(user);
  return {
    userId,
    username: publicUser.username,
    email: includeEmail ? publicUser.email : undefined,
    role: publicUser.role,
    banned: publicUser.banned,
    createdAt: publicUser.createdAt,
    submissions,
    badges: badgeCount,
    totalBestScore: Math.round(totalBest),
    globalRank: globalRank == null ? null : globalRank + 1,
  };
}

export async function listUsers({ page = 1, limit = 20, sort = 'global', q = '' } = {}) {
  const redis = await getRedis();
  const userIds = await redis.smembers(keys.allUserIds());

  let rows = [];
  for (const userId of userIds) {
    const row = await enrichUser(userId, true);
    if (row) rows.push(row);
  }

  if (q.trim()) {
    const needle = q.trim().toLowerCase();
    rows = rows.filter(
      (r) => r.username.toLowerCase().includes(needle) || (r.email && r.email.toLowerCase().includes(needle)),
    );
  }

  rows.sort((a, b) => {
    if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === 'name') return a.username.localeCompare(b.username);
    const ar = a.globalRank ?? Infinity;
    const br = b.globalRank ?? Infinity;
    return ar - br;
  });

  const total = rows.length;
  const start = (page - 1) * limit;
  const data = rows.slice(start, start + limit);
  return { data, pagination: { page, limit, total } };
}

export async function updateUser(actorId, userId, { role, banned }) {
  if (actorId === userId) {
    throw new BadRequestError('You cannot change your own account.', 'SELF_MODIFICATION');
  }
  const redis = await getRedis();
  const user = await getUserById(userId);
  if (!user) throw new NotFoundError('User not found.', 'USER_NOT_FOUND');

  const updates = {};
  if (role != null) {
    if (!ROLES.includes(role)) throw new BadRequestError('Role must be "user" or "admin".', 'INVALID_ROLE');
    updates.role = role;
  }
  if (banned != null) {
    if (typeof banned !== 'boolean') throw new BadRequestError('Banned must be a boolean.', 'INVALID_BANNED');
    updates.banned = banned ? '1' : '0';
  }

  if (Object.keys(updates).length > 0) {
    await redis.hset(keys.user(userId), updates);
  }

  return enrichUser(userId, true);
}

export async function deleteUser(actorId, userId) {
  if (actorId === userId) {
    throw new BadRequestError('You cannot delete your own account.', 'SELF_MODIFICATION');
  }
  const redis = await getRedis();
  const user = await getUserById(userId);
  if (!user) throw new NotFoundError('User not found.', 'USER_NOT_FOUND');

  const [historyIds, gameIds, allUsers] = await Promise.all([
    redis.zrange(keys.history(userId), 0, -1),
    redis.smembers(keys.allGameIds()),
    redis.smembers(keys.allUserIds()),
  ]);

  const pipeline = redis.pipeline();
  pipeline.del(keys.user(userId));
  pipeline.hdel(keys.userNameIndex(), user.username);
  pipeline.hdel(keys.userEmailIndex(), user.email);
  pipeline.srem(keys.allUserIds(), userId);
  pipeline.del(keys.userBadges(userId));
  pipeline.del(keys.userMaxJump(userId));
  pipeline.del(keys.social.following(userId));
  pipeline.del(keys.social.followers(userId));
  pipeline.del(keys.history(userId));

  for (const entryId of historyIds) pipeline.del(keys.historyEntry(entryId));
  for (const gameId of gameIds) {
    pipeline.zrem(keys.leaderboard(gameId), userId);
    pipeline.hdel(keys.movement(gameId), userId);
  }
  pipeline.zrem(keys.globalLeaderboard(), userId);

  for (const otherId of allUsers) {
    pipeline.zrem(keys.social.following(otherId), userId);
    pipeline.zrem(keys.social.followers(otherId), userId);
  }

  await pipeline.exec();
  return { userId };
}

export async function listGamesOverview() {
  const redis = await getRedis();
  const gameIds = await redis.smembers(keys.allGameIds());

  const games = await Promise.all(
    gameIds.map(async (gameId) => {
      let meta = null;
      try {
        meta = await getGame(gameId);
      } catch {
        meta = { name: gameId, icon: '🎮' };
      }
      const [players, submissions, topRaw] = await Promise.all([
        redis.zcard(keys.leaderboard(gameId)),
        redis.get(keys.counters.gameSubmissions(gameId)),
        redis.zrevrange(keys.leaderboard(gameId), 0, 0, 'WITHSCORES'),
      ]);
      let topScore = null;
      let topPlayer = null;
      if (topRaw.length >= 2) {
        topScore = Number.parseFloat(topRaw[1]);
        const leader = await getUserById(topRaw[0]);
        topPlayer = leader ? leader.username : 'Unknown';
      }
      return {
        gameId,
        name: meta.name,
        icon: meta.icon,
        difficulty: meta.difficulty,
        players,
        submissions: Number.parseInt(submissions || '0', 10),
        topScore,
        topPlayer,
      };
    }),
  );

  games.sort((a, b) => a.name.localeCompare(b.name));
  return { games };
}

export function requireAdmin() {
  return async (req, _res, next) => {
    try {
      const user = await getUserById(req.user.userId);
      if (!user || user.role !== 'admin') {
        throw new AppError('Admin access required.', 403, 'ADMIN_ONLY');
      }
      if (user.banned === '1' || user.banned === 'true') {
        throw new AppError('This account has been banned.', 403, 'ACCOUNT_BANNED');
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}