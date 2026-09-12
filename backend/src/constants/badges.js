export const BADGES = {
  rookie: { id: 'rookie', name: 'Rookie', emoji: '🌱', description: 'Submitted your first score.' },
  hotshot: { id: 'hotshot', name: 'Hotshot', emoji: '🔥', description: 'Reached a personal best of 1,000 in a game.' },
  veteran: { id: 'veteran', name: 'Veteran', emoji: '🎖️', description: 'Reached a personal best of 5,000 in a game.' },
  legend: { id: 'legend', name: 'Legend', emoji: '🏅', description: 'Reached a personal best of 10,000 in a game.' },
  top_ten: { id: 'top_ten', name: 'Top Ten', emoji: '🔟', description: 'Placed in the top 10 of a game leaderboard.' },
  podium: { id: 'podium', name: 'Podium', emoji: '🥉', description: 'Placed on the podium (top 3) of a game.' },
  chart_topper: { id: 'chart_topper', name: 'Chart Topper', emoji: '👑', description: 'Hit the #1 spot in a game leaderboard.' },
  all_rounder: { id: 'all_rounder', name: 'All-Rounder', emoji: '🧰', description: 'Played 3 or more different games.' },
  complete_set: { id: 'complete_set', name: 'Complete Set', emoji: '👾', description: 'Played every available game.' },
  marathoner: { id: 'marathoner', name: 'Marathoner', emoji: '🏃‍♀️', description: 'Recorded 20+ submissions.' },
  market_mover: { id: 'market_mover', name: 'Market Mover', emoji: '📈', description: 'Moved up 3+ ranks in a single submission.' },
};

export const BADGE_LIST = Object.values(BADGES);

export function badgeInfo(id) {
  return BADGES[id] || { id, name: id, emoji: '🏅', description: '' };
}