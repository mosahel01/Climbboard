import { Router } from 'express';
import { param, body } from 'express-validator';
import {
  adminOverviewController,
  adminUsersController,
  adminUpdateUserController,
  adminDeleteUserController,
  adminGamesController,
} from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../services/admin.service.js';
import { validate, isId } from '../middleware/validate.middleware.js';

const router = Router();

router.get('/overview', requireAuth, requireAdmin(), adminOverviewController);
router.get('/users', requireAuth, requireAdmin(), adminUsersController);
router.get('/games', requireAuth, requireAdmin(), adminGamesController);
router.patch(
  '/users/:userId',
  requireAuth,
  requireAdmin(),
  [
    param('userId').custom(isId),
    body('role').optional().isIn(['user', 'admin']),
    body('banned').optional().isBoolean(),
    validate,
  ],
  adminUpdateUserController,
);
router.delete(
  '/users/:userId',
  requireAuth,
  requireAdmin(),
  [param('userId').custom(isId), validate],
  adminDeleteUserController,
);

export default router;