import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Countdown from "../components/Countdown";
import RaceTrack from "../components/RaceTrack";
import TypingBox from "../components/TypingBox";
import { socket } from "../socket";

function Race() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const roomCode = state.roomCode || sessionStorage.getItem("flash_room") || "";
  const username = state.username || sessionStorage.getItem("flash_username") || "";
  const raceText = state.text || "";

  const [countdownValue, setCountdownValue] = useState("3");
  const [showCountdown, setShowCountdown] = useState(true);
  const [typingEnabled, setTypingEnabled] = useState(false);
  const [players, setPlayers] = useState(state.players || []);

  useEffect(() => {
    if (!raceText || !roomCode || !username) {
      navigate("/lobby");
      return;
    }
    const sequence = ["3", "2", "1", "GO!"];
    let index = 0;
    const timer = setInterval(() => {
      setCountdownValue(sequence[index]);
      index += 1;
      if (index >= sequence.length) {
        clearInterval(timer);
        setTimeout(() => {
          setShowCountdown(false);
          setTypingEnabled(true);
        }, 400);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [raceText, roomCode, username, navigate]);

  useEffect(() => {
    function onPositionUpdate(payload) {
      setPlayers(payload.players || []);
    }

    function onRaceOver(payload) {
      navigate("/results", {
        state: {
          mode: "multiplayer",
          roomCode,
          currentUser: username,
          isHost: sessionStorage.getItem("flash_host") === "true",
          results: payload.results || []
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

  const trackPlayers = useMemo(() => {
    if (players.some((p) => p.username === username)) return players;
    return [...players, { username, progress: 0, wpm: 0, finished: false }];
  }, [players, username]);

  return (
    <main className="page race-page">
      <RaceTrack players={trackPlayers} />
      <TypingBox text={raceText} onProgress={handleProgress} onComplete={handleComplete} allowBackspace={false} enabled={typingEnabled} />
      <Countdown value={countdownValue} visible={showCountdown} />
    </main>
  );
}

export default Race;
