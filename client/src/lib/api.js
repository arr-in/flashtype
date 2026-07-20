// api.js — leaderboard REST API helpers

const BASE_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function postSoloScore(username, wpm, accuracy, difficulty) {
  return safeFetch(`${BASE_URL}/api/leaderboard/solo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, wpm, accuracy, difficulty })
  });
}

export async function postMultiScore(username, wpm, accuracy) {
  return safeFetch(`${BASE_URL}/api/leaderboard/multi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, wpm, accuracy })
  });
}

export async function fetchSoloLeaderboard(difficulty = "all") {
  const data = await safeFetch(
    `${BASE_URL}/api/leaderboard/solo?difficulty=${encodeURIComponent(difficulty)}`
  );
  return data?.leaderboard || [];
}

export async function fetchMultiLeaderboard() {
  const data = await safeFetch(`${BASE_URL}/api/leaderboard/multi`);
  return data?.leaderboard || [];
}
