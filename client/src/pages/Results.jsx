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
  const isHost = state.isHost ?? sessionStorage.getItem("flash_host") === "true";

  const soloMeta = useMemo(() => {
    if (mode !== "solo" || !state.difficulty) return null;
    const key = `flashType_best_${state.difficulty}`;
    return { difficulty: state.difficulty, personalBest: Number(localStorage.getItem(key) || 0) };
  }, [mode, state.difficulty]);

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
        {mode === "multiplayer" && isHost && (
          <button type="button" onClick={playAgain}>
            Play Again
          </button>
        )}
        {mode === "multiplayer" && !isHost && <p>Waiting for host to restart...</p>}
        <button type="button" onClick={backHome}>
          Back to Home
        </button>
      </div>
    </main>
  );
}

export default Results;
