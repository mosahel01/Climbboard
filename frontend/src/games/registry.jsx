import MathChallenge from './MathChallenge.jsx';
import MemoryChallenge from './MemoryChallenge.jsx';
import SpeedRun from './SpeedRun.jsx';
import PuzzleMaster from './PuzzleMaster.jsx';
import WordRush from './WordRush.jsx';
import FlashReaction from './FlashReaction.jsx';
import ColorStroop from './ColorStroop.jsx';

export const GAME_COMPONENTS = {
  'g-1': SpeedRun,
  'g-2': PuzzleMaster,
  'g-3': MathChallenge,
  'g-4': WordRush,
  'g-5': MemoryChallenge,
  'g-6': FlashReaction,
  'g-7': ColorStroop,
};

export const DIFFICULTY_KEYS = ['easy', 'normal', 'hard'];

export const DIFFICULTY_LABELS = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };

const DIFFICULTY_PRESETS = {
  'g-1': {
    easy: { duration: 45 },
    normal: { duration: 30 },
    hard: { duration: 20, life: 1200 },
  },
  'g-2': {
    easy: { shuffle: 250 },
    normal: { shuffle: 400 },
    hard: { shuffle: 600 },
  },
  'g-3': {
    easy: { duration: 60, levelSize: 3 },
    normal: { duration: 45, levelSize: 3 },
    hard: { duration: 30, levelSize: 4 },
  },
  'g-4': {
    easy: { duration: 60 },
    normal: { duration: 45 },
    hard: { duration: 30 },
  },
  'g-5': {
    easy: { pairs: 6, columns: 4 },
    normal: { pairs: 8, columns: 4 },
    hard: { pairs: 10, columns: 5 },
  },
  'g-6': {
    easy: { rounds: 5 },
    normal: { rounds: 7 },
    hard: { rounds: 10 },
  },
  'g-7': {
    easy: { duration: 60 },
    normal: { duration: 45 },
    hard: { duration: 30 },
  },
};

const HOW_TO = {
  'g-1': [
    'Tap every target before it escapes the arena.',
    'Each hit grows your combo and your score.',
    'Let a target vanish and your combo resets.',
    'You have 30 seconds — go!',
  ],
  'g-2': [
    'Slide tiles one at a time to rebuild the 1–8 sequence.',
    'Click a tile (or press arrow keys) to move it into the blank.',
    'Fewer moves and quicker solves earn the big scores.',
  ],
  'g-3': [
    'Answer the arithmetic as fast as you can.',
    'Each correct answer builds a streak multiplier.',
    'One wrong answer resets your streak.',
    'You have 60 seconds — go!',
  ],
  'g-4': [
    'Words rain in — start typing to lock onto the active word.',
    'Complete it letter-perfect to bank it.',
    'Long words pay more and streaks multiply the bonus.',
    'One wrong key breaks your streak. 60 seconds on the clock.',
  ],
  'g-5': [
    'Flip two tiles at a time to find matching pairs.',
    'Matched pairs stay open; mismatches flip back.',
    'Finish faster and with fewer moves for a higher score.',
  ],
  'g-6': [
    'React to the target the instant it appears.',
    'Press the moment it pops — every millisecond counts.',
    'Click during the wait and it’s a false start — penalty applied.',
    'The faster you react across all rounds, the bigger the score.',
  ],
  'g-7': [
    'A color word is shown in a different ink than it spells.',
    'Match the INK color, not the word meaning.',
    'Correct answers build a streak multiplier.',
    'Harder rounds give you less time on the clock.',
  ],
};

export function getGameComponent(gameId) {
  return GAME_COMPONENTS[gameId] || null;
}

export function getHowTo(gameId) {
  return HOW_TO[gameId] || [];
}

export function getDifficultyPresets(gameId) {
  return DIFFICULTY_PRESETS[gameId] || null;
}

export function resolveDifficulty(gameDifficulty) {
  const key = String(gameDifficulty || '').toLowerCase();
  if (DIFFICULTY_KEYS.includes(key)) return key;
  if (key === 'easy') return 'easy';
  if (key === 'medium') return 'normal';
  if (key === 'hard') return 'hard';
  return 'normal';
}