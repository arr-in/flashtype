const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const {
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
} = require("./roomManager");

const PORT = 3001;
const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

function broadcastPlayerList(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;
  io.to(roomCode).emit("player_list_update", {
    roomCode,
    host: room.host,
    players: room.players.map((p) => ({ username: p.username }))
  });
}

function emitRaceOver(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;
  setRaceFinished(roomCode);
  io.to(roomCode).emit("race_over", {
    results: buildResults(roomCode),
    roomCode,
    host: room.host
  });
}

io.on("connection", (socket) => {
  socket.on("create_room", ({ username }) => {
    const cleanName = String(username || "").trim();
    if (!cleanName) {
      socket.emit("room_error", { message: "Username is required." });
      return;
    }

    const { roomCode, room } = createRoom(cleanName, socket.id);
    socket.join(roomCode);
    socket.emit("room_joined", {
      roomCode,
      players: room.players.map((p) => ({ username: p.username })),
      isHost: true,
      host: room.host
    });
    broadcastPlayerList(roomCode);
  });

  socket.on("join_room", ({ username, roomCode }) => {
    const cleanName = String(username || "").trim();
    const cleanRoom = String(roomCode || "").trim().toUpperCase();
    if (!cleanName || !cleanRoom) {
      socket.emit("room_error", { message: "Username and room code are required." });
      return;
    }

    const result = joinRoom(cleanRoom, cleanName, socket.id);
    if (result.error) {
      socket.emit("room_error", { message: result.error });
      return;
    }

    socket.join(cleanRoom);
    socket.emit("room_joined", {
      roomCode: cleanRoom,
      players: result.room.players.map((p) => ({ username: p.username })),
      isHost: result.room.host === cleanName,
      host: result.room.host
    });
    broadcastPlayerList(cleanRoom);
  });

  socket.on("start_race", ({ roomCode, username }) => {
    const room = getRoom(roomCode);
    if (!room) return socket.emit("room_error", { message: "Room not found." });
    if (room.host !== username) return socket.emit("room_error", { message: "Only the host can start the race." });

    const startResult = startRace(roomCode);
    if (startResult.error) return socket.emit("room_error", { message: startResult.error });

    io.to(roomCode).emit("race_starting", {
      roomCode,
      text: startResult.room.text,
      countdown: [3, 2, 1, "GO!"]
    });

    setTimeout(() => {
      const currentRoom = getRoom(roomCode);
      if (!currentRoom) return;
      setRaceStarted(roomCode);
      io.to(roomCode).emit("position_update", {
        players: currentRoom.players.map((p) => ({
          username: p.username,
          progress: p.progress,
          wpm: p.wpm,
          finished: p.finished
        }))
      });
      const timeout = setTimeout(() => emitRaceOver(roomCode), 60000);
      setRoomTimeout(roomCode, timeout);
    }, 4000);
  });

  socket.on("typing_update", ({ roomCode, username, charsTyped, totalChars, wpm, accuracy }) => {
    const players = updatePlayerProgress(roomCode, username, { charsTyped, totalChars, wpm, accuracy });
    if (!players) return;
    io.to(roomCode).emit("position_update", {
      players: players.map((p) => ({
        username: p.username,
        progress: p.progress,
        wpm: p.wpm,
        finished: p.finished
      }))
    });
  });

  socket.on("player_finished", ({ roomCode, username, wpm, accuracy, timeMs }) => {
    const room = markPlayerFinished(roomCode, username, { wpm, accuracy, timeMs });
    if (!room) return;

    io.to(roomCode).emit("position_update", {
      players: room.players.map((p) => ({
        username: p.username,
        progress: p.finished ? 100 : p.progress,
        wpm: p.wpm,
        finished: p.finished
      }))
    });

    if (allPlayersFinished(roomCode)) emitRaceOver(roomCode);
  });

  socket.on("play_again", ({ roomCode, username }) => {
    const room = getRoom(roomCode);
    if (!room) return socket.emit("room_error", { message: "Room not found." });
    if (room.host !== username) return socket.emit("room_error", { message: "Only host can restart." });

    const resetRoom = resetRoomForReplay(roomCode);
    io.to(roomCode).emit("player_list_update", {
      roomCode,
      host: resetRoom.host,
      players: resetRoom.players.map((p) => ({ username: p.username }))
    });
  });

  socket.on("disconnect", () => {
    const removedInfo = removePlayerBySocket(socket.id);
    if (!removedInfo) return;
    const room = getRoom(removedInfo.roomCode);
    if (!room) return;
    broadcastPlayerList(removedInfo.roomCode);
    if (room.players.length < 2 && room.status === "racing") emitRaceOver(removedInfo.roomCode);
  });
});

server.listen(PORT, () => {
  console.log(`FlashType server running on http://localhost:${PORT}`);
});
