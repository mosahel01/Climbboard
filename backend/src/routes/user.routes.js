import { Router } from 'express';
import { param } from 'express-validator';
import {
  userProfileController,
  userStatsController,
  publicProfileController,
  userDashboardController,
  userAchievementsController,
  followUserController,
  unfollowUserController,
  myFollowingController,
  userFollowersController,
} from '../controllers/user.controller.js';
import { scoreHistoryController } from '../controllers/score.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import { validate, isId } from '../middleware/validate.middleware.js';

const router = Router();

router.get('/me', requireAuth, userProfileController);
router.get('/me/dashboard', requireAuth, userDashboardController);
router.get('/me/stats', requireAuth, userStatsController);
router.get('/me/scores', requireAuth, scoreHistoryController);
router.get('/me/achievements', requireAuth, userAchievementsController);
router.get('/me/following', requireAuth, myFollowingController);
router.post(
  '/:userId/follow',
  requireAuth,
  [param('userId').custom(isId), validate],
  followUserController,
);
router.delete(
  '/:userId/follow',
  requireAuth,
  [param('userId').custom(isId), validate],
  unfollowUserController,
);
router.get(
  '/:userId/followers',
  [param('userId').custom(isId), validate],
  optionalAuth,
  userFollowersController,
);
router.get(
  '/:userId',
  [param('userId').custom(isId), validate],
  optionalAuth,
  publicProfileController,
);

export default router;