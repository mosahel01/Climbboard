import { Router } from 'express';
import { body, param } from 'express-validator';
import { listGamesController, getGameController } from '../controllers/game.controller.js';
import { leaderboardController, rankController } from '../controllers/leaderboard.controller.js';
import { submitScoreController } from '../controllers/score.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import { validate, isId } from '../middleware/validate.middleware.js';

const router = Router();

router.get('/', optionalAuth, listGamesController);

router.get('/:gameId', [param('gameId').custom(isId), validate], optionalAuth, getGameController);

router.post(
  '/:gameId/scores',
  [
    param('gameId').custom(isId),
    body('score').isInt({ min: 0 }).withMessage('Score must be a non-negative integer.'),
    validate,
  ],
  requireAuth,
  submitScoreController,
);

router.get('/:gameId/leaderboard', [param('gameId').custom(isId), validate], optionalAuth, leaderboardController);

router.get('/:gameId/rank', [param('gameId').custom(isId), validate], requireAuth, rankController);

export default router;