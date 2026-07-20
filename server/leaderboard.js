// In-memory leaderboard — resets on server restart (intentional)
const MAX_ENTRIES = 50;
const TOP_N = 20;

const soloLeaderboard = [];
const multiLeaderboard = [];

function sortAndSlice(arr) {
  arr.sort((a, b) => b.wpm - a.wpm);
  if (arr.length > MAX_ENTRIES) arr.splice(MAX_ENTRIES);
}

function addSoloEntry({ username, wpm, accuracy, difficulty }) {
  soloLeaderboard.push({
    username: String(username || "Anonymous").trim().slice(0, 20),
    wpm: Number(wpm) || 0,
    accuracy: Number(accuracy) || 0,
    difficulty: String(difficulty || "medium"),
    timestamp: Date.now()
  });
  sortAndSlice(soloLeaderboard);
}

function addMultiEntry({ username, wpm, accuracy }) {
  multiLeaderboard.push({
    username: String(username || "Anonymous").trim().slice(0, 20),
    wpm: Number(wpm) || 0,
    accuracy: Number(accuracy) || 0,
    timestamp: Date.now()
  });
  sortAndSlice(multiLeaderboard);
}

function getSoloTop(n = TOP_N, difficulty = "all") {
  const filtered =
    difficulty && difficulty !== "all"
      ? soloLeaderboard.filter((e) => e.difficulty === difficulty)
      : soloLeaderboard;
  return filtered.slice(0, n);
}

function getMultiTop(n = TOP_N) {
  return multiLeaderboard.slice(0, n);
}

module.exports = { addSoloEntry, addMultiEntry, getSoloTop, getMultiTop };
