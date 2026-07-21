// Persistent leaderboard — saved to leaderboard_data.json on disk
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "leaderboard_data.json");
const MAX_ENTRIES = 100;
const TOP_N = 20;

// ── Load from disk on startup ───────────────────────────────────────
let soloLeaderboard = [];
let multiLeaderboard = [];

function loadFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw);
      soloLeaderboard = Array.isArray(parsed.solo) ? parsed.solo : [];
      multiLeaderboard = Array.isArray(parsed.multi) ? parsed.multi : [];
      console.log(
        `[leaderboard] Loaded ${soloLeaderboard.length} solo + ${multiLeaderboard.length} multi entries from disk`
      );
    }
  } catch (err) {
    console.warn("[leaderboard] Could not load saved data:", err.message);
    soloLeaderboard = [];
    multiLeaderboard = [];
  }
}

// ── Save to disk (debounced — max one write per 500ms) ──────────────
let saveTimer = null;
function saveToDisk() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify({ solo: soloLeaderboard, multi: multiLeaderboard }, null, 2),
        "utf8"
      );
    } catch (err) {
      console.warn("[leaderboard] Could not save data:", err.message);
    }
  }, 500);
}

loadFromDisk();

// ── Helpers ──────────────────────────────────────────────────────────
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
  saveToDisk();
}

function addMultiEntry({ username, wpm, accuracy }) {
  multiLeaderboard.push({
    username: String(username || "Anonymous").trim().slice(0, 20),
    wpm: Number(wpm) || 0,
    accuracy: Number(accuracy) || 0,
    timestamp: Date.now()
  });
  sortAndSlice(multiLeaderboard);
  saveToDisk();
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
