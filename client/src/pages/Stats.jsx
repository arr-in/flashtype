import { useNavigate } from "react-router-dom";
import { getUserStats, clearUserStats, getStoredUsername } from "../lib/userStats";
import { useState } from "react";

const DIFFICULTIES = ["beginner", "easy", "medium", "hard", "expert"];

function cap(str) {
  if (!str) return "";
  return str[0].toUpperCase() + str.slice(1);
}

export default function Stats() {
  const navigate = useNavigate();
  const [, forceRender] = useState(0);

  const username = getStoredUsername();
  const stats = getUserStats();
  const mp = stats.multiplayerStats;
  const winRate = mp.races > 0 ? Math.round((mp.wins / mp.races) * 100) : 0;

  function handleClear() {
    if (window.confirm("Clear all your stats? This cannot be undone.")) {
      clearUserStats();
      forceRender((n) => n + 1);
    }
  }

  return (
    <main className="stats-page">
      <button type="button" className="solo-back-btn" onClick={() => navigate("/")}>← Back</button>

      <div className="stats-inner">
        <header className="stats-header">
          <h1 className="stats-title">My Stats</h1>
          {username && (
            <div className="stats-username-chip">
              <span className="stats-username-dot" />
              {username}
            </div>
          )}
        </header>

        {/* ── Solo Section ── */}
        <section className="stats-section" aria-label="Solo stats">
          <h2 className="stats-section-title">⚡ Solo Practice</h2>
          <table className="stats-table" aria-label="Solo stats by difficulty">
            <thead>
              <tr>
                <th className="stats-th">Difficulty</th>
                <th className="stats-th stats-th-num">Best WPM</th>
                <th className="stats-th stats-th-num">Best Accuracy</th>
                <th className="stats-th stats-th-num">Games Played</th>
              </tr>
            </thead>
            <tbody>
              {DIFFICULTIES.map((diff) => {
                const s = stats.soloStats[diff] || { bestWPM: 0, bestAccuracy: 0, gamesPlayed: 0 };
                const hasData = s.gamesPlayed > 0;
                return (
                  <tr key={diff} className={`stats-tr${!hasData ? " stats-tr-empty" : ""}`}>
                    <td className="stats-td">
                      <span className={`lb-diff-badge lb-diff-badge--${diff}`}>{cap(diff)}</span>
                    </td>
                    <td className="stats-td stats-td-num">
                      {hasData ? <span className="stats-best-val">{s.bestWPM}</span> : <span className="stats-blank">—</span>}
                    </td>
                    <td className="stats-td stats-td-num">
                      {hasData ? `${s.bestAccuracy}%` : <span className="stats-blank">—</span>}
                    </td>
                    <td className="stats-td stats-td-num">{s.gamesPlayed}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* ── Multiplayer Section ── */}
        <section className="stats-section" aria-label="Multiplayer stats">
          <h2 className="stats-section-title">🌍 Multiplayer</h2>
          {mp.races === 0 ? (
            <p className="stats-empty">No multiplayer races yet.</p>
          ) : (
            <div className="stats-mp-grid">
              <div className="stats-mp-card">
                <span className="stats-mp-value">{mp.races}</span>
                <span className="stats-mp-label">Races</span>
              </div>
              <div className="stats-mp-card">
                <span className="stats-mp-value">{mp.wins}</span>
                <span className="stats-mp-label">Wins</span>
              </div>
              <div className="stats-mp-card">
                <span className="stats-mp-value">{winRate}%</span>
                <span className="stats-mp-label">Win Rate</span>
              </div>
              <div className="stats-mp-card">
                <span className="stats-mp-value">{mp.bestWPM}</span>
                <span className="stats-mp-label">Best WPM</span>
              </div>
              <div className="stats-mp-card">
                <span className="stats-mp-value">{mp.bestAccuracy}%</span>
                <span className="stats-mp-label">Best Accuracy</span>
              </div>
            </div>
          )}
        </section>

        {/* ── Actions ── */}
        <div className="stats-actions">
          <button type="button" className="lb-text-link" onClick={() => navigate("/leaderboard")}>
            View Leaderboard →
          </button>
          <button
            id="stats-clear-btn"
            type="button"
            className="stats-clear-btn"
            onClick={handleClear}
          >
            🗑 Clear My Stats
          </button>
        </div>
      </div>
    </main>
  );
}
