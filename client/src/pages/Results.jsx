import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PlayerCard from "../components/PlayerCard";
import KeyboardHeatmap from "../components/KeyboardHeatmap";
import SpeedTimelineChart from "../components/SpeedTimelineChart";
import { socket } from "../socket";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const mode = state.mode || "solo";
  const results = state.results || [];
  const currentUser = state.currentUser || localStorage.getItem("username") || "You";
  const roomCode = state.roomCode || sessionStorage.getItem("flash_room") || "";
  const soloTelemetry = state.soloTelemetry || null;
  const speedTimeline = state.speedTimeline || {};
  const isHost = state.isHost || sessionStorage.getItem("flash_host") === "true";
  const isMatchmaking = state.isMatchmaking || false;

  // Persist to session storage if we have them from state
  useEffect(() => {
    if (state.roomCode) sessionStorage.setItem("flash_room", state.roomCode);
    if (state.isHost !== undefined) sessionStorage.setItem("flash_host", String(state.isHost));
  }, [state.roomCode, state.isHost]);

  // Multiplayer post-race state
  const [readyPlayers, setReadyPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState(results.map((r) => r.username));
  const [hasClickedPlayAgain, setHasClickedPlayAgain] = useState(false);

  const soloMeta = useMemo(() => {
    if (mode !== "solo" || !state.difficulty) return null;
    const timer = state.timeLimit || 60;
    const key = `flashType_best_${state.difficulty}_${timer}s`;
    return { difficulty: state.difficulty, timeLimit: timer, personalBest: Number(localStorage.getItem(key) || 0) };
  }, [mode, state.difficulty, state.timeLimit]);

  // Multiplayer: listen for ready-status updates and return_to_lobby
  useEffect(() => {
    if (mode !== "multiplayer") return undefined;

    function onPlayerList(payload) {
      setReadyPlayers(payload.readyPlayers || []);
      setAllPlayers((payload.players || []).map((p) => p.username));
    }

    function onReturnToLobby(payload) {
      // Host sent everyone back — navigate to lobby (waiting room)
      navigate("/lobby", {
        state: {
          fromResults: true,
          roomCode: payload.roomCode,
          host: payload.host,
          players: payload.players,
          settings: payload.settings
        }
      });
    }

    function onRaceStarting(payload) {
      navigate("/race", {
        state: {
          roomCode: payload.roomCode,
          username: localStorage.getItem("username"),
          text: payload.text,
          isHost: sessionStorage.getItem("flash_host") === "true",
          isMatchmaking,
          players: (payload.players || allPlayers).map(p => typeof p === 'string' ? { username: p } : p),
          settings: payload.settings
        }
      });
    }

    function onRoomError(payload) {
      alert(payload.message || "An error occurred.");
    }

    socket.on("player_list_update", onPlayerList);
    socket.on("return_to_lobby", onReturnToLobby);
    socket.on("race_starting", onRaceStarting);
    socket.on("room_error", onRoomError);

    return () => {
      socket.off("player_list_update", onPlayerList);
      socket.off("return_to_lobby", onReturnToLobby);
      socket.off("race_starting", onRaceStarting);
      socket.off("room_error", onRoomError);
    };
  }, [mode, navigate]);

  function backHome() {
    navigate("/");
  }

  function playAgain() {
    if (mode === "solo") {
      return navigate("/solo", {
        state: {
          retryWithSameSettings: true,
          difficulty: state.difficulty,
          timeLimit: state.timeLimit,
          fontSize: state.fontSize
        }
      });
    }
    // Multiplayer: signal ready, stay on page
    if (!hasClickedPlayAgain) {
      socket.emit("play_again", { roomCode, username: localStorage.getItem("username") });
      setHasClickedPlayAgain(true);
    }
  }

  function goToSettings() {
    // Host only: send all players back to the lobby waiting room
    socket.emit("return_to_lobby", {
      roomCode,
      username: localStorage.getItem("username")
    });
  }

  function startRaceNow() {
    // Host starts race directly from results when all are ready
    socket.emit("start_race", {
      roomCode,
      username: localStorage.getItem("username"),
      settings: {} // server uses stored settings
    });
  }

  const allReady = allPlayers.length > 0 && allPlayers.every((p) => readyPlayers.includes(p));

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      if (a.placement && b.placement && a.placement !== b.placement) {
        return a.placement - b.placement;
      }
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
      return (b.wpm || 0) - (a.wpm || 0);
    });
  }, [results]);

  return (
    <main className="page">
      <h2>Results</h2>

      {mode === "solo" && results[0] && (
        <div className="solo-stats-hero">
          <div className="solo-stat-card">
            <span className="solo-stat-val">{Math.round(results[0].wpm)}</span>
            <span className="solo-stat-lbl">WPM</span>
          </div>
          <div className="solo-stat-card">
            <span className="solo-stat-val">{Math.round(results[0].accuracy)}%</span>
            <span className="solo-stat-lbl">Accuracy</span>
          </div>
          {soloMeta && (
            <div className="solo-stat-card solo-stat-pb">
              <span className="solo-stat-val">{soloMeta.personalBest} WPM</span>
              <span className="solo-stat-lbl">Personal Best ({soloMeta.difficulty}, {soloMeta.timeLimit}s)</span>
            </div>
          )}
        </div>
      )}

      {/* Heatmap Section for Solo Mode */}
      {mode === "solo" && soloTelemetry && (
        <section className="panel">
          <h3>Keyboard Error Heatmap</h3>
          <KeyboardHeatmap errorMap={soloTelemetry.errorMap || {}} />

          <h3 style={{ marginTop: 24 }}>Slowest Words</h3>
          {soloTelemetry.hardWords && soloTelemetry.hardWords.length > 0 ? (
            <div className="hard-words-list">
              {soloTelemetry.hardWords.map((item) => (
                <div key={item.word} className="hard-word-chip">
                  <span className="hard-word-text">{item.word}</span>
                  <span className="hard-word-delay">{item.avgDelay} ms avg</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#888", fontStyle: "italic" }}>No hard words — great job!</p>
          )}
        </section>
      )}

      {mode === "multiplayer" && (
        <section className="results-grid">
          {sortedResults.map((player) => (
            <PlayerCard key={player.username} player={player} highlighted={player.username === currentUser} />
          ))}
        </section>
      )}

      {mode === "multiplayer" && (
        <section className="panel">
          <h3>Speed Timeline</h3>
          <SpeedTimelineChart timelineMap={speedTimeline} />
        </section>
      )}

      {/* Multiplayer play-again ready panel */}
      {mode === "multiplayer" && (
        <section className="panel results-replay-panel">
          <p className="results-replay-title">Play Again?</p>
          <div className="results-replay-players">
            {allPlayers.map((player) => {
              const ready = readyPlayers.includes(player);
              return (
                <div key={player} className={`results-replay-chip ${ready ? "results-replay-ready" : "results-replay-waiting"}`}>
                  <span className="results-replay-dot" />
                  {player}
                  <span className="results-replay-status">{ready ? "Ready ✓" : "Waiting…"}</span>
                </div>
              );
            })}
          </div>
          {allReady && <p className="results-replay-all-ready">All players ready — host can start!</p>}
        </section>
      )}

      <div className="button-wrap">
        {mode === "solo" && (
          <button type="button" onClick={playAgain}>
            Retry
          </button>
        )}
        {/* Play Again — only show if not yet clicked */}
        {mode === "multiplayer" && !hasClickedPlayAgain && (
          <button type="button" className="flash-start-button" onClick={playAgain}>
            ✓ {isMatchmaking ? "Ready for Rematch" : "Play Again"}
          </button>
        )}
        {mode === "multiplayer" && isMatchmaking && (
          <button type="button" className="lobby-secondary-btn" onClick={() => navigate("/online")}>
            🔍 Find New Match
          </button>
        )}
        {/* Host: Start Race when all ready; otherwise show waiting or Go to Settings */}
        {mode === "multiplayer" && !isMatchmaking && isHost && allReady && (
          <button type="button" className="flash-start-button" onClick={startRaceNow}>
            ⚡ Start Race!
          </button>
        )}
        {mode === "multiplayer" && !isMatchmaking && isHost && !allReady && (
          <button type="button" className="lobby-secondary-btn" onClick={goToSettings}>
            ⚙ Go to Settings
          </button>
        )}
        {mode === "multiplayer" && hasClickedPlayAgain && (
          <button type="button" disabled style={{ opacity: 0.5 }}>
            Waiting for others…
          </button>
        )}
        <button type="button" onClick={backHome}>
          Back to Home
        </button>
      </div>
    </main>
  );
}

export default Results;
