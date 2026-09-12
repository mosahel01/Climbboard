import { Router } from 'express';
import { body } from 'express-validator';
import { registerController, loginController, meController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    validate,
  ],
  registerController,
);

router.post(
  '/login',
  [body('email').isEmail().withMessage('A valid email is required.'), body('password').notEmpty().withMessage('Password is required.'), validate],
  loginController,
);

router.get('/me', requireAuth, meController);

export default router;