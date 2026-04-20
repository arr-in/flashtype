import { useEffect, useMemo, useRef, useState } from "react";

function TypingBox({ text, onComplete, onProgress, allowBackspace = true, enabled = true }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charStates, setCharStates] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const completeRef = useRef(false);

  const typedCount = currentIndex;
  const accuracy = typedCount > 0 ? (correctCount / typedCount) * 100 : 100;
  const wpm = elapsedMs > 0 ? (correctCount / 5) / (elapsedMs / 60000) : 0;

  useEffect(() => {
    setCharStates(Array.from({ length: text.length }, () => "untyped"));
    setCurrentIndex(0);
    setCorrectCount(0);
    setErrorCount(0);
    setStartTime(null);
    setElapsedMs(0);
    completeRef.current = false;
  }, [text]);

  useEffect(() => {
    if (!startTime) return undefined;
    const id = setInterval(() => setElapsedMs(Date.now() - startTime), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  useEffect(() => {
    if (typedCount > 0) onProgress?.({ charsTyped: typedCount, wpm, accuracy });
  }, [typedCount, wpm, accuracy, onProgress]);

  useEffect(() => {
    if (!text || currentIndex < text.length || completeRef.current) return;
    completeRef.current = true;
    const finalTime = startTime ? Date.now() - startTime : 0;
    onComplete?.({ wpm: Math.round(wpm), accuracy: Math.round(accuracy), timeMs: finalTime });
  }, [text, currentIndex, startTime, wpm, accuracy, onComplete]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!enabled || completeRef.current || !text) return;

      if (!startTime && e.key.length === 1) setStartTime(Date.now());

      if (allowBackspace && e.key === "Backspace" && currentIndex > 0) {
        e.preventDefault();
        const previousState = charStates[currentIndex - 1];
        setCharStates((prev) => {
          const next = [...prev];
          next[currentIndex - 1] = "untyped";
          return next;
        });
        if (previousState === "correct") setCorrectCount((c) => Math.max(0, c - 1));
        if (previousState === "error") setErrorCount((c) => Math.max(0, c - 1));
        setCurrentIndex((i) => i - 1);
        return;
      }

      if (e.key.length !== 1 || currentIndex >= text.length) return;

      e.preventDefault();
      const isCorrect = e.key === text[currentIndex];
      setCharStates((prev) => {
        const next = [...prev];
        next[currentIndex] = isCorrect ? "correct" : "error";
        return next;
      });
      if (isCorrect) setCorrectCount((c) => c + 1);
      else setErrorCount((c) => c + 1);
      setCurrentIndex((i) => i + 1);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [text, enabled, startTime, currentIndex, allowBackspace, charStates]);

  const elapsedSeconds = useMemo(() => {
    if (!startTime) return 0;
    return Math.max(1, Math.round(elapsedMs / 1000));
  }, [startTime, elapsedMs]);

  return (
    <div className={`typing-box ${enabled ? "" : "typing-box-disabled"}`}>
      <div className="typing-metrics">
        <span>WPM: {Math.round(wpm)}</span>
        <span>Accuracy: {Math.round(accuracy)}%</span>
      </div>

      <div className="typing-text" role="textbox" aria-label="Typing workspace">
        {text.split("").map((char, index) => (
          <span key={`${char}-${index}`} className={`char ${charStates[index] || "untyped"}`}>
            {index === currentIndex && enabled && <span className="typing-cursor" />}
            {char}
          </span>
        ))}
      </div>

      <div className="typing-subtext">
        <span>Time: {elapsedSeconds}s</span>
        <span>Errors: {errorCount}</span>
      </div>
    </div>
  );
}

export default TypingBox;
