const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { registerSocketEvents } = require("./socket/events");
const { addSoloEntry, addMultiEntry, getSoloTop, getMultiTop } = require("./leaderboard");

const PORT = process.env.PORT || 3001;
const rawClientUrls = process.env.CLIENT_URL || "http://localhost:5173";

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

const allowedOrigins = rawClientUrls
  .split(",")
  .map((url) => normalizeOrigin(url))
  .filter(Boolean);

if (!allowedOrigins.includes("http://localhost:5173")) {
  allowedOrigins.push("http://localhost:5173");
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const normalizedOrigin = normalizeOrigin(origin);
  return allowedOrigins.includes(normalizedOrigin);
}

const app = express();
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// ── Leaderboard REST API ─────────────────────────────────────────
app.post("/api/leaderboard/solo", (req, res) => {
  const { username, wpm, accuracy, difficulty } = req.body || {};
  if (!username || wpm == null) return res.status(400).json({ error: "username and wpm required" });
  addSoloEntry({ username, wpm, accuracy, difficulty });
  const updated = getSoloTop(20);
  // Broadcast to every connected client so leaderboard pages update live
  io.emit("leaderboard_update", { tab: "solo", leaderboard: updated });
  res.json({ leaderboard: updated });
});

app.post("/api/leaderboard/multi", (req, res) => {
  const { username, wpm, accuracy } = req.body || {};
  if (!username || wpm == null) return res.status(400).json({ error: "username and wpm required" });
  addMultiEntry({ username, wpm, accuracy });
  const updated = getMultiTop(20);
  io.emit("leaderboard_update", { tab: "multi", leaderboard: updated });
  res.json({ leaderboard: updated });
});

app.get("/api/leaderboard/solo", (req, res) => {
  const difficulty = req.query.difficulty || "all";
  res.json({ leaderboard: getSoloTop(20, difficulty) });
});

app.get("/api/leaderboard/multi", (_req, res) => {
  res.json({ leaderboard: getMultiTop(20) });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by Socket.io CORS"));
    },
    methods: ["GET", "POST"]
  }
});

registerSocketEvents(io);

server.listen(PORT, () => {
  console.log(`FlashType server running on port ${PORT}`);
  console.log(`Allowed client origins: ${allowedOrigins.join(", ")}`);
});
