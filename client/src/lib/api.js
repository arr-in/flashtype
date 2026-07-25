// api.js — leaderboard REST helpers, with Supabase as primary backend

import { supabase, getAuthenticatedSupabase, isSupabaseConfigured } from "./supabase";

const BASE_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

// ── Fallback: Express server REST API ────────────────────────────────────────
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Solo score ────────────────────────────────────────────────────────────────
/**
 * Posts a solo score to Supabase (if configured) or the Express server.
 * @param {string} username
 * @param {number} wpm
 * @param {number} accuracy
 * @param {string} difficulty
 * @param {string} clerkUserId   - Clerk user ID (for Supabase row)
 * @param {Function} [getToken]  - Clerk's getToken() for authenticated Supabase write
 */
export async function postSoloScore(username, wpm, accuracy, difficulty, clerkUserId, getToken) {
  if (isSupabaseConfigured && clerkUserId) {
    try {
      const client = getToken
        ? await getAuthenticatedSupabase(getToken)
        : supabase;
      const { error } = await client.from("leaderboard_solo").insert({
        clerk_user_id: clerkUserId,
        username: String(username || "Anonymous").trim().slice(0, 20),
        wpm: Number(wpm) || 0,
        accuracy: Number(accuracy) || 0,
        difficulty: String(difficulty || "medium")
      });
      if (!error) return;
      console.warn("[api] Supabase solo insert error:", error.message);
    } catch (e) {
      console.warn("[api] Supabase solo insert failed:", e.message);
    }
  }
  // Fallback to Express server
  return safeFetch(`${BASE_URL}/api/leaderboard/solo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, wpm, accuracy, difficulty })
  });
}

// ── Multi score ───────────────────────────────────────────────────────────────
/**
 * Posts a multiplayer score. Always goes through Express server (server-side validation).
 */
export async function postMultiScore(username, wpm, accuracy) {
  return safeFetch(`${BASE_URL}/api/leaderboard/multi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, wpm, accuracy })
  });
}

// ── Fetch leaderboards ────────────────────────────────────────────────────────
export async function fetchSoloLeaderboard(difficulty = "all") {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from("leaderboard_solo")
        .select("username, wpm, accuracy, difficulty, created_at")
        .order("wpm", { ascending: false })
        .limit(20);

      if (difficulty && difficulty !== "all") {
        query = query.eq("difficulty", difficulty);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map((e) => ({
          username: e.username,
          wpm: e.wpm,
          accuracy: e.accuracy,
          difficulty: e.difficulty,
          timestamp: new Date(e.created_at).getTime()
        }));
      }
      console.warn("[api] Supabase solo fetch error:", error?.message);
    } catch (e) {
      console.warn("[api] Supabase solo fetch failed:", e.message);
    }
  }
  // Fallback
  const data = await safeFetch(
    `${BASE_URL}/api/leaderboard/solo?difficulty=${encodeURIComponent(difficulty)}`
  );
  return data?.leaderboard || [];
}

export async function fetchMultiLeaderboard() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("leaderboard_multi")
        .select("username, wpm, accuracy, created_at")
        .order("wpm", { ascending: false })
        .limit(20);

      if (!error && data) {
        return data.map((e) => ({
          username: e.username,
          wpm: e.wpm,
          accuracy: e.accuracy,
          timestamp: new Date(e.created_at).getTime()
        }));
      }
      console.warn("[api] Supabase multi fetch error:", error?.message);
    } catch (e) {
      console.warn("[api] Supabase multi fetch failed:", e.message);
    }
  }
  // Fallback
  const data = await safeFetch(`${BASE_URL}/api/leaderboard/multi`);
  return data?.leaderboard || [];
}
