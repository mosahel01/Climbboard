import { listGames, getGame } from '../services/game.service.js';
import { getUserRank } from '../services/leaderboard.service.js';
import { getUserStatsByGame } from '../services/score.service.js';

export async function listGamesController(req, res, next) {
  try {
    const games = await listGames();

    const myStats = req.user ? await getUserStatsByGame(req.user.userId) : {};

    const data = await Promise.all(
      games.map(async (game) => {
        let my = { score: null, rank: null };
        if (req.user) {
          my = await getUserRank(game.id, req.user.userId);
        }
        return { ...game, myScore: my.score, myRank: my.rank, myStats: myStats[game.id] || null };
      }),
    );

    return res.status(200).json({ success: true, data: { games: data } });
  } catch (err) {
    return next(err);
  }
}

export async function getGameController(req, res, next) {
  try {
    const game = await getGame(req.params.gameId);

    let my = { score: null, rank: null };
    let myStats = null;
    if (req.user) {
      my = await getUserRank(game.id, req.user.userId);
      myStats = (await getUserStatsByGame(req.user.userId))[game.id] || null;
    }

    return res.status(200).json({
      success: true,
      data: { game: { ...game, myScore: my.score, myRank: my.rank, myStats } },
    });
  } catch (err) {
    return next(err);
  }
}