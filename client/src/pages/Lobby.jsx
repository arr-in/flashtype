import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

function Lobby() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [host, setHost] = useState("");
  const [error, setError] = useState("");
  const [joinMode, setJoinMode] = useState(false);
  const [raceSettings, setRaceSettings] = useState({
    difficulty: "hard",
    includeNumbers: true,
    includeSymbols: true
  });

  useEffect(() => {
    function onRoomJoined(payload) {
      setRoomCode(payload.roomCode);
      setPlayers(payload.players || []);
      setIsHost(Boolean(payload.isHost));
      setHost(payload.host || "");
      if (payload.settings) setRaceSettings(payload.settings);
      setError("");
      sessionStorage.setItem("flash_username", username.trim());
      sessionStorage.setItem("flash_room", payload.roomCode);
      sessionStorage.setItem("flash_host", String(Boolean(payload.isHost)));
    }

    function onPlayerList(payload) {
      const currentUsername = sessionStorage.getItem("flash_username") || username;
      const hostName = payload.host || "";
      setPlayers(payload.players || []);
      setHost(hostName);
      if (payload.settings) setRaceSettings(payload.settings);
      setIsHost(currentUsername === hostName);
      sessionStorage.setItem("flash_host", String(currentUsername === hostName));
    }

    function onError(payload) {
      setError(payload.message || "Something went wrong.");
    }

    function onConnectError() {
      setError("Cannot reach server. Check backend URL/CORS and try again.");
    }

    function onRaceStarting(payload) {
      navigate("/race", {
        state: {
          roomCode: payload.roomCode,
          username: sessionStorage.getItem("flash_username"),
          text: payload.text,
          isHost: sessionStorage.getItem("flash_host") === "true",
          players
        }
      });
    }

    socket.on("room_joined", onRoomJoined);
    socket.on("player_list_update", onPlayerList);
    socket.on("room_error", onError);
    socket.on("connect_error", onConnectError);
    socket.on("race_starting", onRaceStarting);
    return () => {
      socket.off("room_joined", onRoomJoined);
      socket.off("player_list_update", onPlayerList);
      socket.off("room_error", onError);
      socket.off("connect_error", onConnectError);
      socket.off("race_starting", onRaceStarting);
    };
  }, [navigate, username, players]);

  function createRoom() {
    if (!username.trim()) return setError("Username is required.");
    if (!socket.connected) socket.connect();
    sessionStorage.setItem("flash_username", username.trim());
    setError("");
    socket.emit("create_room", { username: username.trim() });
  }

  function joinRoom() {
    if (!username.trim() || !roomCodeInput.trim()) return setError("Username and room code are required.");
    if (!socket.connected) socket.connect();
    sessionStorage.setItem("flash_username", username.trim());
    setError("");
    socket.emit("join_room", { username: username.trim(), roomCode: roomCodeInput.trim().toUpperCase() });
  }

  function startRace() {
    socket.emit("start_race", {
      roomCode,
      username: sessionStorage.getItem("flash_username"),
      settings: raceSettings
    });
  }

  async function copyRoomCode() {
    if (!roomCode) return;
    await navigator.clipboard.writeText(roomCode);
  }

  const inWaitingRoom = Boolean(roomCode);

  return (
    <main className="page">
      <div className="top-row">
        <h2>Lobby</h2>
        <button type="button" onClick={() => navigate("/")}>
          Back
        </button>
      </div>

      {!inWaitingRoom && (
        <section className="panel">
          <label htmlFor="username">Enter your username</label>
          <input
            id="username"
            value={username}
            maxLength={16}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <div className="button-wrap">
            <button type="button" onClick={createRoom}>
              Create Room
            </button>
            <button type="button" onClick={() => setJoinMode((prev) => !prev)}>
              Join Room
            </button>
          </div>
          {joinMode && (
            <>
              <input
                value={roomCodeInput}
                maxLength={6}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="Room code"
              />
              <button type="button" onClick={joinRoom}>
                Join
              </button>
            </>
          )}
        </section>
      )}

      {inWaitingRoom && (
        <section className="panel">
          <div className="room-code-row">
            <h3>Room: {roomCode}</h3>
            <button type="button" onClick={copyRoomCode}>
              Copy
            </button>
          </div>
          <div className="player-list">
            {players.map((player) => (
              <div key={player.username} className="player-item">
                {player.username}
                {player.username === host ? " (Host)" : ""}
              </div>
            ))}
          </div>
          {isHost ? (
            <>
              <div className="settings-row">
                <label htmlFor="difficulty">Complexity</label>
                <select
                  id="difficulty"
                  value={raceSettings.difficulty}
                  onChange={(e) =>
                    setRaceSettings((prev) => ({
                      ...prev,
                      difficulty: e.target.value
                    }))
                  }
                >
                  <option value="beginner">Beginner</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div className="settings-row">
                <label>
                  <input
                    type="checkbox"
                    checked={raceSettings.includeNumbers}
                    onChange={(e) =>
                      setRaceSettings((prev) => ({
                        ...prev,
                        includeNumbers: e.target.checked
                      }))
                    }
                  />
                  Include numbers
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={raceSettings.includeSymbols}
                    onChange={(e) =>
                      setRaceSettings((prev) => ({
                        ...prev,
                        includeSymbols: e.target.checked
                      }))
                    }
                  />
                  Include special characters
                </label>
              </div>
              <button type="button" onClick={startRace} disabled={players.length < 2}>
                Start Race
              </button>
            </>
          ) : (
            <p>Waiting for host to start...</p>
          )}
        </section>
      )}

      {error && <p className="error-text">{error}</p>}
    </main>
  );
}

export default Lobby;
