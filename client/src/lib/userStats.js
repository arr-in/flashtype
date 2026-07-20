// userStats.js — localStorage stats management

const LS_KEY = "flashtype_user";

const DEFAULT_DIFFICULTY_STAT = () => ({ bestWPM: 0, bestAccuracy: 0, gamesPlayed: 0 });

const DEFAULT_STATS = () => ({
  username: "",
  soloStats: {
    beginner: DEFAULT_DIFFICULTY_STAT(),
    easy: DEFAULT_DIFFICULTY_STAT(),
    medium: DEFAULT_DIFFICULTY_STAT(),
    hard: DEFAULT_DIFFICULTY_STAT(),
    expert: DEFAULT_DIFFICULTY_STAT()
  },
  multiplayerStats: {
    wins: 0,
    races: 0,
    bestWPM: 0,
    bestAccuracy: 0
  }
});

export function getUserStats() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_STATS();
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle missing keys from older saves
    const def = DEFAULT_STATS();
    return {
      username: parsed.username || def.username,
      soloStats: {
        beginner: { ...def.soloStats.beginner, ...(parsed.soloStats?.beginner || {}) },
        easy:     { ...def.soloStats.easy,     ...(parsed.soloStats?.easy     || {}) },
        medium:   { ...def.soloStats.medium,   ...(parsed.soloStats?.medium   || {}) },
        hard:     { ...def.soloStats.hard,     ...(parsed.soloStats?.hard     || {}) },
        expert:   { ...def.soloStats.expert,   ...(parsed.soloStats?.expert   || {}) }
      },
      multiplayerStats: { ...def.multiplayerStats, ...(parsed.multiplayerStats || {}) }
    };
  } catch {
    return DEFAULT_STATS();
  }
}

export function saveUserStats(stats) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(stats));
  } catch {
    // Silently fail if storage is full
  }
}

export function updateSoloStats(difficulty, wpm, accuracy) {
  const stats = getUserStats();
  const key = difficulty in stats.soloStats ? difficulty : "medium";
  const current = stats.soloStats[key];
  stats.soloStats[key] = {
    bestWPM: Math.max(current.bestWPM, wpm),
    bestAccuracy: Math.max(current.bestAccuracy, accuracy),
    gamesPlayed: current.gamesPlayed + 1
  };
  // Also sync username from localStorage
  const username = localStorage.getItem("username") || stats.username;
  if (username) stats.username = username;
  saveUserStats(stats);
  return stats;
}

export function updateMultiStats(wpm, accuracy, won = false) {
  const stats = getUserStats();
  const mp = stats.multiplayerStats;
  stats.multiplayerStats = {
    wins: mp.wins + (won ? 1 : 0),
    races: mp.races + 1,
    bestWPM: Math.max(mp.bestWPM, wpm),
    bestAccuracy: Math.max(mp.bestAccuracy, accuracy)
  };
  const username = localStorage.getItem("username") || stats.username;
  if (username) stats.username = username;
  saveUserStats(stats);
  return stats;
}

export function clearUserStats() {
  localStorage.removeItem(LS_KEY);
}

export function getStoredUsername() {
  return localStorage.getItem("username") || getUserStats().username || "";
}
