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
  if (matchmakingQueue.length >= 2) {
    const p1 = matchmakingQueue.shift();
    const p2 = matchmakingQueue.shift();

    // p1 becomes the "host" in the room state, but it doesn't matter for matchmaking
    const { roomCode, room } = createRoom(p1.username, p1.socket.id);
    joinRoom(roomCode, p2.username, p2.socket.id);

    // Both join the room
    p1.socket.join(roomCode);
    p2.socket.join(roomCode);

    // Prepare race
    const startResult = startRace(roomCode, {
      difficulty: "medium",
      timeLimit: 60,
      includeNumbers: true,
      includeSymbols: true,
      allowCaps: true,
      wordLength: "medium"
    });

    if (startResult.error) return;

    // We emit "match_found" instead of "race_starting". 
    // The clients will show "Opponent: [name]" for 2 seconds, then transition to /race where the 3..2..1..GO happens.
    // Total countdown on client: 2s (Match Found) + 4s (Race countdown) = 6s.
    
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
        Number(startResult.room.settings.timeLimit) * 1000
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
