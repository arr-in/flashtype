import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TypingBox from "../components/TypingBox";
import { getRandomSoloText } from "../lib/textBank";

const difficulties = ["beginner", "easy", "medium", "hard", "expert"];

function Solo() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("");
  const [text, setText] = useState("");

  const difficultyLabel = useMemo(() => {
    if (!difficulty) return "";
    return `${difficulty[0].toUpperCase()}${difficulty.slice(1)}`;
  }, [difficulty]);

  function selectDifficulty(level) {
    setDifficulty(level);
    setText(getRandomSoloText(level));
  }

  function handleComplete(stats) {
    const key = `flashType_best_${difficulty}`;
    const currentBest = Number(localStorage.getItem(key) || 0);
    if (stats.wpm > currentBest) localStorage.setItem(key, String(stats.wpm));

    navigate("/results", {
      state: {
        mode: "solo",
        difficulty,
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

      {difficulty && text && (
        <section>
          <div className="solo-header">
            <span>Difficulty: {difficultyLabel}</span>
            <button type="button" onClick={() => selectDifficulty(difficulty)}>
              New Text
            </button>
          </div>
          <TypingBox text={text} onComplete={handleComplete} allowBackspace enabled />
        </section>
      )}
    </main>
  );
}

export default Solo;
