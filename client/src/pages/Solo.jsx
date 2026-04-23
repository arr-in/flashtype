import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TypingBox from "../components/TypingBox";
import { getSoloTimedText } from "../lib/textBank";

const difficulties = ["beginner", "easy", "medium", "hard", "expert"];

function Solo() {
  const navigate = useNavigate();
  const location = useLocation();
  const [difficulty, setDifficulty] = useState("medium");
  const [timeLimit, setTimeLimit] = useState(60);
  const [fontSize, setFontSize] = useState("medium");
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState(0);

  const difficultyLabel = useMemo(() => {
    if (!difficulty) return "";
    return `${difficulty[0].toUpperCase()}${difficulty.slice(1)}`;
  }, [difficulty]);

  function startTest() {
    setText(getSoloTimedText(difficulty, timeLimit));
    setSessionId((id) => id + 1);
  }

  function restartTest(level = difficulty, duration = timeLimit) {
    setText(getSoloTimedText(level, duration));
    setSessionId((id) => id + 1);
  }

  useEffect(() => {
    const retryState = location.state;
    if (!retryState || !retryState.retryWithSameSettings) return;
    if (retryState.difficulty) setDifficulty(retryState.difficulty);
    if (retryState.timeLimit) setTimeLimit(retryState.timeLimit);
    const nextDifficulty = retryState.difficulty || difficulty;
    const nextTimeLimit = Number(retryState.timeLimit) || timeLimit;
    setText(getSoloTimedText(nextDifficulty, nextTimeLimit));
    setSessionId((id) => id + 1);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state]);

  function handleComplete(stats) {
    const key = `flashType_best_${difficulty}_${timeLimit}s`;
    const currentBest = Number(localStorage.getItem(key) || 0);
    if (stats.wpm > currentBest) localStorage.setItem(key, String(stats.wpm));

    navigate("/results", {
      state: {
        mode: "solo",
        difficulty,
        timeLimit,
        soloTelemetry: stats.telemetry || null,
        currentUser: "You",
        results: [
          {
            username: "You",
            placement: 1,
            wpm: stats.wpm,
            accuracy: stats.accuracy,
            timeMs: stats.timeMs
          }
        ]
      }
    });
  }

  if (!text) {
    return (
      <main className="solo-setup-page">
        <button
          type="button"
          className="solo-back-btn"
          onClick={() => navigate("/")}
        >
          ← Back
        </button>

        <div className="solo-setup-center">
          <h1 className="solo-setup-title">Solo Practice</h1>

          <div className="solo-setup-group">
            <p className="solo-setup-label">Difficulty</p>
            <div className="solo-setup-buttons">
              {difficulties.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={difficulty === level ? "selection-button-active" : ""}
                >
                  {level[0].toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="solo-setup-group">
            <p className="solo-setup-label">Duration</p>
            <div className="solo-setup-buttons">
              {[15, 30, 60, 90].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setTimeLimit(sec)}
                  className={timeLimit === sec ? "selection-button-active" : ""}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          <div className="solo-setup-group">
            <p className="solo-setup-label">Text Size</p>
            <div className="solo-setup-buttons">
              {["small", "medium", "large"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontSize(size)}
                  className={fontSize === size ? "selection-button-active" : ""}
                >
                  {size[0].toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="flash-start-button solo-start-btn" onClick={startTest}>
            Flash Start
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="solo-typing-page">
      <TypingBox
        key={sessionId}
        text={text}
        onComplete={handleComplete}
        allowBackspace
        enabled
        timedMode
        timeLimitSec={timeLimit}
        onRestart={() => restartTest()}
        collectTelemetry
        difficultyLabel={difficultyLabel}
        fontSize={fontSize}
      />
    </main>
  );
}

export default Solo;
