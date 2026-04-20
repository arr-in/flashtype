const { getRandomRaceText } = require("./textBank");

const rooms = {};

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getUniqueRoomCode() {
  let code = generateRoomCode();
  while (rooms[code]) code = generateRoomCode();
  return code;
}

function createRoom(hostUsername, hostSocketId) {
  const roomCode = getUniqueRoomCode();
  rooms[roomCode] = {
    host: hostUsername,
    players: [
      {
        username: hostUsername,
        socketId: hostSocketId,
        progress: 0,
        charsTyped: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
        finishTime: null,
        placement: null
      }
    ],
    status: "waiting",
    text: "",
    settings: {
      difficulty: "hard",
      includeNumbers: true,
      includeSymbols: true,
      allowCaps: true,
      wordLength: "medium"
    },
    startTime: null,
    timeoutHandle: null
  };
  return { roomCode, room: rooms[roomCode] };
}

function joinRoom(roomCode, username, socketId) {
  const room = rooms[roomCode];
  if (!room) return { error: "Room not found." };
  if (room.players.length >= 5) return { error: "Room Full." };
  if (room.players.some((p) => p.username === username)) return { error: "Username already taken in this room." };

  room.players.push({
    username,
    socketId,
    progress: 0,
    charsTyped: 0,
    wpm: 0,
    accuracy: 100,
    finished: false,
    finishTime: null,
    placement: null
  });
  return { room };
}

function getRoom(roomCode) {
  return rooms[roomCode] || null;
}

function updatePlayerProgress(roomCode, username, payload) {
  const room = rooms[roomCode];
  if (!room) return null;
  const player = room.players.find((p) => p.username === username);
  if (!player) return null;

  player.charsTyped = payload.charsTyped;
  player.progress = payload.totalChars > 0 ? Math.min(100, (payload.charsTyped / payload.totalChars) * 100) : 0;
  player.wpm = payload.wpm;
  player.accuracy = payload.accuracy;
  return room.players;
}

function markPlayerFinished(roomCode, username, stats) {
  const room = rooms[roomCode];
  if (!room) return null;
  const player = room.players.find((p) => p.username === username);
  if (!player || player.finished) return room;

  player.finished = true;
  player.finishTime = stats.timeMs;
  player.wpm = stats.wpm;
  player.accuracy = stats.accuracy;
  const alreadyPlaced = room.players.filter((p) => p.finished && p.placement !== null).length;
  player.placement = alreadyPlaced + 1;
  return room;
}

function allPlayersFinished(roomCode) {
  const room = rooms[roomCode];
  if (!room) return false;
  return room.players.every((p) => p.finished);
}

function buildResults(roomCode) {
  const room = rooms[roomCode];
  if (!room) return [];
  const raceDurationMs = 60000;

  function calculateScore(player) {
    const progressScore = (player.progress || 0) * 12;
    const speedScore = (player.wpm || 0) * 10;
    const accuracyScore = (player.accuracy || 0) * 8;
    const completionBonus = player.finished ? 2000 : 0;
    const timeValue = player.finished ? player.finishTime || raceDurationMs : raceDurationMs;
    const timePenalty = timeValue / 120;
    return Math.max(0, Math.round(progressScore + speedScore + accuracyScore + completionBonus - timePenalty));
  }

  return [...room.players]
    .map((player) => ({ ...player, score: calculateScore(player) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.finished && b.finished) return (a.finishTime || raceDurationMs) - (b.finishTime || raceDurationMs);
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      return b.progress - a.progress;
    })
    .map((p, idx) => ({
      username: p.username,
      placement: idx + 1,
      wpm: Math.round(p.wpm || 0),
      accuracy: Math.round(p.accuracy || 0),
      timeMs: p.finishTime,
      score: p.score
    }));
}

function assignHostIfNeeded(room) {
  if (!room || room.players.length === 0) return;
  if (!room.players.some((p) => p.username === room.host)) {
    room.host = room.players[0].username;
  }
}

function removePlayerBySocket(socketId) {
  let removedInfo = null;
  Object.entries(rooms).forEach(([roomCode, room]) => {
    const idx = room.players.findIndex((p) => p.socketId === socketId);
    if (idx !== -1) {
      const [removed] = room.players.splice(idx, 1);
      assignHostIfNeeded(room);
      if (room.players.length === 0) {
        if (room.timeoutHandle) clearTimeout(room.timeoutHandle);
        delete rooms[roomCode];
      }
      removedInfo = { roomCode, removedUsername: removed.username };
    }
  });
  return removedInfo;
}

function startRace(roomCode, settings = {}) {
  const room = rooms[roomCode];
  if (!room) return { error: "Room not found." };
  if (room.players.length < 2) return { error: "At least 2 players are required." };

  room.settings = {
    difficulty: settings.difficulty || room.settings?.difficulty || "hard",
    includeNumbers: settings.includeNumbers ?? room.settings?.includeNumbers ?? true,
    includeSymbols: settings.includeSymbols ?? room.settings?.includeSymbols ?? true,
    allowCaps: settings.allowCaps ?? room.settings?.allowCaps ?? true,
    wordLength: settings.wordLength || room.settings?.wordLength || "medium"
  };
  room.status = "countdown";
  room.text = getRandomRaceText(room.settings);
  room.startTime = null;
  room.players = room.players.map((p) => ({
    ...p,
    progress: 0,
    charsTyped: 0,
    wpm: 0,
    accuracy: 100,
    finished: false,
    finishTime: null,
    placement: null
  }));
  return { room };
}

function setRaceStarted(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  room.status = "racing";
  room.startTime = Date.now();
}

function setRaceFinished(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  room.status = "finished";
  if (room.timeoutHandle) {
    clearTimeout(room.timeoutHandle);
    room.timeoutHandle = null;
  }
}

function setRoomTimeout(roomCode, handle) {
  const room = rooms[roomCode];
  if (!room) return;
  room.timeoutHandle = handle;
}

function resetRoomForReplay(roomCode) {
  const room = rooms[roomCode];
  if (!room) return null;
  room.status = "waiting";
  room.text = "";
  room.startTime = null;
  room.players = room.players.map((p) => ({
    ...p,
    progress: 0,
    charsTyped: 0,
    wpm: 0,
    accuracy: 100,
    finished: false,
    finishTime: null,
    placement: null
  }));
  return room;
}

module.exports = {
  rooms,
  createRoom,
  joinRoom,
  getRoom,
  updatePlayerProgress,
  markPlayerFinished,
  allPlayersFinished,
  buildResults,
  removePlayerBySocket,
  startRace,
  setRaceStarted,
  setRaceFinished,
  setRoomTimeout,
  resetRoomForReplay
};
