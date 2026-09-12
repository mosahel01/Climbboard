import { getLeaderboard, getUserRank, getGlobalLeaderboard } from '../services/leaderboard.service.js';
import { getGame } from '../services/game.service.js';
import { parsePageQuery } from '../middleware/validate.middleware.js';

export async function leaderboardController(req, res, next) {
  try {
    const { page, limit } = parsePageQuery(req);
    const game = await getGame(req.params.gameId);

    const result = await getLeaderboard(game.id, page, limit);

    let currentUser = null;
    if (req.user) {
      const my = await getUserRank(game.id, req.user.userId);
      currentUser = my;
      const visible = result.entries.find((e) => e.userId === req.user.userId);
      if (visible) {
        currentUser.onPage = true;
        currentUser.pageRank = visible.rank;
      } else {
        currentUser.onPage = false;
        currentUser.pageRank = null;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        game: { id: game.id, name: game.name },
        currentUser,
        entries: result.entries,
        pagination: result.pagination,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function rankController(req, res, next) {
  try {
    const game = await getGame(req.params.gameId);
    const result = await getUserRank(game.id, req.user.userId);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

export async function globalLeaderboardController(req, res, next) {
  try {
    const { page, limit } = parsePageQuery(req);
    const result = await getGlobalLeaderboard(page, limit);

    let currentUser = null;
    if (req.user) {
      const my = await getUserRank('global', req.user.userId);
      currentUser = {
        score: my.score,
        rank: my.rank,
        onPage: result.entries.some((e) => e.userId === req.user.userId),
      };
    }

    return res.status(200).json({
      success: true,
      data: { currentUser, entries: result.entries, pagination: result.pagination },
    });
  } catch (err) {
    return next(err);
  }
}