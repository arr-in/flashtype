import { useMemo } from "react";
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
  const currentUser = state.currentUser || "You";
  const roomCode = state.roomCode || sessionStorage.getItem("flash_room");
  const soloTelemetry = state.soloTelemetry || null;
  const speedTimeline = state.speedTimeline || {};

  const soloMeta = useMemo(() => {
    if (mode !== "solo" || !state.difficulty) return null;
    const timer = state.timeLimit || 60;
    const key = `flashType_best_${state.difficulty}_${timer}s`;
    return { difficulty: state.difficulty, timeLimit: timer, personalBest: Number(localStorage.getItem(key) || 0) };
  }, [mode, state.difficulty, state.timeLimit]);

  function backHome() {
    navigate("/");
  }

  function playAgain() {
    if (mode === "solo") {
      return navigate("/solo", {
        state: {
          retryWithSameSettings: true,
          difficulty: state.difficulty,
          timeLimit: state.timeLimit
        }
      });
    }
    socket.emit("play_again", { roomCode, username: sessionStorage.getItem("flash_username") });
    navigate("/lobby");
  }

  return (
    <main className="page">
      <h2>Results</h2>

      {soloMeta && (
        <div className="panel">
          <p>Difficulty: {soloMeta.difficulty}</p>
          <p>Timer: {soloMeta.timeLimit}s</p>
          <p>Personal Best: {soloMeta.personalBest} WPM</p>
        </div>
      )}

      {mode === "solo" && soloTelemetry && (
        <section className="panel">
          <h3>Solo Stats</h3>
          <p>Backspace usage: {soloTelemetry.backspaceCount}</p>
          <h4>Keyboard Error/Speed Heatmap</h4>
          <KeyboardHeatmap keyMetrics={soloTelemetry.keyMetrics || {}} />
          <h4>Hard Word List</h4>
          <div className="hard-word-list">
            {(soloTelemetry.hardWords || []).map((item) => (
              <div key={`${item.word}-${item.errors}-${item.avgDelay}`} className="hard-word-item">
                <span>{item.word}</span>
                <span>{item.errors} errors</span>
                <span>{item.avgDelay}ms avg</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="results-grid">
        {results.map((player) => (
          <PlayerCard key={player.username} player={player} highlighted={player.username === currentUser} />
        ))}
      </section>

      {mode === "multiplayer" && (
        <section className="panel">
          <h3>Speed Timeline</h3>
          <SpeedTimelineChart timelineMap={speedTimeline} />
        </section>
      )}

      <div className="button-wrap">
        {mode === "solo" && (
          <button type="button" onClick={playAgain}>
            Retry
          </button>
        )}
        {mode === "multiplayer" && (
          <button type="button" onClick={playAgain}>
            Play Again
          </button>
        )}
        {mode === "multiplayer" && <p>Host can start when at least 2 players are ready.</p>}
        <button type="button" onClick={backHome}>
          Back to Home
        </button>
      </div>
    </main>
  );
}

export default Results;
