import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSoloLeaderboard, fetchMultiLeaderboard } from "../lib/api";
import { getUserStats, getStoredUsername } from "../lib/userStats";
import { socket } from "../socket";
import { useUser } from "@clerk/clerk-react";
import FlashRunnerHero from "../components/FlashRunnerHero";

const DIFFICULTIES = ["all", "beginner", "easy", "medium", "hard", "expert"];

function timeAgo(ts) {
  const diffMs = Date.now() - ts;
  const secs = Math.floor(diffMs / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function cap(str) {
  if (!str) return "";
  return str[0].toUpperCase() + str.slice(1);
}

// Filter solo entries by difficulty client-side (for instant tab switching without re-fetch)
function filterEntries(entries, tab, difficulty) {
  if (tab !== "solo" || difficulty === "all") return entries;
  return entries.filter((e) => e.difficulty === difficulty);
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("solo");
  const [difficulty, setDifficulty] = useState("all");

  // Keep full unfiltered lists so we can filter locally without re-fetching
  const [soloEntries, setSoloEntries] = useState([]);
  const [multiEntries, setMultiEntries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [flashRowKey, setFlashRowKey] = useState(null); // key of newly added entry to animate
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newEntryUsername, setNewEntryUsername] = useState(null); // for the "new score" toast
  const toastTimerRef = useRef(null);

  const { user } = useUser();
  const username = getStoredUsername(user || null);
  const userStats = getUserStats();

  // ── Initial fetch ─────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [solo, multi] = await Promise.all([
      fetchSoloLeaderboard("all"),
      fetchMultiLeaderboard()
    ]);
    setSoloEntries(solo || []);
    setMultiEntries(multi || []);
    setLastUpdated(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Live socket updates ───────────────────────────────────────────
  useEffect(() => {
    function onLeaderboardUpdate({ tab: updatedTab, leaderboard }) {
      if (updatedTab === "solo") {
        setSoloEntries((prev) => {
          // Find the new entry (first entry not in prev by timestamp)
          const prevKeys = new Set(prev.map((e) => `${e.username}-${e.timestamp}`));
          const newEntry = leaderboard.find((e) => !prevKeys.has(`${e.username}-${e.timestamp}`));
          if (newEntry) {
            setFlashRowKey(`${newEntry.username}-${newEntry.timestamp}`);
            triggerToast(newEntry.username);
            setTimeout(() => setFlashRowKey(null), 1400);
          }
          return leaderboard;
        });
      } else {
        setMultiEntries((prev) => {
          const prevKeys = new Set(prev.map((e) => `${e.username}-${e.timestamp}`));
          const newEntry = leaderboard.find((e) => !prevKeys.has(`${e.username}-${e.timestamp}`));
          if (newEntry) {
            setFlashRowKey(`${newEntry.username}-${newEntry.timestamp}`);
            triggerToast(newEntry.username);
            setTimeout(() => setFlashRowKey(null), 1400);
          }
          return leaderboard;
        });
      }
      setLastUpdated(Date.now());
    }

    socket.on("leaderboard_update", onLeaderboardUpdate);
    return () => socket.off("leaderboard_update", onLeaderboardUpdate);
  }, []);

  function triggerToast(name) {
    setNewEntryUsername(name);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setNewEntryUsername(null), 3000);
  }

  // ── Displayed entries (local filter) ─────────────────────────────
  const displayed = filterEntries(
    tab === "solo" ? soloEntries : multiEntries,
    tab,
    difficulty
  );

  // ── Personal best ─────────────────────────────────────────────────
  const personalBest = (() => {
    if (tab === "solo") {
      if (difficulty === "all") {
        let best = null; let bestDiff = "";
        for (const [diff, s] of Object.entries(userStats.soloStats)) {
          if (!best || s.bestWPM > best.bestWPM) { best = s; bestDiff = diff; }
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
      {/* Live toast */}
      {newEntryUsername && (
        <div className="lb-toast" aria-live="polite">
          ⚡ <strong>{newEntryUsername}</strong> just posted a score!
        </div>
      )}

      <div className="lb-header">
        <div className="lb-header-top">
          <h1 className="lb-title">Leaderboard</h1>
          <FlashRunnerHero variant="compact" />
        </div>
        <div className="lb-live-row">
          <span className="lb-live-dot" aria-hidden="true" />
          <span className="lb-live-label">Live</span>
          {lastUpdated && (
            <span className="lb-updated-at">
              · updated {timeAgo(lastUpdated)}
            </span>
          )}
          <button
            type="button"
            id="lb-refresh-btn"
            className="lb-refresh-btn"
            onClick={loadAll}
            title="Refresh leaderboard"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="lb-tabs" role="tablist">
        <button
          type="button" role="tab" id="lb-tab-solo"
          aria-selected={tab === "solo"}
          className={`lb-tab${tab === "solo" ? " lb-tab-active" : ""}`}
          onClick={() => setTab("solo")}
        >
          ⚡ Solo
        </button>
        <button
          type="button" role="tab" id="lb-tab-multi"
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
              type="button" key={d} id={`lb-filter-${d}`}
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
            <span className={`lb-diff-badge lb-diff-badge--${personalBest.difficulty}`}>
              {cap(personalBest.difficulty)}
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="lb-table-wrap">
        {loading ? (
          <div className="lb-skeleton-wrap">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="lb-skeleton-row" style={{ opacity: 1 - i * 0.12 }} />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <p className="lb-empty">No entries yet — be the first! 🏁</p>
        ) : (
          <table className="lb-table" aria-label={`${cap(tab)} leaderboard`}>
            <thead>
              <tr>
                <th className="lb-th lb-th-rank">#</th>
                <th className="lb-th">Player</th>
                <th className="lb-th lb-th-num">WPM</th>
                <th className="lb-th lb-th-num">Accuracy</th>
                {tab === "solo" && <th className="lb-th">Difficulty</th>}
                <th className="lb-th lb-th-time">When</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((entry, i) => {
                const isMe = username && entry.username === username;
                const rowKey = `${entry.username}-${entry.timestamp}`;
                const isNew = rowKey === flashRowKey;
                return (
                  <tr
                    key={rowKey}
                    className={[
                      "lb-tr",
                      isMe ? "lb-tr-me" : "",
                      isNew ? "lb-tr-flash" : ""
                    ].filter(Boolean).join(" ")}
                  >
                    <td className="lb-td lb-td-rank">
                      {i < 3 ? (
                        <span className="lb-rank-badge">{["🥇","🥈","🥉"][i]}</span>
                      ) : (
                        <span className="lb-rank-badge lb-rank-badge--rest">{i + 1}</span>
                      )}
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
        ⓘ Scores are saved permanently and update live across all players
      </p>

      <div className="lb-footer-links">
        <button type="button" className="lb-text-link" onClick={() => navigate("/stats")}>
          My Stats →
        </button>
      </div>
    </main>
  );
}
