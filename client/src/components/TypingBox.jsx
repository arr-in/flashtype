import { useEffect, useMemo, useRef, useState } from "react";

function TypingBox({
  text,
  onComplete,
  onProgress,
  allowBackspace = true,
  enabled = true,
  ghostCursors = [],
  timedMode = false,
  timeLimitSec = 60,
  disqualifyAfterWrongWords = 0,
  onDisqualify,
  onRestart
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charStates, setCharStates] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [currentWordHasError, setCurrentWordHasError] = useState(false);
  const [wrongWordStreak, setWrongWordStreak] = useState(0);
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
    setCurrentWordHasError(false);
    setWrongWordStreak(0);
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
    if (!timedMode || !startTime || completeRef.current) return undefined;

    const timeout = setTimeout(() => {
      if (completeRef.current) return;
      completeRef.current = true;
      onComplete?.({
        wpm: Math.round(wpm),
        accuracy: Math.round(accuracy),
        timeMs: timeLimitSec * 1000,
        completedText: false
      });
    }, Math.max(0, timeLimitSec * 1000 - elapsedMs));

    return () => clearTimeout(timeout);
  }, [timedMode, startTime, elapsedMs, onComplete, wpm, accuracy, timeLimitSec]);

  useEffect(() => {
    onProgress?.({ charsTyped: typedCount, wpm, accuracy });
  }, [typedCount, wpm, accuracy, onProgress]);

  useEffect(() => {
    if (!text || currentIndex < text.length || completeRef.current || timedMode) return;
    completeRef.current = true;
    const finalTime = startTime ? Date.now() - startTime : 0;
    onComplete?.({ wpm: Math.round(wpm), accuracy: Math.round(accuracy), timeMs: finalTime, completedText: true });
  }, [text, currentIndex, startTime, wpm, accuracy, onComplete, timedMode]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!enabled || completeRef.current || !text) return;

      if ((e.key === "r" || e.key === "R") && onRestart) {
        e.preventDefault();
        onRestart();
        return;
      }

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
        setCurrentWordHasError(false);
        setWrongWordStreak(0);
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
      else {
        setErrorCount((c) => c + 1);
        setCurrentWordHasError(true);
      }

      const expectedChar = text[currentIndex];
      if (expectedChar === " " || currentIndex === text.length - 1) {
        const nextWordStreak = currentWordHasError || !isCorrect ? wrongWordStreak + 1 : 0;
        setWrongWordStreak(nextWordStreak);
        setCurrentWordHasError(false);

        if (disqualifyAfterWrongWords > 0 && nextWordStreak >= disqualifyAfterWrongWords && !completeRef.current) {
          completeRef.current = true;
          const finalTime = startTime ? Date.now() - startTime : 0;
          onDisqualify?.({
            wpm: Math.round(wpm),
            accuracy: Math.round(accuracy),
            timeMs: finalTime,
            wrongWordStreak: nextWordStreak
          });
          return;
        }
      }
      setCurrentIndex((i) => i + 1);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    text,
    enabled,
    startTime,
    currentIndex,
    allowBackspace,
    charStates,
    currentWordHasError,
    wrongWordStreak,
    disqualifyAfterWrongWords,
    onDisqualify,
    wpm,
    accuracy,
    onRestart
  ]);

  const elapsedSeconds = useMemo(() => {
    if (!startTime) return 0;
    return Math.max(1, Math.round(elapsedMs / 1000));
  }, [startTime, elapsedMs]);
  const remainingSeconds = Math.max(0, timeLimitSec - Math.floor(elapsedMs / 1000));

  const ghostCursorByIndex = useMemo(() => {
    const map = {};
    ghostCursors.forEach((cursor) => {
      const idx = Number(cursor.index);
      if (Number.isNaN(idx)) return;
      const safeIdx = Math.max(0, Math.min(text.length - 1, idx));
      if (!map[safeIdx]) map[safeIdx] = [];
      map[safeIdx].push(cursor);
    });
    return map;
  }, [ghostCursors, text.length]);

  return (
    <div className={`typing-box ${enabled ? "" : "typing-box-disabled"}`}>
      <div className="typing-metrics">
        <span>WPM: {Math.round(wpm)}</span>
        <span>Accuracy: {Math.round(accuracy)}%</span>
      </div>

      <div className="typing-timer-large">{timedMode ? `${remainingSeconds}s` : `${elapsedSeconds}s`}</div>

      <div className="typing-text" role="textbox" aria-label="Typing workspace">
        {text.split("").map((char, index) => (
          <span key={`${char}-${index}`} className={`char ${charStates[index] || "untyped"}`}>
            {!!ghostCursorByIndex[index] &&
              ghostCursorByIndex[index].map((cursor) => (
                <span
                  key={`${cursor.username}-${index}`}
                  className="ghost-cursor"
                  style={{ borderColor: cursor.color || "#6aa0ff" }}
                  title={cursor.username}
                />
              ))}
            {index === currentIndex && enabled && <span className="typing-cursor" />}
            {char}
          </span>
        ))}
      </div>

      <div className="typing-subtext">
        <span>Errors: {errorCount}</span>
        {disqualifyAfterWrongWords > 0 && <span>Wrong-word streak: {wrongWordStreak}</span>}
        {onRestart && <span>Restart: press R</span>}
      </div>
    </div>
  );
}

export default TypingBox;
