import { topPlayers } from '../services/report.service.js';
import { UnprocessableError } from '../utils/errors.js';

export async function topPlayersController(req, res, next) {
  try {
    const { from, to } = req.query;
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));

    if (!from || !to) {
      throw new UnprocessableError(
        'Both `from` and `to` query params are required (YYYY-MM-DD).',
        'MISSING_DATE_RANGE',
      );
    }

    const result = await topPlayers({ from, to, limit });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}