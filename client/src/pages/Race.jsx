import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Countdown from "../components/Countdown";
import RaceTrack from "../components/RaceTrack";
import TypingBox from "../components/TypingBox";
import { socket } from "../socket";

const cursorPalette = ["#63a7ff", "#7fd9a8", "#e0a5ff", "#ffd166", "#8ecae6", "#f28482"];

function colorForUsername(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i += 1) {
    hash = (hash + username.charCodeAt(i) * (i + 1)) % 10000;
  }
  return cursorPalette[hash % cursorPalette.length];
}

function Race() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const roomCode = state.roomCode || sessionStorage.getItem("flash_room") || "";
  const username = state.username || sessionStorage.getItem("flash_username") || "";
  const raceText = state.text || "";
  const timeLimitSec = state.settings?.timeLimit || 60;

  const [countdownValue, setCountdownValue] = useState("3");
  const [showCountdown, setShowCountdown] = useState(true);
  const [typingEnabled, setTypingEnabled] = useState(false);
  const [players, setPlayers] = useState(state.players || []);
  const raceStartRef = useRef(null);
  const timelineRef = useRef({});
  const isHost = sessionStorage.getItem("flash_host") === "true";

  useEffect(() => {
    if (!raceText || !roomCode || !username) {
      navigate("/lobby");
      return;
    }
    // Show "3" immediately, then tick every 1s to 2 → 1 → GO!
    // GO! hides after 0.8s. Total elapsed before typing enabled: ~3.8s.
    // Server fires race timeout at 4s — aligned.
    const sequence = ["3", "2", "1", "GO!"];
    setCountdownValue("3"); // show immediately
    let index = 1;
    const timer = setInterval(() => {
      setCountdownValue(sequence[index]);
      index += 1;
      if (index >= sequence.length) {
        clearInterval(timer);
        setTimeout(() => {
          setShowCountdown(false);
          setTypingEnabled(true);
          raceStartRef.current = Date.now();
        }, 800);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [raceText, roomCode, username, navigate]);

  useEffect(() => {
    function onPositionUpdate(payload) {
      const nextPlayers = payload.players || [];
      setPlayers(nextPlayers);
      const prev = timelineRef.current || {};
      {
        const now = Date.now();
        const raceStart = raceStartRef.current || now;
        const next = { ...prev };
        nextPlayers.forEach((player) => {
          const existing = next[player.username] ? [...next[player.username]] : [];
          existing.push({
            t: now - raceStart,
            wpm: Math.round(player.wpm || 0)
          });
          next[player.username] = existing.slice(-240);
        });
        timelineRef.current = next;
      }
    }

    function onRaceOver(payload) {
      navigate("/results", {
        state: {
          mode: "multiplayer",
          roomCode,
          currentUser: username,
          isHost: sessionStorage.getItem("flash_host") === "true",
          results: payload.results || [],
          speedTimeline: timelineRef.current
        }
      });
    }

    socket.on("position_update", onPositionUpdate);
    socket.on("race_over", onRaceOver);
    return () => {
      socket.off("position_update", onPositionUpdate);
      socket.off("race_over", onRaceOver);
    };
  }, [navigate, roomCode, username]);

  function handleProgress({ charsTyped, wpm, accuracy }) {
    socket.emit("typing_update", {
      roomCode,
      username,
      charsTyped,
      totalChars: raceText.length,
      wpm,
      accuracy
    });
  }

  function handleComplete({ wpm, accuracy, timeMs }) {
    socket.emit("player_finished", { roomCode, username, wpm, accuracy, timeMs });
  }

  function handleDisqualified({ wpm, accuracy, timeMs }) {
    setTypingEnabled(false);
    socket.emit("player_disqualified", { roomCode, username, wpm, accuracy, timeMs });
  }

  function endRace() {
    socket.emit("end_race", {
      roomCode,
      username: sessionStorage.getItem("flash_username")
    });
  }

  const trackPlayers = useMemo(() => {
    if (players.some((p) => p.username === username)) return players;
    return [...players, { username, progress: 0, charsTyped: 0, wpm: 0, finished: false }];
  }, [players, username]);

  const ghostCursors = useMemo(
    () =>
      trackPlayers
        .filter((p) => p.username !== username)
        .map((p) => ({
          username: p.username,
          index: Math.max(0, Number(p.charsTyped || 0)),
          color: colorForUsername(p.username)
        })),
    [trackPlayers, username]
  );

  const me = trackPlayers.find((p) => p.username === username);
  const isDisqualified = Boolean(me?.disqualified);

  return (
    <main className="page race-page">
      <div className="race-actions">
        {isHost && (
          <button type="button" onClick={endRace}>
            End Race
          </button>
        )}
        {isDisqualified && <p className="error-text">Disqualified: 5 wrong words in a row.</p>}
      </div>
      <RaceTrack players={trackPlayers} />
      <TypingBox
        text={raceText}
        onProgress={handleProgress}
        onComplete={handleComplete}
        onDisqualify={handleDisqualified}
        allowBackspace
        enabled={typingEnabled && !isDisqualified}
        ghostCursors={ghostCursors}
        disqualifyAfterWrongWords={5}
        timedMode
        timeLimitSec={timeLimitSec}
      />
      <Countdown value={countdownValue} visible={showCountdown} />
    </main>
  );
}

export default Race;
