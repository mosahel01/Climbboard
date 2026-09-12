import { Router } from 'express';
import { globalLeaderboardController } from '../controllers/leaderboard.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/global', optionalAuth, globalLeaderboardController);

export default router;