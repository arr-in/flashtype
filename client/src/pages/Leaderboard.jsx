import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSoloLeaderboard, fetchMultiLeaderboard } from "../lib/api";
import { getUserStats, getStoredUsername } from "../lib/userStats";

const DIFFICULTIES = ["all", "beginner", "easy", "medium", "hard", "expert"];

function timeAgo(ts) {
  const diffMs = Date.now() - ts;
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function cap(str) {
  if (!str) return "";
  return str[0].toUpperCase() + str.slice(1);
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("solo");
  const [difficulty, setDifficulty] = useState("all");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const username = getStoredUsername();
  const userStats = getUserStats();

  const load = useCallback(async () => {
    setLoading(true);
    let data;
    if (tab === "solo") {
      data = await fetchSoloLeaderboard(difficulty);
    } else {
      data = await fetchMultiLeaderboard();
    }
    setEntries(data || []);
    setLoading(false);
  }, [tab, difficulty]);

  useEffect(() => { load(); }, [load]);

  // Personal best from localStorage
  const personalBest = (() => {
    if (tab === "solo") {
      if (difficulty === "all") {
        // Find best across all difficulties
        const all = Object.entries(userStats.soloStats);
        let best = null;
        let bestDiff = "";
        for (const [diff, s] of all) {
          if (!best || s.bestWPM > best.bestWPM) {
            best = s;
            bestDiff = diff;
          }
        }
        if (!best || best.bestWPM === 0) return null;
        return { username, wpm: best.bestWPM, accuracy: best.bestAccuracy, difficulty: bestDiff };
      } else {
        const s = userStats.soloStats[difficulty];
        if (!s || s.bestWPM === 0) return null;
        return { username, wpm: s.bestWPM, accuracy: s.bestAccuracy, difficulty };
      }
    } else {
      const mp = userStats.multiplayerStats;
      if (!mp || mp.bestWPM === 0) return null;
      return { username, wpm: mp.bestWPM, accuracy: mp.bestAccuracy };
    }
  })();

  return (
    <main className="lb-page">
      <div className="lb-header">
        <button type="button" className="solo-back-btn" onClick={() => navigate("/")}>← Back</button>
        <h1 className="lb-title">Leaderboard</h1>
        <p className="lb-subtitle">Live session — resets when server restarts</p>
      </div>

      {/* Tabs */}
      <div className="lb-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          id="lb-tab-solo"
          aria-selected={tab === "solo"}
          className={`lb-tab${tab === "solo" ? " lb-tab-active" : ""}`}
          onClick={() => setTab("solo")}
        >
          ⚡ Solo
        </button>
        <button
          type="button"
          role="tab"
          id="lb-tab-multi"
          aria-selected={tab === "multi"}
          className={`lb-tab${tab === "multi" ? " lb-tab-active" : ""}`}
          onClick={() => setTab("multi")}
        >
          🌍 Multiplayer
        </button>
      </div>

      {/* Difficulty filter (solo only) */}
      {tab === "solo" && (
        <div className="lb-filter-row" role="group" aria-label="Filter by difficulty">
          {DIFFICULTIES.map((d) => (
            <button
              type="button"
              key={d}
              id={`lb-filter-${d}`}
              className={`lb-filter-btn${difficulty === d ? " lb-filter-active" : ""}`}
              onClick={() => setDifficulty(d)}
            >
              {cap(d)}
            </button>
          ))}
        </div>
      )}

      {/* Your Best */}
      {personalBest && username && (
        <div className="lb-your-best-row" aria-label="Your personal best">
          <span className="lb-your-best-label">Your Best</span>
          <span className="lb-your-best-username">{personalBest.username}</span>
          <span className="lb-your-best-wpm">{personalBest.wpm} <small>WPM</small></span>
          <span className="lb-your-best-acc">{personalBest.accuracy}% <small>acc</small></span>
          {tab === "solo" && (
            <span className="lb-your-best-diff lb-diff-badge lb-diff-badge--{personalBest.difficulty}">
              {cap(personalBest.difficulty)}
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="lb-table-wrap">
        {loading ? (
          <p className="lb-empty">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="lb-empty">No entries yet — be the first! 🏁</p>
        ) : (
          <table className="lb-table" aria-label={`${cap(tab)} leaderboard`}>
            <thead>
              <tr>
                <th className="lb-th lb-th-rank">#</th>
                <th className="lb-th">Username</th>
                <th className="lb-th lb-th-num">WPM</th>
                <th className="lb-th lb-th-num">Accuracy</th>
                {tab === "solo" && <th className="lb-th">Difficulty</th>}
                <th className="lb-th lb-th-time">When</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const isMe = username && entry.username === username;
                return (
                  <tr key={`${entry.username}-${entry.timestamp}-${i}`} className={`lb-tr${isMe ? " lb-tr-me" : ""}`}>
                    <td className="lb-td lb-td-rank">
                      <span className={`lb-rank-badge lb-rank-badge--${i + 1 <= 3 ? i + 1 : "rest"}`}>
                        {i + 1 <= 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                      </span>
                    </td>
                    <td className="lb-td lb-td-username">
                      {entry.username}
                      {isMe && <span className="lb-you-chip">you</span>}
                    </td>
                    <td className="lb-td lb-td-num lb-wpm">{entry.wpm}</td>
                    <td className="lb-td lb-td-num">{entry.accuracy}%</td>
                    {tab === "solo" && (
                      <td className="lb-td">
                        <span className={`lb-diff-badge lb-diff-badge--${entry.difficulty}`}>
                          {cap(entry.difficulty)}
                        </span>
                      </td>
                    )}
                    <td className="lb-td lb-td-time">{timeAgo(entry.timestamp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="lb-note">
        ⓘ Live session leaderboard — resets when the server restarts. Your personal bests are always saved locally.
      </p>

      <div className="lb-footer-links">
        <button type="button" className="lb-text-link" onClick={() => navigate("/stats")}>
          My Stats →
        </button>
      </div>
    </main>
  );
}
