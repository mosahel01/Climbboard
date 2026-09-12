import { getRedis, closeRedis } from '../src/config/redis.js';
import { keys, buildGameId } from '../src/utils/keys.js';
import { register, getUserById } from '../src/services/auth.service.js';
import { submitScore } from '../src/services/score.service.js';

const GAMES = [
  {
    id: buildGameId(1),
    icon: '🏃',
    name: 'Speed Run',
    difficulty: 'Easy',
    tagline: 'Tap fast, chain combos, don’t miss.',
    description: 'Targets pop up all over the arena during a 30-second frenzy. Tap them fast to build a combo multiplier — miss one and your streak resets.',
  },
  {
    id: buildGameId(2),
    icon: '🧩',
    name: 'Puzzle Master',
    difficulty: 'Medium',
    tagline: 'Slide the tiles. Beat the clock.',
    description: 'A classic sliding tiles puzzle. Restore the 3×3 image with as few moves as possible — faster and leaner runs score higher.',
  },
  {
    id: buildGameId(3),
    icon: '🧮',
    name: 'Math Challenge',
    difficulty: 'Easy',
    tagline: 'Rapid-fire arithmetic.',
    description: 'Ten-odd question nonstop for 60 seconds. Chain correct answers to grow a streak multiplier, but one slip resets it.',
  },
  {
    id: buildGameId(4),
    icon: '📖',
    name: 'Word Rush',
    difficulty: 'Hard',
    tagline: 'Type fast, keep the streak.',
    description: 'Words rain down for 60 seconds. Type them letter-perfect to clear them. Long words pay more and streaks multiply your bonus.',
  },
  {
    id: buildGameId(5),
    icon: '🧠',
    name: 'Memory Challenge',
    difficulty: 'Medium',
    tagline: 'Find every pair, fast.',
    description: 'Flip the grid and match all 8 emoji pairs. Fewer moves and less time on the clock mean a much higher score.',
  },
  {
    id: buildGameId(6),
    icon: '⚡',
    name: 'Flash Reaction',
    difficulty: 'Easy',
    tagline: 'React the instant it turns green.',
    description: 'The gauge flips to green at random. Tap it the moment it does — your average reaction time across every round decides your score.',
  },
  {
    id: buildGameId(7),
    icon: '🎨',
    name: 'Color Stroop',
    difficulty: 'Hard',
    tagline: 'Read the ink, not the word.',
    description: 'A colour word is painted in a different shade. Tap the button that matches the INK colour, not the word itself. Fast chaining pays.',
  },
];

const PLAYERS = [
  { username: 'sahil', email: 'sahil@example.com', power: 1.0 },
  { username: 'nova_ray', email: 'nova@example.com', power: 0.95 },
  { username: 'PixelQueen', email: 'pixel@example.com', power: 0.9 },
  { username: 'ByteBrawler', email: 'byte@example.com', power: 0.85 },
  { username: 'zidane', email: 'zidane@example.com', power: 0.82 },
  { username: 'LunaFox', email: 'luna@example.com', power: 0.78 },
  { username: 'MarsKid', email: 'mars@example.com', power: 0.75 },
  { username: 'CodeRacer', email: 'coderacer@example.com', power: 0.72 },
  { username: 'tanuki_boy', email: 'tanuki@example.com', power: 0.68 },
  { username: 'QuantumLet', email: 'quantum@example.com', power: 0.64 },
  { username: 'SwiftArrow', email: 'swift@example.com', power: 0.6 },
  { username: 'NeonNeko', email: 'neon@example.com', power: 0.55 },
  { username: 'DragonFang', email: 'dragon@example.com', power: 0.5 },
  { username: 'OrbitOwl', email: 'orbit@example.com', power: 0.45 },
  { username: 'StarWisp', email: 'star@example.com', power: 0.4 },
  { username: 'MochiMystic', email: 'mochi@example.com', power: 0.35 },
];

// Deterministic PRNG so seeding is reproducible
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function seedGames(redis) {
  for (const game of GAMES) {
    await redis.hset(keys.game(game.id), {
      icon: game.icon,
      name: game.name,
      difficulty: game.difficulty,
      tagline: game.tagline,
      description: game.description,
      createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    });
    await redis.sadd(keys.allGameIds(), game.id);
  }
  console.log(`[seed] ${GAMES.length} games ready`);
}

async function seedPlayers(redis, reset) {
  if (!reset) {
    const existing = await redis.scard(keys.allUserIds());
    if (existing > 0) {
      const known = await redis.hget(keys.userNameIndex(), PLAYERS[0].username);
      if (known) {
        console.log('[seed] users already exist. Use `npm run seed:reset` to wipe and reseed.');
        return true;
      }
    }
  }

  let id = 0;
  const seen = new Set();
  const rand = mulberry32(1234);

  for (const player of PLAYERS) {
    id += 1;
    const base = 900 + Math.round(rand() * 9800); // baseline skill-ish score
    const attempts = 3 + Math.floor(rand() * 3); // 3-5 attempts per game
    const { user } = await register({
      username: player.username,
      email: player.email,
      password: 'password123',
    });
    seen.add(user.id);
    console.log(`[seed] created ${player.username} (${user.id})`);

    for (const game of GAMES) {
      if (rand() < 0.2) continue; // some users skip some games
      const gap = Math.round(base * player.power * (0.6 + rand()));
      let best = gap;
      for (let a = 0; a < attempts; a += 1) {
        const attempt =
          a % 2 === 0
            ? best + Math.round(rand() * 1500) // improve (or tie)
            : Math.max(0, best - Math.round(rand() * 1200)); // dip below best
        await submitScore(user.id, game.id, attempt);
        if (attempt > best) best = attempt;
      }
    }
    console.log(`[seed]   -> ${attempts} attempts across ${GAMES.length} games (every attempt stored in history)`);
  }

  return false;
}

async function seedAdmin(redis) {
  const { user } = await register({
    username: 'admin',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
  });
  console.log(`[seed] created admin (${user.id})`);

  const sahil = await getUserById('u-1');
  if (sahil) {
    await redis.hset(keys.user('u-1'), { role: 'admin' });
    console.log('[seed] promoted sahil to admin');
  }
}

async function run() {
  const reset = process.argv.includes('--reset');
  const redis = await getRedis();

  if (reset) {
    await redis.flushdb();
    console.log('[seed] flushed Redis database');
  }

  await seedGames(redis);
  const alreadySeeded = await seedPlayers(redis, reset);
  if (alreadySeeded) {
    console.log('[seed] nothing to do - run `npm run seed:reset` to recreate demo data.');
  } else {
    await seedAdmin(redis);
    console.log('[seed] seeding complete!');
  }

  const demoAccount = `Demo logins:  ${PLAYERS[0].email} / password123`;
  console.log(demoAccount);

  await closeRedis();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});