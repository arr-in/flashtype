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
  onRestart,
  collectTelemetry = false
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charStates, setCharStates] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [currentWordHasError, setCurrentWordHasError] = useState(false);
  const [wrongWordStreak, setWrongWordStreak] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [lineOffsetPx, setLineOffsetPx] = useState(0);
  const completeRef = useRef(false);
  const textViewportRef = useRef(null);
  const backspaceCountRef = useRef(0);
  const keyMetricsRef = useRef({});
  const keyEventsRef = useRef([]);
  const lastInputTsRef = useRef(null);

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
    setLineOffsetPx(0);
    backspaceCountRef.current = 0;
    keyMetricsRef.current = {};
    keyEventsRef.current = [];
    lastInputTsRef.current = null;
    completeRef.current = false;
  }, [text]);

  function buildTelemetry(finalElapsedMs) {
    if (!collectTelemetry) return null;

    const wordBuckets = {};
    keyEventsRef.current.forEach((evt) => {
      const wordIndex = text.slice(0, evt.index + 1).split(" ").length - 1;
      if (!wordBuckets[wordIndex]) {
        wordBuckets[wordIndex] = { attempts: 0, errors: 0, delayTotal: 0 };
      }
      wordBuckets[wordIndex].attempts += 1;
      wordBuckets[wordIndex].delayTotal += evt.delayMs || 0;
      if (!evt.isCorrect) wordBuckets[wordIndex].errors += 1;
    });

    const words = text.split(/\s+/).filter(Boolean);
    const hardWords = Object.entries(wordBuckets)
      .map(([idx, bucket]) => {
        const word = words[Number(idx)] || "";
        const avgDelay = bucket.attempts ? bucket.delayTotal / bucket.attempts : 0;
        const difficultyScore = bucket.errors * 3 + avgDelay / 140;
        return {
          word,
          errors: bucket.errors,
          avgDelay: Math.round(avgDelay),
          difficultyScore
        };
      })
      .filter((item) => item.word)
      .sort((a, b) => b.difficultyScore - a.difficultyScore)
      .slice(0, 8);

    return {
      elapsedMs: finalElapsedMs,
      backspaceCount: backspaceCountRef.current,
      keyMetrics: keyMetricsRef.current,
      hardWords
    };
  }

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
        completedText: false,
        telemetry: buildTelemetry(timeLimitSec * 1000)
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
    onComplete?.({
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy),
      timeMs: finalTime,
      completedText: true,
      telemetry: buildTelemetry(finalTime)
    });
  }, [text, currentIndex, startTime, wpm, accuracy, onComplete, timedMode]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!enabled || completeRef.current || !text) return;

      if (e.key === "Escape" && onRestart) {
        e.preventDefault();
        onRestart();
        return;
      }

      if (!startTime && e.key.length === 1) setStartTime(Date.now());

      if (allowBackspace && e.key === "Backspace" && currentIndex > 0) {
        e.preventDefault();
        backspaceCountRef.current += 1;
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
      const now = Date.now();
      const delayMs = lastInputTsRef.current ? now - lastInputTsRef.current : 0;
      lastInputTsRef.current = now;

      const keyLabel = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key;
      if (!keyMetricsRef.current[keyLabel]) {
        keyMetricsRef.current[keyLabel] = { count: 0, totalDelay: 0, avgDelay: 0 };
      }
      keyMetricsRef.current[keyLabel].count += 1;
      keyMetricsRef.current[keyLabel].totalDelay += delayMs;
      keyMetricsRef.current[keyLabel].avgDelay =
        keyMetricsRef.current[keyLabel].totalDelay / keyMetricsRef.current[keyLabel].count;

      const isCorrect = e.key === text[currentIndex];
      keyEventsRef.current.push({
        index: currentIndex,
        expected: text[currentIndex],
        typed: e.key,
        isCorrect,
        delayMs
      });
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

  useEffect(() => {
    if (!textViewportRef.current || currentIndex <= 0) return;
    const viewport = textViewportRef.current;
    const activeChar = viewport.querySelector(`[data-char-index="${Math.max(0, currentIndex - 1)}"]`);
    if (!activeChar) return;

    const viewportStyle = window.getComputedStyle(viewport);
    const lineHeight = parseFloat(viewportStyle.lineHeight) || 48;
    const currentLine = Math.floor(activeChar.offsetTop / lineHeight);
    const nextOffset = currentLine > 3 ? (currentLine - 3) * lineHeight : 0;
    if (nextOffset !== lineOffsetPx) setLineOffsetPx(nextOffset);
  }, [currentIndex, lineOffsetPx]);

  return (
    <div className={`typing-box ${enabled ? "" : "typing-box-disabled"}`}>
      <div className="typing-metrics">
        <span>WPM: {Math.round(wpm)}</span>
        <span>Accuracy: {Math.round(accuracy)}%</span>
      </div>

      <div className="typing-timer-large">{timedMode ? `${remainingSeconds}s` : `${elapsedSeconds}s`}</div>

      <div ref={textViewportRef} className="typing-text" role="textbox" aria-label="Typing workspace">
        <div className="typing-text-inner" style={{ transform: `translateY(-${lineOffsetPx}px)` }}>
          {text.split("").map((char, index) => (
            <span
              key={`${char}-${index}`}
              data-char-index={index}
              className={`char ${charStates[index] || "untyped"}`}
            >
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
      </div>

      <div className="typing-subtext">
        <span>Errors: {errorCount}</span>
        {disqualifyAfterWrongWords > 0 && <span>Wrong-word streak: {wrongWordStreak}</span>}
        {onRestart && <span>Shortcut: Esc</span>}
        {onRestart && (
          <button type="button" className="typing-restart-button" onClick={onRestart}>
            Restart Test
          </button>
        )}
      </div>
    </div>
  );
}

export default TypingBox;
