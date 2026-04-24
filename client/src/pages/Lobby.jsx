import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

const DIFFICULTIES = ["beginner", "easy", "medium", "hard", "expert"];
const DURATIONS = [15, 30, 60, 90];
const WORD_LENGTHS = ["short", "medium", "long"];

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
  const [roomStatus, setRoomStatus] = useState("waiting");
  const [readyPlayers, setReadyPlayers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [raceSettings, setRaceSettings] = useState({
    difficulty: "hard",
    timeLimit: 60,
    includeNumbers: true,
    includeSymbols: true,
    allowCaps: true,
    wordLength: "medium"
  });

  useEffect(() => {
    function onRoomJoined(payload) {
      setRoomCode(payload.roomCode);
      setPlayers(payload.players || []);
      setIsHost(Boolean(payload.isHost));
      setHost(payload.host || "");
      if (payload.settings) setRaceSettings(payload.settings);
      setRoomStatus(payload.status || "waiting");
      setReadyPlayers(payload.readyPlayers || []);
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
      setRoomStatus(payload.status || "waiting");
      setReadyPlayers(payload.readyPlayers || []);
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
          players,
          settings: payload.settings
        }
      });
    }

    function onReturnToLobby(payload) {
      // All players get sent back into the waiting room
      setRoomCode(payload.roomCode);
      setPlayers(payload.players || []);
      setHost(payload.host || "");
      if (payload.settings) setRaceSettings(payload.settings);
      setRoomStatus(payload.status || "waiting");
      setReadyPlayers([]);
      const currentUsername = sessionStorage.getItem("flash_username") || username;
      setIsHost(currentUsername === (payload.host || ""));
    }

    socket.on("room_joined", onRoomJoined);
    socket.on("player_list_update", onPlayerList);
    socket.on("room_error", onError);
    socket.on("connect_error", onConnectError);
    socket.on("race_starting", onRaceStarting);
    socket.on("return_to_lobby", onReturnToLobby);
    return () => {
      socket.off("room_joined", onRoomJoined);
      socket.off("player_list_update", onPlayerList);
      socket.off("room_error", onError);
      socket.off("connect_error", onConnectError);
      socket.off("race_starting", onRaceStarting);
      socket.off("return_to_lobby", onReturnToLobby);
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
    if (!username.trim() || !roomCodeInput.trim())
      return setError("Username and room code are required.");
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
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function setSetting(key, value) {
    const updated = { [key]: value };
    setRaceSettings((prev) => ({ ...prev, ...updated }));
    // Broadcast setting change to all players immediately
    if (roomCode) {
      socket.emit("update_settings", {
        roomCode,
        username: sessionStorage.getItem("flash_username") || username,
        settings: updated
      });
    }
  }

  const inWaitingRoom = Boolean(roomCode);
  const readyCount = readyPlayers.length;
  const canStartRace =
    roomStatus === "finished" ? readyCount >= 2 : players.length >= 2;

  // ── Pre-room: join/create screen ──────────────────────────────────
  if (!inWaitingRoom) {
    return (
      <main className="lobby-setup-page">
        <button
          type="button"
          className="solo-back-btn"
          onClick={() => navigate("/")}
        >
          ← Back
        </button>

        <div className="lobby-setup-center">
          <h1 className="solo-setup-title">Multiplayer</h1>
          <p className="lobby-setup-subtitle">Race against others in real-time</p>

          <div className="lobby-input-group">
            <p className="solo-setup-label">Your Username</p>
            <input
              id="username"
              className="lobby-text-input"
              value={username}
              maxLength={16}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !joinMode && createRoom()}
              placeholder="e.g. flash_racer"
              autoFocus
            />
          </div>

          {!joinMode ? (
            <div className="lobby-action-buttons">
              <button
                type="button"
                className="flash-start-button lobby-cta-btn"
                onClick={createRoom}
              >
                ⚡ Create Room
              </button>
              <button
                type="button"
                className="lobby-secondary-btn"
                onClick={() => setJoinMode(true)}
              >
                Join a Room →
              </button>
            </div>
          ) : (
            <div className="lobby-join-panel">
              <div className="lobby-input-group">
                <p className="solo-setup-label">Room Code</p>
                <input
                  className="lobby-text-input lobby-code-input"
                  value={roomCodeInput}
                  maxLength={6}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                  placeholder="XXXXXX"
                />
              </div>
              <div className="lobby-action-buttons">
                <button
                  type="button"
                  className="flash-start-button lobby-cta-btn"
                  onClick={joinRoom}
                >
                  ⚡ Join Room
                </button>
                <button
                  type="button"
                  className="lobby-secondary-btn"
                  onClick={() => { setJoinMode(false); setRoomCodeInput(""); }}
                >
                  ← Back
                </button>
              </div>
            </div>
          )}

          {error && <p className="error-text lobby-error">{error}</p>}
        </div>
      </main>
    );
  }

  // ── Waiting Room ───────────────────────────────────────────────────
  return (
    <main className="lobby-room-page">
      <button
        type="button"
        className="solo-back-btn"
        onClick={() => navigate("/")}
      >
        ← Back
      </button>

      <div className="lobby-room-center">

        {/* Room code banner */}
        <div className="lobby-room-header">
          <div className="lobby-room-title-row">
            <h1 className="solo-setup-title">Waiting Room</h1>
            <div className="lobby-room-badge">
              <span className="lobby-room-code-label">Room Code</span>
              <span className="lobby-room-code">{roomCode}</span>
              <button
                type="button"
                className="lobby-copy-btn"
                onClick={copyRoomCode}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
          <p className="lobby-setup-subtitle">
            {isHost
              ? "Configure the race and launch when ready."
              : "Waiting for the host to start the race…"}
          </p>
        </div>

        <div className="lobby-room-body">

          {/* ── Players column ── */}
          <div className="lobby-players-col">
            <p className="solo-setup-label">Players — {players.length}/5</p>
            <div className="lobby-player-list">
              {players.map((player) => {
                const isCurrentHost = player.username === host;
                const isReady = readyPlayers.includes(player.username);
                const initials = player.username.slice(0, 2).toUpperCase();
                return (
                  <div
                    key={player.username}
                    className={`lobby-player-card${isCurrentHost ? " lobby-player-host" : ""}`}
                  >
                    <div className="lobby-player-avatar">{initials}</div>
                    <div className="lobby-player-info">
                      <span className="lobby-player-name">{player.username}</span>
                      <div className="lobby-player-badges">
                        {isCurrentHost && (
                          <span className="lobby-badge lobby-badge-host">Host</span>
                        )}
                        {isReady && (
                          <span className="lobby-badge lobby-badge-ready">Ready</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* empty slots */}
              {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="lobby-player-card lobby-player-empty">
                  <div className="lobby-player-avatar lobby-avatar-empty">?</div>
                  <span className="lobby-player-waiting">Waiting for player…</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Settings column (host only) ── */}
          {isHost && (
            <div className="lobby-settings-col">
              <p className="solo-setup-label">Race Settings</p>

              <div className="solo-setup-group">
                <p className="lobby-settings-sublabel">Difficulty</p>
                <div className="solo-setup-buttons">
                  {DIFFICULTIES.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSetting("difficulty", level)}
                      className={raceSettings.difficulty === level ? "selection-button-active" : ""}
                    >
                      {level[0].toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="solo-setup-group">
                <p className="lobby-settings-sublabel">Duration</p>
                <div className="solo-setup-buttons">
                  {DURATIONS.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSetting("timeLimit", sec)}
                      className={raceSettings.timeLimit === sec ? "selection-button-active" : ""}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="solo-setup-group">
                <p className="lobby-settings-sublabel">Word Count</p>
                <div className="solo-setup-buttons">
                  {WORD_LENGTHS.map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setSetting("wordLength", len)}
                      className={raceSettings.wordLength === len ? "selection-button-active" : ""}
                    >
                      {len[0].toUpperCase() + len.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="solo-setup-group">
                <p className="lobby-settings-sublabel">Extras</p>
                <div className="lobby-toggles">
                  {[
                    { key: "includeNumbers", label: "Numbers" },
                    { key: "includeSymbols", label: "Symbols" },
                    { key: "allowCaps", label: "Capitals" }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      className={`lobby-toggle-btn${raceSettings[key] ? " lobby-toggle-active" : ""}`}
                      onClick={() => setSetting(key, !raceSettings[key])}
                    >
                      <span className="lobby-toggle-dot" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="flash-start-button lobby-launch-btn"
                onClick={startRace}
                disabled={!canStartRace}
              >
                ⚡ Flash Launch
              </button>

              {!canStartRace && (
                <p className="lobby-waiting-hint">
                  {roomStatus === "finished"
                    ? `Replay ready: ${readyCount}/5 — need at least 2`
                    : "Need at least 2 players to start"}
                </p>
              )}
            </div>
          )}

          {/* ── Non-host waiting message ── */}
          {!isHost && (
            <div className="lobby-settings-col lobby-guest-col">
              <p className="solo-setup-label">Race Settings</p>
              <div className="lobby-settings-preview">
                <div className="lobby-preview-row">
                  <span className="lobby-preview-key">Difficulty</span>
                  <span className="lobby-preview-val">
                    {raceSettings.difficulty[0].toUpperCase() + raceSettings.difficulty.slice(1)}
                  </span>
                </div>
                <div className="lobby-preview-row">
                  <span className="lobby-preview-key">Duration</span>
                  <span className="lobby-preview-val">{raceSettings.timeLimit}s</span>
                </div>
                <div className="lobby-preview-row">
                  <span className="lobby-preview-key">Word Count</span>
                  <span className="lobby-preview-val">
                    {raceSettings.wordLength[0].toUpperCase() + raceSettings.wordLength.slice(1)}
                  </span>
                </div>
                <div className="lobby-preview-row">
                  <span className="lobby-preview-key">Numbers</span>
                  <span className={`lobby-preview-val ${raceSettings.includeNumbers ? "lobby-preview-on" : "lobby-preview-off"}`}>
                    {raceSettings.includeNumbers ? "On" : "Off"}
                  </span>
                </div>
                <div className="lobby-preview-row">
                  <span className="lobby-preview-key">Symbols</span>
                  <span className={`lobby-preview-val ${raceSettings.includeSymbols ? "lobby-preview-on" : "lobby-preview-off"}`}>
                    {raceSettings.includeSymbols ? "On" : "Off"}
                  </span>
                </div>
                <div className="lobby-preview-row">
                  <span className="lobby-preview-key">Capitals</span>
                  <span className={`lobby-preview-val ${raceSettings.allowCaps ? "lobby-preview-on" : "lobby-preview-off"}`}>
                    {raceSettings.allowCaps ? "On" : "Off"}
                  </span>
                </div>
              </div>
              <div className="lobby-waiting-pulse">
                <span className="lobby-pulse-dot" />
                Waiting for host to start…
                {roomStatus === "finished" && (
                  <span className="lobby-replay-info"> · Replay ready: {readyCount}/5</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <p className="error-text lobby-error">{error}</p>}
    </main>
  );
}

export default Lobby;
