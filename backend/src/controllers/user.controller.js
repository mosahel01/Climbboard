import { getMe } from '../services/auth.service.js';
import { getPlayerProfile, getDashboardData } from '../services/user.service.js';
import { getScoreHistory } from '../services/score.service.js';
import { getUserStats } from '../services/leaderboard.service.js';
import { getUserById } from '../services/auth.service.js';
import { follow, unfollow, getFollowState, getFollowing, getFollowers, isFollowing } from '../services/social.service.js';
import { getAchievements } from '../services/achievement.service.js';
import { NotFoundError } from '../utils/errors.js';

export async function userProfileController(req, res, next) {
  try {
    const profile = await getPlayerProfile(req.user.userId);
    const social = await getFollowState(req.user.userId, null);
    return res.status(200).json({ success: true, data: { ...profile, social } });
  } catch (err) {
    return next(err);
  }
}

export async function userDashboardController(req, res, next) {
  try {
    const data = await getDashboardData(req.user.userId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

export async function userStatsController(req, res, next) {
  try {
    const stats = await getUserStats(req.user.userId);
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    return next(err);
  }
}

export async function userAchievementsController(req, res, next) {
  try {
    const data = await getAchievements(req.user.userId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

export async function publicProfileController(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await getUserById(userId);
    if (!user) throw new NotFoundError('User not found.', 'USER_NOT_FOUND');

    const isSelf = req.user?.userId === userId;
    const profile = await getPlayerProfile(userId);
    if (!isSelf) delete profile.user.email;

    const [ownState, iFollow] = await Promise.all([
      getFollowState(userId, null),
      isFollowing(req.user?.userId, userId),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...profile,
        social: { ...ownState, isFollowing: iFollow },
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function followUserController(req, res, next) {
  try {
    const state = await follow(req.user.userId, req.params.userId);
    return res.status(200).json({ success: true, data: state });
  } catch (err) {
    return next(err);
  }
}

export async function unfollowUserController(req, res, next) {
  try {
    const state = await unfollow(req.user.userId, req.params.userId);
    return res.status(200).json({ success: true, data: state });
  } catch (err) {
    return next(err);
  }
}

export async function myFollowingController(req, res, next) {
  try {
    const following = await getFollowing(req.user.userId);
    return res.status(200).json({ success: true, data: { following } });
  } catch (err) {
    return next(err);
  }
}

export async function userFollowersController(req, res, next) {
  try {
    const followers = await getFollowers(req.params.userId);
    return res.status(200).json({ success: true, data: { followers } });
  } catch (err) {
    return next(err);
  }
}