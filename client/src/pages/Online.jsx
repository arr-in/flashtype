import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { useUser } from "@clerk/clerk-react";
import { getStoredUsername } from "../lib/userStats";

function Online() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [status, setStatus] = useState("searching"); // searching, found
  const [opponent, setOpponent] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const transitionTimerRef = useRef(null);

  useEffect(() => {
    const activeUsername = getStoredUsername(user || null) || localStorage.getItem("username") || "Anonymous";
    localStorage.setItem("username", activeUsername);

    function joinQueue() {
      socket.emit("join_matchmaking", { username: activeUsername });
    }

    if (!socket.connected) {
      socket.connect();
    } else {
      joinQueue();
    }

    function onConnect() {
      joinQueue();
    }

    function onMatchFound(payload) {
      setStatus("found");
      setOpponent(payload.opponent);
      
      // Keep UI showing "Match Found" for 2 seconds, then transition to Race
      transitionTimerRef.current = setTimeout(() => {
        sessionStorage.setItem("flash_room", payload.roomCode);
        sessionStorage.setItem("flash_host", "false"); 

        navigate("/race", {
          state: {
            roomCode: payload.roomCode,
            username: activeUsername,
            text: payload.text,
            isHost: false,
            isMatchmaking: true,
            players: payload.players,
            settings: payload.settings
          }
        });
      }, 2000);
    }

    function onOpponentDisconnected() {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      setStatus("searching");
      setOpponent(null);
      setErrorMsg("Opponent left. Searching for another opponent...");
      setTimeout(() => setErrorMsg(""), 3000);
      joinQueue();
    }

    function onDisconnect() {
      setErrorMsg("Disconnected from server. Retrying...");
    }

    socket.on("connect", onConnect);
    socket.on("match_found", onMatchFound);
    socket.on("opponent_disconnected", onOpponentDisconnected);
    socket.on("disconnect", onDisconnect);

    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      socket.emit("leave_matchmaking");
      socket.off("connect", onConnect);
      socket.off("match_found", onMatchFound);
      socket.off("opponent_disconnected", onOpponentDisconnected);
      socket.off("disconnect", onDisconnect);
    };
  }, [navigate, user]);

  function handleCancel() {
    socket.emit("leave_matchmaking");
    navigate("/");
  }

  return (
    <main className="lobby-setup-page">
      <button
        type="button"
        className="solo-back-btn"
        onClick={handleCancel}
      >
        ← Cancel
      </button>

      <div className="lobby-setup-center" style={{ textAlign: "center" }}>
        <h1 className="solo-setup-title">Online Matchmaking</h1>
        
        {status === "searching" ? (
          <>
            <p className="lobby-setup-subtitle">Finding a random opponent...</p>
            <div className="lobby-waiting-pulse" style={{ marginTop: "40px", fontSize: "1.2rem", justifyContent: "center" }}>
              <span className="lobby-pulse-dot" />
              Searching
            </div>
          </>
        ) : (
          <>
            <p className="lobby-setup-subtitle" style={{ color: "#7fd9a8", fontWeight: "bold" }}>Match Found!</p>
            <div className="lobby-player-card" style={{ marginTop: "40px", display: "inline-flex", background: "rgba(255,255,255,0.1)" }}>
              <div className="lobby-player-avatar">{opponent?.slice(0, 2).toUpperCase()}</div>
              <div className="lobby-player-info">
                <span className="lobby-player-name">{opponent}</span>
                <span className="lobby-badge" style={{ background: "#f28482", color: "#1e1e24" }}>Opponent</span>
              </div>
            </div>
            <p className="solo-setup-label" style={{ marginTop: "20px" }}>Prepare to type...</p>
          </>
        )}

        {errorMsg && <p className="error-text lobby-error" style={{ marginTop: "20px" }}>{errorMsg}</p>}
      </div>
    </main>
  );
}

export default Online;
