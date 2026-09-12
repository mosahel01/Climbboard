import { getRedis } from '../config/redis.js';
import { keys } from '../utils/keys.js';
import { NotFoundError } from '../utils/errors.js';

const toGame = (gameId, game) => ({
  id: gameId,
  icon: game.icon || '🎮',
  name: game.name,
  difficulty: game.difficulty || 'Medium',
  tagline: game.tagline || '',
  description: game.description,
  createdAt: game.createdAt,
});

export async function listGames() {
  const redis = await getRedis();
  const ids = await redis.smembers(keys.allGameIds());
  if (ids.length === 0) return [];

  const entries = await Promise.all(
    ids.map(async (gameId) => {
      const game = await redis.hgetall(keys.game(gameId));
      return toGame(gameId, game);
    }),
  );

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getGame(gameId) {
  const redis = await getRedis();
  const game = await redis.hgetall(keys.game(gameId));
  if (!game.name) throw new NotFoundError('The requested game does not exist.', 'GAME_NOT_FOUND');
  return toGame(gameId, game);
}

export async function gameExists(gameId) {
  const redis = await getRedis();
  return (await redis.sismember(keys.allGameIds(), gameId)) === 1;
}