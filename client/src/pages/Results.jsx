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
  const currentUser = state.currentUser || sessionStorage.getItem("flash_username") || "You";
  const roomCode = state.roomCode || sessionStorage.getItem("flash_room") || "";
  const soloTelemetry = state.soloTelemetry || null;
  const speedTimeline = state.speedTimeline || {};
  const isHost = state.isHost || sessionStorage.getItem("flash_host") === "true";

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
          username: sessionStorage.getItem("flash_username"),
          text: payload.text,
          isHost: sessionStorage.getItem("flash_host") === "true",
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
      socket.emit("play_again", { roomCode, username: sessionStorage.getItem("flash_username") });
      setHasClickedPlayAgain(true);
    }
  }

  function goToSettings() {
    // Host only: send all players back to the lobby waiting room
    socket.emit("return_to_lobby", {
      roomCode,
      username: sessionStorage.getItem("flash_username")
    });
  }

  function startRaceNow() {
    // Host starts race directly from results when all are ready
    socket.emit("start_race", {
      roomCode,
      username: sessionStorage.getItem("flash_username"),
      settings: {} // server uses stored settings
    });
  }

  const allReady = allPlayers.length > 0 && allPlayers.every((p) => readyPlayers.includes(p));

  return (
    <main className="page">
      <h2>Results</h2>

      {mode === "solo" && results[0] && (
        <div className="solo-stats-hero">
          <div className="solo-stat-card">
            <span className="solo-stat-value">{results[0].wpm}</span>
            <span className="solo-stat-label">WPM</span>
          </div>
          <div className="solo-stat-card">
            <span className="solo-stat-value">{results[0].accuracy}%</span>
            <span className="solo-stat-label">Accuracy</span>
          </div>
          <div className="solo-stat-card">
            <span className="solo-stat-value">{(results[0].timeMs / 1000).toFixed(1)}s</span>
            <span className="solo-stat-label">Time</span>
          </div>
        </div>
      )}

      {soloMeta && (
        <div className="panel solo-meta-row">
          <span>Difficulty: {soloMeta.difficulty}</span>
          <span>Timer: {soloMeta.timeLimit}s</span>
          <span>Personal Best: {soloMeta.personalBest} WPM</span>
        </div>
      )}

      {mode === "solo" && soloTelemetry && (
        <section className="panel">
          <h3>Solo Stats</h3>
          <p>Backspace usage: {soloTelemetry.backspaceCount}</p>
          <h4>Keyboard Error/Speed Heatmap</h4>
          {soloTelemetry.keyMetrics && Object.keys(soloTelemetry.keyMetrics).length > 0 ? (
            <KeyboardHeatmap keyMetrics={soloTelemetry.keyMetrics} />
          ) : (
            <p style={{ color: "#888", fontStyle: "italic" }}>No key data recorded for this run.</p>
          )}
          <h4>Hard Word List</h4>
          {(soloTelemetry.hardWords || []).length > 0 ? (
            <div className="hard-word-list">
              {soloTelemetry.hardWords.map((item) => (
                <div key={`${item.word}-${item.errors}-${item.avgDelay}`} className="hard-word-item">
                  <span className="hard-word-name">{item.word}</span>
                  <span className="hard-word-errors">{item.errors} error{item.errors !== 1 ? "s" : ""}</span>
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
          {results.map((player) => (
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
            ✓ Play Again
          </button>
        )}
        {/* Host: Start Race when all ready; otherwise show waiting or Go to Settings */}
        {mode === "multiplayer" && isHost && allReady && (
          <button type="button" className="flash-start-button" onClick={startRaceNow}>
            ⚡ Start Race!
          </button>
        )}
        {mode === "multiplayer" && isHost && !allReady && (
          <button type="button" className="lobby-secondary-btn" onClick={goToSettings}>
            ⚙ Go to Settings
          </button>
        )}
        {mode === "multiplayer" && !isHost && hasClickedPlayAgain && (
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
