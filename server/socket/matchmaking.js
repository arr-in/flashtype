const { createRoom, joinRoom, startRace, setRaceStarted, setRoomTimeout, getRoom } = require("./rooms");

const matchmakingQueue = [];

function joinQueue(socket, username, io, emitRaceOver) {
  // Prevent duplicate queue entries
  if (!matchmakingQueue.find(p => p.socket.id === socket.id)) {
    matchmakingQueue.push({ socket, username });
  }
  processQueue(io, emitRaceOver);
}

function leaveQueue(socketId) {
  const index = matchmakingQueue.findIndex(p => p.socket.id === socketId);
  if (index !== -1) {
    matchmakingQueue.splice(index, 1);
  }
}

function processQueue(io, emitRaceOver) {
  // Purge disconnected sockets from queue
  for (let i = matchmakingQueue.length - 1; i >= 0; i--) {
    if (!matchmakingQueue[i].socket || !matchmakingQueue[i].socket.connected) {
      matchmakingQueue.splice(i, 1);
    }
  }

  while (matchmakingQueue.length >= 2) {
    const p1 = matchmakingQueue.shift();
    const p2 = matchmakingQueue.shift();

    if (!p1.socket || !p1.socket.connected) {
      if (p2.socket && p2.socket.connected) matchmakingQueue.unshift(p2);
      continue;
    }
    if (!p2.socket || !p2.socket.connected) {
      if (p1.socket && p1.socket.connected) matchmakingQueue.unshift(p1);
      continue;
    }

    // p1 becomes the "host" in the room state, but it doesn't matter for matchmaking
    const { roomCode, room } = createRoom(p1.username, p1.socket.id);
    room.isMatchmaking = true; // Mark as matchmaking room
    joinRoom(roomCode, p2.username, p2.socket.id);

    // Both join the room
    p1.socket.join(roomCode);
    p2.socket.join(roomCode);

    // Prepare race with 30s default duration
    const startResult = startRace(roomCode, {
      difficulty: "medium",
      timeLimit: 30,
      includeNumbers: true,
      includeSymbols: true,
      allowCaps: true,
      wordLength: "medium"
    });

    if (startResult.error) return;

    const playersMap = startResult.room.players.map(p => ({
      username: p.username,
      progress: 0,
      charsTyped: 0,
      wpm: 0,
      finished: false,
      disqualified: false
    }));

    const basePayload = {
      roomCode,
      text: startResult.room.text,
      settings: startResult.room.settings,
      players: playersMap
    };

    p1.socket.emit("match_found", { ...basePayload, opponent: p2.username });
    p2.socket.emit("match_found", { ...basePayload, opponent: p1.username });

    // Schedule race start
    setTimeout(() => {
      const currentRoom = getRoom(roomCode);
      if (!currentRoom) return;
      setRaceStarted(roomCode);
      
      io.to(roomCode).emit("position_update", {
        players: currentRoom.players.map(p => ({
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
        Number(startResult.room.settings?.timeLimit || 30) * 1000
      );
      setRoomTimeout(roomCode, timeout);
    }, 6000); // 2s match found UI + 4s countdown
  }
}

module.exports = {
  joinQueue,
  leaveQueue,
  matchmakingQueue
};
