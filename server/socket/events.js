const {
  createRoom,
  joinRoom,
  getRoom,
  updatePlayerProgress,
  markPlayerFinished,
  markPlayerDisqualified,
  buildResults,
  removePlayerBySocket,
  startRace,
  setRaceStarted,
  setRaceFinished,
  setRoomTimeout,
  resetRoomForReplay,
  setPlayerReadyForReplay,
  updateRoomSettings,
  shouldRaceEnd
} = require("./rooms");

const { joinQueue, leaveQueue } = require("./matchmaking");

function registerSocketEvents(io) {
  function broadcastPlayerList(roomCode) {
    const room = getRoom(roomCode);
    if (!room) return;
    io.to(roomCode).emit("player_list_update", {
      roomCode,
      host: room.host,
      players: room.players.map((p) => ({ username: p.username })),
      settings: room.settings,
      status: room.status,
      readyPlayers: room.readyPlayers || []
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
    // --- Matchmaking Events ---
    socket.on("join_matchmaking", ({ username }) => {
      const cleanName = String(username || "").trim();
      if (!cleanName) return;
      joinQueue(socket, cleanName, io, emitRaceOver);
    });

    socket.on("leave_matchmaking", () => {
      leaveQueue(socket.id);
    });

    // --- Room Events ---
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
        host: room.host,
        settings: room.settings,
        status: room.status,
        readyPlayers: room.readyPlayers || []
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
        host: result.room.host,
        settings: result.room.settings,
        status: result.room.status,
        readyPlayers: result.room.readyPlayers || []
      });
      broadcastPlayerList(cleanRoom);
    });

    socket.on("start_race", ({ roomCode, username, settings }) => {
      const room = getRoom(roomCode);
      if (!room) return socket.emit("room_error", { message: "Room not found." });
      if (room.host !== username) return socket.emit("room_error", { message: "Only the host can start the race." });
      if (room.status === "finished") {
        const readyCount = room.readyPlayers?.length || 0;
        if (readyCount < 2) {
          return socket.emit("room_error", { message: "At least 2 players must click Play Again first." });
        }
      }

      const startResult = startRace(roomCode, settings || {});
      if (startResult.error) return socket.emit("room_error", { message: startResult.error });

      io.to(roomCode).emit("race_starting", {
        roomCode,
        text: startResult.room.text,
        countdown: [3, 2, 1, "GO!"],
        settings: startResult.room.settings
      });

      setTimeout(() => {
        const currentRoom = getRoom(roomCode);
        if (!currentRoom) return;
        setRaceStarted(roomCode);
        io.to(roomCode).emit("position_update", {
          players: currentRoom.players.map((p) => ({
            username: p.username,
            progress: p.progress,
            charsTyped: p.charsTyped,
            wpm: p.wpm,
            finished: p.finished,
            disqualified: Boolean(p.disqualified)
          }))
        });
        const timeout = setTimeout(
          () => emitRaceOver(roomCode),
          Number(startResult.room.settings?.timeLimit || 60) * 1000
        );
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
          charsTyped: p.charsTyped,
          wpm: p.wpm,
          finished: p.finished,
          disqualified: Boolean(p.disqualified)
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
          charsTyped: p.charsTyped,
          wpm: p.wpm,
          finished: p.finished,
          disqualified: Boolean(p.disqualified)
        }))
      });

      if (shouldRaceEnd(roomCode)) emitRaceOver(roomCode);
    });

    socket.on("player_disqualified", ({ roomCode, username, wpm, accuracy, timeMs }) => {
      const room = markPlayerDisqualified(roomCode, username, { wpm, accuracy, timeMs });
      if (!room) return;

      io.to(roomCode).emit("position_update", {
        players: room.players.map((p) => ({
          username: p.username,
          progress: p.finished ? p.progress : p.progress,
          charsTyped: p.charsTyped,
          wpm: p.wpm,
          finished: p.finished,
          disqualified: Boolean(p.disqualified)
        }))
      });

      if (shouldRaceEnd(roomCode)) emitRaceOver(roomCode);
    });

    socket.on("play_again", ({ roomCode, username }) => {
      const room = getRoom(roomCode);
      if (!room) return socket.emit("room_error", { message: "Room not found." });

      const updatedRoom = setPlayerReadyForReplay(roomCode, username);
      if (!updatedRoom) return;

      io.to(roomCode).emit("player_list_update", {
        roomCode,
        host: updatedRoom.host,
        players: updatedRoom.players.map((p) => ({ username: p.username })),
        settings: updatedRoom.settings,
        status: updatedRoom.status,
        readyPlayers: updatedRoom.readyPlayers || []
      });
    });

    socket.on("update_settings", ({ roomCode, username, settings }) => {
      const room = getRoom(roomCode);
      if (!room) return;
      if (room.host !== username) return;
      updateRoomSettings(roomCode, settings);
      broadcastPlayerList(roomCode);
    });

    socket.on("return_to_lobby", ({ roomCode, username }) => {
      const room = getRoom(roomCode);
      if (!room) return;
      if (room.host !== username) return;
      const resetRoom = resetRoomForReplay(roomCode);
      io.to(roomCode).emit("return_to_lobby", {
        roomCode,
        host: resetRoom.host,
        players: resetRoom.players.map((p) => ({ username: p.username })),
        settings: resetRoom.settings,
        status: resetRoom.status,
        readyPlayers: []
      });
    });

    socket.on("end_race", ({ roomCode, username }) => {
      const room = getRoom(roomCode);
      if (!room) return socket.emit("room_error", { message: "Room not found." });
      if (room.host !== username) return socket.emit("room_error", { message: "Only host can end the race." });
      emitRaceOver(roomCode);
    });

    socket.on("reset_room_after_results", ({ roomCode, username }) => {
      const room = getRoom(roomCode);
      if (!room) return socket.emit("room_error", { message: "Room not found." });
      if (room.host !== username) return socket.emit("room_error", { message: "Only host can reset room." });

      const resetRoom = resetRoomForReplay(roomCode);
      io.to(roomCode).emit("player_list_update", {
        roomCode,
        host: resetRoom.host,
        players: resetRoom.players.map((p) => ({ username: p.username })),
        settings: resetRoom.settings,
        status: resetRoom.status,
        readyPlayers: resetRoom.readyPlayers || []
      });
    });

    socket.on("leave_room", () => {
      const removedInfo = removePlayerBySocket(socket.id);
      if (!removedInfo) return;
      socket.leave(removedInfo.roomCode);
      const room = getRoom(removedInfo.roomCode);
      if (!room) return;
      broadcastPlayerList(removedInfo.roomCode);
      if (room.players.length < 2 && room.status === "racing") emitRaceOver(removedInfo.roomCode);
    });

    socket.on("disconnect", () => {
      leaveQueue(socket.id);
      const removedInfo = removePlayerBySocket(socket.id);
      if (!removedInfo) return;
      const room = getRoom(removedInfo.roomCode);
      if (!room) return;
      broadcastPlayerList(removedInfo.roomCode);
      
      if (room.players.length < 2 && room.status === "racing") {
        // immediately declare opponent winner (end race gracefully)
        emitRaceOver(removedInfo.roomCode);
      }
      
      // Also notify room if it was matchmaking (opponent disconnected during countdown etc)
      if (room.players.length < 2) {
         io.to(removedInfo.roomCode).emit("opponent_disconnected");
      }
    });
  });
}

module.exports = { registerSocketEvents };
