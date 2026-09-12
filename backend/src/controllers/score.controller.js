import { submitScore, getScoreHistory, getActivityFeed } from '../services/score.service.js';
import { parsePageQuery } from '../middleware/validate.middleware.js';
import { isFollowing } from '../services/social.service.js';
import { UnauthorizedError } from '../utils/errors.js';

export async function submitScoreController(req, res, next) {
  try {
    const { gameId } = req.params;
    const { score } = req.body;

    const result = await submitScore(req.user.userId, gameId, score);

    const io = req.app.get('io');

    if (io) {
      // Live activity ticker - every submission, broadcast to everyone.
      io.emit('activity:new', result.activity);

      // Leaderboard-specific update - only rooms watching this game.
      if (result.isNewBest) {
        io.to(`lb:${gameId}`).emit('leaderboard:update', {
          gameId,
          updatedUser: {
            userId: req.user.userId,
            username: result.activity.username,
            score: result.score,
            rank: result.rank,
            rankJump: result.rankJump,
          },
        });
        io.emit('global:update', { userId: req.user.userId });
      }
    }

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

export async function scoreHistoryController(req, res, next) {
  try {
    const { page, limit } = parsePageQuery(req);
    const result = await getScoreHistory(req.user.userId, page, limit);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

export async function activityController(req, res, next) {
  try {
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 30));
    let feed = await getActivityFeed(limit);

    if (req.query.feed === 'following') {
      if (!req.user) {
        throw new UnauthorizedError('Log in to see your following feed.', 'AUTH_REQUIRED');
      }
      const hydrated = [];
      for (const entry of feed) {
        if (await isFollowing(req.user.userId, entry.userId)) hydrated.push(entry);
      }
      feed = hydrated;
    }

    return res.status(200).json({ success: true, data: { entries: feed } });
  } catch (err) {
    return next(err);
  }
}