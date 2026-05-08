import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

function Online() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("searching"); // searching, found
  const [opponent, setOpponent] = useState(null);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      navigate("/");
      return;
    }

    if (!socket.connected) socket.connect();

    // Join matchmaking queue
    socket.emit("join_matchmaking", { username });

    function onMatchFound(payload) {
      setStatus("found");
      setOpponent(payload.opponent);
      
      // Keep UI showing "Match Found" for 2 seconds, then transition to Race
      setTimeout(() => {
        // We set flash_room and flash_host so Race component can read them if needed. 
        // For matchmaking, host doesn't really matter for starting since server handles it.
        sessionStorage.setItem("flash_room", payload.roomCode);
        sessionStorage.setItem("flash_host", "false"); 

        navigate("/race", {
          state: {
            roomCode: payload.roomCode,
            username,
            text: payload.text,
            isHost: false, // neither is host for UI purposes, prevent "End Race" button
            isMatchmaking: true, // Hide play again and settings buttons
            players: payload.players,
            settings: payload.settings
          }
        });
      }, 2000);
    }

    function onDisconnect() {
      // If server disconnects or something, go back
      navigate("/");
    }

    socket.on("match_found", onMatchFound);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.emit("leave_matchmaking");
      socket.off("match_found", onMatchFound);
      socket.off("disconnect", onDisconnect);
    };
  }, [navigate]);

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
      </div>
    </main>
  );
}

export default Online;
