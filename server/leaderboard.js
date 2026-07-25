// leaderboard.js — Supabase-backed leaderboard (async)
// Falls back to in-memory + file if Supabase is not configured.
const { supabase } = require("./supabase");

const useSupabase = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

if (!useSupabase) {
  console.warn(
    "[leaderboard] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — " +
    "falling back to in-memory + file storage."
  );
}

// ── In-memory fallback (used when Supabase not configured) ───────────────────
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "leaderboard_data.json");
const MAX_ENTRIES = 100;
const TOP_N = 20;

let soloLeaderboard = [];
let multiLeaderboard = [];

function loadFromDisk() {
  if (useSupabase) return;
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
  }
}

let saveTimer = null;
function saveToDisk() {
  if (useSupabase) return;
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

function sortAndSlice(arr) {
  arr.sort((a, b) => b.wpm - a.wpm);
  if (arr.length > MAX_ENTRIES) arr.splice(MAX_ENTRIES);
}

loadFromDisk();

// ── Public async API ──────────────────────────────────────────────────────────

async function addSoloEntry({ username, wpm, accuracy, difficulty, clerkUserId }) {
  const entry = {
    username: String(username || "Anonymous").trim().slice(0, 20),
    wpm: Number(wpm) || 0,
    accuracy: Number(accuracy) || 0,
    difficulty: String(difficulty || "medium")
  };

  if (useSupabase) {
    const { error } = await supabase.from("leaderboard_solo").insert({
      ...entry,
      clerk_user_id: clerkUserId || "server"
    });
    if (error) console.error("[leaderboard] Supabase solo insert error:", error.message);
    return;
  }

  // In-memory fallback
  soloLeaderboard.push({ ...entry, timestamp: Date.now() });
  sortAndSlice(soloLeaderboard);
  saveToDisk();
}

async function addMultiEntry({ username, wpm, accuracy, clerkUserId }) {
  const entry = {
    username: String(username || "Anonymous").trim().slice(0, 20),
    wpm: Number(wpm) || 0,
    accuracy: Number(accuracy) || 0
  };

  if (useSupabase) {
    const { error } = await supabase.from("leaderboard_multi").insert({
      ...entry,
      clerk_user_id: clerkUserId || "server"
    });
    if (error) console.error("[leaderboard] Supabase multi insert error:", error.message);
    return;
  }

  // In-memory fallback
  multiLeaderboard.push({ ...entry, timestamp: Date.now() });
  sortAndSlice(multiLeaderboard);
  saveToDisk();
}

async function getSoloTop(n = TOP_N, difficulty = "all") {
  if (useSupabase) {
    let query = supabase
      .from("leaderboard_solo")
      .select("username, wpm, accuracy, difficulty, created_at")
      .order("wpm", { ascending: false })
      .limit(n);

    if (difficulty && difficulty !== "all") {
      query = query.eq("difficulty", difficulty);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[leaderboard] Supabase solo fetch error:", error.message);
      return [];
    }
    return (data || []).map((e) => ({
      username: e.username,
      wpm: e.wpm,
      accuracy: e.accuracy,
      difficulty: e.difficulty,
      timestamp: new Date(e.created_at).getTime()
    }));
  }

  // In-memory fallback
  const filtered =
    difficulty && difficulty !== "all"
      ? soloLeaderboard.filter((e) => e.difficulty === difficulty)
      : soloLeaderboard;
  return filtered.slice(0, n);
}

async function getMultiTop(n = TOP_N) {
  if (useSupabase) {
    const { data, error } = await supabase
      .from("leaderboard_multi")
      .select("username, wpm, accuracy, created_at")
      .order("wpm", { ascending: false })
      .limit(n);

    if (error) {
      console.error("[leaderboard] Supabase multi fetch error:", error.message);
      return [];
    }
    return (data || []).map((e) => ({
      username: e.username,
      wpm: e.wpm,
      accuracy: e.accuracy,
      timestamp: new Date(e.created_at).getTime()
    }));
  }

  // In-memory fallback
  return multiLeaderboard.slice(0, n);
}

module.exports = { addSoloEntry, addMultiEntry, getSoloTop, getMultiTop };
