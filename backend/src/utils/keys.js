export const keys = {
  user: (userId) => `user:${userId}`,
  userNameIndex: () => 'user:index:username',
  userEmailIndex: () => 'user:index:email',
  allUserIds: () => 'userIds',
  userBadges: (userId) => `user:${userId}:badges`,
  userMaxJump: (userId) => `user:${userId}:jumps`,

  game: (gameId) => `game:${gameId}`,
  allGameIds: () => 'games',

  leaderboard: (gameId) => `leaderboard:${gameId}`,
  globalLeaderboard: () => 'leaderboard:global',
  movement: (gameId) => `movement:${gameId}`,

  history: (userId) => `history:${userId}`,
  historyEntry: (entryId) => `historyEntry:${entryId}`,

  activityFeed: () => 'activity:feed',

  social: {
    following: (userId) => `social:following:${userId}`,
    followers: (userId) => `social:followers:${userId}`,
  },

  counters: {
    user: () => 'seq:user',
    history: () => 'seq:historyEntry',
    submissions: () => 'counter:submissions',
    gameSubmissions: (gameId) => `counter:submissions:${gameId}`,
  },
};

export function buildUserId(id) {
  return `u-${id}`;
}

export function buildGameId(id) {
  return `g-${id}`;
}

export function buildEntryId(id) {
  return `h-${id}`;
}