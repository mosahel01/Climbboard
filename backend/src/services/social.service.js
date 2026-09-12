import { getRedis } from '../config/redis.js';
import { keys } from '../utils/keys.js';
import { getUserById } from './auth.service.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export async function getFollowState(userId, targetId) {
  const redis = await getRedis();
  const [following, followers, iFollow] = await Promise.all([
    redis.zcard(keys.social.following(userId)),
    redis.zcard(keys.social.followers(userId)),
    targetId ? redis.zscore(keys.social.following(userId), targetId) : null,
  ]);
  return {
    followingCount: following,
    followerCount: followers,
    isFollowing: !!iFollow,
  };
}

export async function follow(followerId, targetId) {
  if (followerId === targetId) {
    throw new BadRequestError('You cannot follow yourself.', 'CANNOT_FOLLOW_SELF');
  }
  const redis = await getRedis();
  const target = await getUserById(targetId);
  if (!target) throw new NotFoundError('User not found.', 'USER_NOT_FOUND');

  const now = Date.now();
  await redis
    .pipeline()
    .zadd(keys.social.following(followerId), now, targetId)
    .zadd(keys.social.followers(targetId), now, followerId)
    .exec();

  return getFollowState(followerId, targetId);
}

export async function unfollow(followerId, targetId) {
  const redis = await getRedis();
  await redis
    .pipeline()
    .zrem(keys.social.following(followerId), targetId)
    .zrem(keys.social.followers(targetId), followerId)
    .exec();
  return getFollowState(followerId, targetId);
}

async function resolveUsers(sortedIds) {
  const redis = await getRedis();
  const users = await Promise.all(
    sortedIds.map(async (userId) => {
      const user = await getUserById(userId);
      if (!user) return null;
      const [state, globalRank] = await Promise.all([
        getFollowState(userId, null),
        redis.zrevrank(keys.globalLeaderboard(), userId),
      ]);
      return {
        userId,
        username: user.username,
        role: user.role,
        globalRank: globalRank == null ? null : globalRank + 1,
        followerCount: state.followerCount,
        followingCount: state.followingCount,
      };
    }),
  );
  return users.filter(Boolean);
}

export async function getFollowing(userId, limit = 50) {
  const redis = await getRedis();
  const ids = await redis.zrevrange(keys.social.following(userId), 0, limit - 1);
  return resolveUsers(ids);
}

export async function getFollowers(userId, limit = 50) {
  const redis = await getRedis();
  const ids = await redis.zrevrange(keys.social.followers(userId), 0, limit - 1);
  return resolveUsers(ids);
}

export async function isFollowing(followerId, targetId) {
  if (!followerId) return false;
  const redis = await getRedis();
  return !!(await redis.zscore(keys.social.following(followerId), targetId));
}