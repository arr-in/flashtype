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
  return [...room.players]
    .sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.progress - a.progress;
    })
    .map((p, idx) => ({
      username: p.username,
      placement: idx + 1,
      wpm: Math.round(p.wpm || 0),
      accuracy: Math.round(p.accuracy || 0),
      timeMs: p.finishTime
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

function startRace(roomCode) {
  const room = rooms[roomCode];
  if (!room) return { error: "Room not found." };
  if (room.players.length < 2) return { error: "At least 2 players are required." };

  room.status = "countdown";
  room.text = getRandomRaceText();
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
