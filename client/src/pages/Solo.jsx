import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TypingBox from "../components/TypingBox";
import { getSoloTimedText } from "../lib/textBank";

const difficulties = ["beginner", "easy", "medium", "hard", "expert"];

function Solo() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);
  const [text, setText] = useState("");

  const difficultyLabel = useMemo(() => {
    if (!difficulty) return "";
    return `${difficulty[0].toUpperCase()}${difficulty.slice(1)}`;
  }, [difficulty]);

  function selectDifficulty(level) {
    setDifficulty(level);
    setText(getSoloTimedText(level, timeLimit));
  }

  function refreshText(level = difficulty, duration = timeLimit) {
    setText(getSoloTimedText(level, duration));
  }

  function handleComplete(stats) {
    const key = `flashType_best_${difficulty}_${timeLimit}s`;
    const currentBest = Number(localStorage.getItem(key) || 0);
    if (stats.wpm > currentBest) localStorage.setItem(key, String(stats.wpm));

    navigate("/results", {
      state: {
        mode: "solo",
        difficulty,
        timeLimit,
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

  return (
    <main className="page">
      <div className="top-row">
        <h2>Solo Practice</h2>
        <button type="button" onClick={() => navigate("/")}>
          Back
        </button>
      </div>

      {!difficulty && (
        <div className="button-wrap">
          {difficulties.map((level) => (
            <button key={level} type="button" onClick={() => selectDifficulty(level)}>
              {level[0].toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      )}

      {!difficulty && (
        <div className="button-wrap">
          {[30, 60, 90].map((sec) => (
            <button key={sec} type="button" onClick={() => setTimeLimit(sec)}>
              {sec}s
            </button>
          ))}
        </div>
      )}

      {difficulty && text && (
        <section>
          <div className="solo-header">
            <span>
              Difficulty: {difficultyLabel} | Timer: {timeLimit}s
            </span>
            <button type="button" onClick={() => refreshText()}>
              Shuffle Text
            </button>
          </div>
          <TypingBox
            text={text}
            onComplete={handleComplete}
            allowBackspace
            enabled
            timedMode
            timeLimitSec={timeLimit}
          />
          <div className="button-wrap">
            <button type="button" onClick={() => setDifficulty("")}>
              Change Settings
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default Solo;
