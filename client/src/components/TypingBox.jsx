import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const SIZE_CONFIG = {
  small:  { cls: "typing-size-small",  lineH: 38 },
  medium: { cls: "typing-size-medium", lineH: 52 },
  large:  { cls: "typing-size-large",  lineH: 68 },
};

const VISIBLE_LINES = 4;

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
  onEndEarly,
  onBack,
  collectTelemetry = false,
  difficultyLabel = "",
  fontSize = "medium"
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
  // Smooth sliding cursor state
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [blurAmount, setBlurAmount] = useState(0);
  const completeRef = useRef(false);
  const textViewportRef = useRef(null);
  const textInnerRef = useRef(null);
  const cursorBeamRef = useRef(null);
  const lastKeyTimeRef = useRef(null);
  const blurFadeTimerRef = useRef(null);
  const backspaceCountRef = useRef(0);
  const keyMetricsRef = useRef({});
  const keyEventsRef = useRef([]);
  const lastInputTsRef = useRef(null);

  const hasStarted = startTime !== null;
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
    setCursorPos({ x: 0, y: 0 });
    setBlurAmount(0);
    backspaceCountRef.current = 0;
    keyMetricsRef.current = {};
    keyEventsRef.current = [];
    lastInputTsRef.current = null;
    lastKeyTimeRef.current = null;
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
    const allWordStats = Object.entries(wordBuckets)
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
      .filter((item) => item.word);

    const totalAvgDelay = allWordStats.length > 0
      ? allWordStats.reduce((sum, w) => sum + w.avgDelay, 0) / allWordStats.length
      : 0;

    const hardWords = allWordStats
      .filter((item) => item.errors > 0 || item.avgDelay > totalAvgDelay * 1.3)
      .sort((a, b) => b.difficultyScore - a.difficultyScore)
      .slice(0, 8);

    const clonedKeyMetrics = {};
    for (const [k, v] of Object.entries(keyMetricsRef.current)) {
      clonedKeyMetrics[k] = { ...v };
    }

    return {
      elapsedMs: finalElapsedMs,
      backspaceCount: backspaceCountRef.current,
      keyMetrics: clonedKeyMetrics,
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

  const { cls: sizeClass, lineH: lineHeightPx } = SIZE_CONFIG[fontSize] || SIZE_CONFIG.medium;
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

  // Slide lines smoothly — cursor stays on line 2 of 4 visible
  useEffect(() => {
    if (!textViewportRef.current) return;
    const viewport = textViewportRef.current;
    const idx = Math.max(0, currentIndex - 1);
    const activeChar = viewport.querySelector(`[data-char-index="${idx}"]`);
    if (!activeChar) return;
    const currentLine = Math.floor(activeChar.offsetTop / lineHeightPx);
    const nextOffset = currentLine > 1 ? (currentLine - 1) * lineHeightPx : 0;
    setLineOffsetPx(nextOffset);
  }, [currentIndex, lineHeightPx]);

  // ── Sliding cursor position tracker ──────────────────────────
  useLayoutEffect(() => {
    if (!textInnerRef.current || !enabled) return;
    const inner = textInnerRef.current;
    const activeChar = inner.querySelector(`[data-char-index="${currentIndex}"]`);
    if (!activeChar) return;
    const innerRect = inner.getBoundingClientRect();
    const charRect = activeChar.getBoundingClientRect();
    const x = charRect.left - innerRect.left;
    const y = charRect.top - innerRect.top;
    setCursorPos({ x, y });

    // Compute typing velocity → motion blur
    const now = performance.now();
    if (lastKeyTimeRef.current !== null) {
      const delta = now - lastKeyTimeRef.current;
      // faster keystrokes → more blur (cap at 8px)
      const rawBlur = Math.min(8, Math.max(0, 120 / delta - 0.5));
      setBlurAmount(rawBlur);
      // Fade blur out after 220ms
      clearTimeout(blurFadeTimerRef.current);
      blurFadeTimerRef.current = setTimeout(() => setBlurAmount(0), 220);
    }
    lastKeyTimeRef.current = now;
  }, [currentIndex, enabled]);

  function handleEndEarly() {
    if (completeRef.current || !hasStarted) return;
    completeRef.current = true;
    const finalTime = startTime ? Date.now() - startTime : 0;
    onEndEarly?.({
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy),
      timeMs: finalTime,
      completedText: false,
      telemetry: buildTelemetry(finalTime)
    });
  }

  return (
    <div className={`typing-box-fullscreen ${enabled ? "" : "typing-box-disabled"}`}>

      {/* Pre-start prompt + Back button — hidden once typing starts */}
      {!hasStarted && (
        <div className="typing-prestart">
          {onBack && (
            <button type="button" className="solo-back-btn typing-back-btn" onClick={onBack}>
              ← Back
            </button>
          )}
          <span className="typing-prestart-hint">Start typing to begin…</span>
          {difficultyLabel && (
            <span className="typing-prestart-meta">{difficultyLabel} · {timeLimitSec}s</span>
          )}
        </div>
      )}

      {/* Live HUD — only shown while typing */}
      {hasStarted && (
        <div className="typing-hud">
          <span className="typing-hud-wpm">{Math.round(wpm)} <small>WPM</small></span>
          <span className="typing-hud-timer">{timedMode ? `${remainingSeconds}s` : `${Math.max(1, Math.round(elapsedMs / 1000))}s`}</span>
          <span className="typing-hud-acc">{Math.round(accuracy)}% <small>ACC</small></span>
        </div>
      )}

      {/* Text area — always visible */}
      <div
        ref={textViewportRef}
        className={`typing-text-full ${sizeClass} ${!hasStarted ? "typing-text-idle" : ""}`}
        role="textbox"
        aria-label="Typing workspace"
        style={{ height: `${lineHeightPx * VISIBLE_LINES}px` }}
      >
        <div
          ref={textInnerRef}
          className="typing-text-inner"
          style={{ transform: `translateY(-${lineOffsetPx}px)` }}
        >
          {/* Single smooth sliding cursor beam */}
          {enabled && (
            <div
              ref={cursorBeamRef}
              className="typing-cursor-beam"
              style={{
                transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)`,
                "--blur": `${blurAmount}px`,
              }}
            />
          )}
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
              {char}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom bar — only shown while typing */}
      {hasStarted && (
        <div className="typing-bottombar">
          <span className="typing-errors-count">Errors: {errorCount}</span>
          <div className="typing-bottombar-actions">
            {onEndEarly && (
              <button type="button" className="typing-end-button" onClick={handleEndEarly}>
                End Test
              </button>
            )}
            {onRestart && (
              <button type="button" className="typing-restart-button" onClick={onRestart}>
                Restart <kbd>Esc</kbd>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TypingBox;
