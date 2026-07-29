// leaderboard.js — Supabase-backed leaderboard with Redis Sorted Set cache-aside.
// Falls back to in-memory + file if Supabase is not configured.
// Falls back to direct Supabase/in-memory if Redis is not configured.
const { supabase }       = require("./supabase");
const { getRedisClient } = require("./redis");

// ── Config ────────────────────────────────────────────────────────────────────
const useSupabase = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

if (!useSupabase) {
  console.warn(
    "[leaderboard] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — " +
    "falling back to in-memory + file storage."
  );
}

const TOP_N      = 20;
const MAX_ENTRIES = 100;
const CACHE_TTL_SECONDS = 60; // Redis cache TTL (refresh after 60 s)

// Redis key helpers
const REDIS_KEY = {
  solo:            "lb:solo",
  soloD: (diff)  => `lb:solo:${diff}`,
  multi:           "lb:multi"
};

// ── In-memory fallback ────────────────────────────────────────────────────────
const fs   = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "leaderboard_data.json");

let soloLeaderboard  = [];
let multiLeaderboard = [];

function loadFromDisk() {
  if (useSupabase) return;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw    = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw);
      soloLeaderboard  = Array.isArray(parsed.solo)  ? parsed.solo  : [];
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

// ── Redis Sorted Set helpers ──────────────────────────────────────────────────

/**
 * Write an entry into a Redis Sorted Set (score = wpm).
 * Member is a JSON string so we can store full metadata.
 * Also sets a TTL on the key so stale data expires.
 */
async function redisZAdd(key, score, member) {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.zAdd(key, [{ score, value: member }]);
    await redis.expire(key, CACHE_TTL_SECONDS);
  } catch (err) {
    console.warn(`[redis] zAdd failed for ${key}:`, err.message);
  }
}

/**
 * Read top-N entries from a Redis Sorted Set in descending WPM order.
 * Returns null on cache miss / Redis unavailable.
 */
async function redisZTop(key, n) {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const exists = await redis.exists(key);
    if (!exists) return null; // cache miss
    const members = await redis.zRange(key, 0, n - 1, { REV: true });
    if (!members || members.length === 0) return null;
    return members.map((m) => {
      try { return JSON.parse(m); } catch { return null; }
    }).filter(Boolean);
  } catch (err) {
    console.warn(`[redis] zRange failed for ${key}:`, err.message);
    return null;
  }
}

/**
 * Backfill a Redis Sorted Set from an array of entries.
 * Runs async (fire-and-forget) so it never blocks the request path.
 */
async function redisBackfill(key, entries) {
  const redis = getRedisClient();
  if (!redis || !entries || entries.length === 0) return;
  try {
    const members = entries.map((e) => ({
      score: e.wpm || 0,
      value: JSON.stringify(e)
    }));
    await redis.zAdd(key, members);
    await redis.expire(key, CACHE_TTL_SECONDS);
  } catch (err) {
    console.warn(`[redis] backfill failed for ${key}:`, err.message);
  }
}

// ── Public async API ──────────────────────────────────────────────────────────

async function addSoloEntry({ username, wpm, accuracy, difficulty, clerkUserId }) {
  const entry = {
    username:   String(username   || "Anonymous").trim().slice(0, 20),
    wpm:        Number(wpm)        || 0,
    accuracy:   Number(accuracy)   || 0,
    difficulty: String(difficulty  || "medium"),
    timestamp:  Date.now()
  };

  // Write to Redis Sorted Sets (global + difficulty-specific) in parallel
  const member = JSON.stringify(entry);
  const redisWrites = [
    redisZAdd(REDIS_KEY.solo,          entry.wpm, member),
    redisZAdd(REDIS_KEY.soloD(entry.difficulty), entry.wpm, member)
  ];

  if (useSupabase) {
    const [{ error }] = await Promise.all([
      supabase.from("leaderboard_solo").insert({
        username:         entry.username,
        wpm:              entry.wpm,
        accuracy:         entry.accuracy,
        difficulty:       entry.difficulty,
        clerk_user_id:    clerkUserId || "server"
      }),
      ...redisWrites
    ]);
    if (error) console.error("[leaderboard] Supabase solo insert error:", error.message);
    return;
  }

  // In-memory fallback
  soloLeaderboard.push(entry);
  sortAndSlice(soloLeaderboard);
  saveToDisk();
  await Promise.all(redisWrites);
}

async function addMultiEntry({ username, wpm, accuracy, clerkUserId }) {
  const entry = {
    username:  String(username  || "Anonymous").trim().slice(0, 20),
    wpm:       Number(wpm)       || 0,
    accuracy:  Number(accuracy)  || 0,
    timestamp: Date.now()
  };

  const member = JSON.stringify(entry);
  const redisWrite = redisZAdd(REDIS_KEY.multi, entry.wpm, member);

  if (useSupabase) {
    const [{ error }] = await Promise.all([
      supabase.from("leaderboard_multi").insert({
        username:      entry.username,
        wpm:           entry.wpm,
        accuracy:      entry.accuracy,
        clerk_user_id: clerkUserId || "server"
      }),
      redisWrite
    ]);
    if (error) console.error("[leaderboard] Supabase multi insert error:", error.message);
    return;
  }

  // In-memory fallback
  multiLeaderboard.push(entry);
  sortAndSlice(multiLeaderboard);
  saveToDisk();
  await redisWrite;
}

async function getSoloTop(n = TOP_N, difficulty = "all") {
  const redisKey = difficulty && difficulty !== "all"
    ? REDIS_KEY.soloD(difficulty)
    : REDIS_KEY.solo;

  // 1. Cache-Aside: try Redis first
  const cached = await redisZTop(redisKey, n);
  if (cached) return cached;

  // 2. Cache miss → fetch from source
  let results = [];

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
    results = (data || []).map((e) => ({
      username:   e.username,
      wpm:        e.wpm,
      accuracy:   e.accuracy,
      difficulty: e.difficulty,
      timestamp:  new Date(e.created_at).getTime()
    }));
  } else {
    // In-memory fallback
    const filtered = difficulty && difficulty !== "all"
      ? soloLeaderboard.filter((e) => e.difficulty === difficulty)
      : soloLeaderboard;
    results = filtered.slice(0, n);
  }

  // 3. Backfill Redis asynchronously (don't await — never block the response)
  redisBackfill(redisKey, results).catch(() => {});

  return results;
}

async function getMultiTop(n = TOP_N) {
  // 1. Cache-Aside: try Redis first
  const cached = await redisZTop(REDIS_KEY.multi, n);
  if (cached) return cached;

  // 2. Cache miss → fetch from source
  let results = [];

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
    results = (data || []).map((e) => ({
      username:  e.username,
      wpm:       e.wpm,
      accuracy:  e.accuracy,
      timestamp: new Date(e.created_at).getTime()
    }));
  } else {
    results = multiLeaderboard.slice(0, n);
  }

  // 3. Backfill Redis asynchronously
  redisBackfill(REDIS_KEY.multi, results).catch(() => {});

  return results;
}

module.exports = { addSoloEntry, addMultiEntry, getSoloTop, getMultiTop };
