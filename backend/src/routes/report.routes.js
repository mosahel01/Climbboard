import { Router } from 'express';
import { topPlayersController } from '../controllers/report.controller.js';

const router = Router();

router.get('/top-players', topPlayersController);

export default router;