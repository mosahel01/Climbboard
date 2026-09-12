import { Router } from 'express';
import { activityController } from '../controllers/score.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', optionalAuth, activityController);

export default router;