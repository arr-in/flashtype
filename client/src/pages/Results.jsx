import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PlayerCard from "../components/PlayerCard";
import { socket } from "../socket";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const mode = state.mode || "solo";
  const results = state.results || [];
  const currentUser = state.currentUser || "You";
  const roomCode = state.roomCode || sessionStorage.getItem("flash_room");

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
    if (mode === "solo") return navigate("/solo");
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

      <section className="results-grid">
        {results.map((player) => (
          <PlayerCard key={player.username} player={player} highlighted={player.username === currentUser} />
        ))}
      </section>

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
        {mode === "multiplayer" && <p>All players must click Play Again before host can start next race.</p>}
        <button type="button" onClick={backHome}>
          Back to Home
        </button>
      </div>
    </main>
  );
}

export default Results;
