require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { clerkMiddleware, requireAuth } = require("@clerk/express");
const { registerSocketEvents } = require("./socket/events");
const { addSoloEntry, addMultiEntry, getSoloTop, getMultiTop } = require("./leaderboard");
const { setupSocketRedisAdapter } = require("./redis");

const PORT = process.env.PORT || 3001;
const rawClientUrls = process.env.CLIENT_URL || "http://localhost:5173";
const clerkEnabled = Boolean(process.env.CLERK_SECRET_KEY);

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

const allowedOrigins = rawClientUrls
  .split(",")
  .map((url) => normalizeOrigin(url))
  .filter(Boolean);

["http://localhost:5173", "http://localhost:5174"].forEach((origin) => {
  if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin);
});

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

// ── Clerk middleware — optional for local dev without API keys ────────────────
if (clerkEnabled) {
  app.use(clerkMiddleware());
} else {
  console.warn("[server] CLERK_SECRET_KEY not set — auth middleware disabled (local dev mode).");
}

function requireAuthOrDev() {
  if (clerkEnabled) return requireAuth();
  return (_req, _res, next) => next();
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// ── Leaderboard REST API ──────────────────────────────────────────────────────

// POST solo score — requires auth when Clerk is configured
app.post("/api/leaderboard/solo", requireAuthOrDev(), async (req, res) => {
  const { username, wpm, accuracy, difficulty } = req.body || {};
  if (!username || wpm == null) {
    return res.status(400).json({ error: "username and wpm required" });
  }
  const clerkUserId = req.auth?.userId;
  await addSoloEntry({ username, wpm, accuracy, difficulty, clerkUserId });
  const updated = await getSoloTop(20);
  io.emit("leaderboard_update", { tab: "solo", leaderboard: updated });
  res.json({ leaderboard: updated });
});

// POST multi score — requires auth when Clerk is configured
app.post("/api/leaderboard/multi", requireAuthOrDev(), async (req, res) => {
  const { username, wpm, accuracy } = req.body || {};
  if (!username || wpm == null) {
    return res.status(400).json({ error: "username and wpm required" });
  }
  const clerkUserId = req.auth?.userId;
  await addMultiEntry({ username, wpm, accuracy, clerkUserId });
  const updated = await getMultiTop(20);
  io.emit("leaderboard_update", { tab: "multi", leaderboard: updated });
  res.json({ leaderboard: updated });
});

// GET solo leaderboard — public
app.get("/api/leaderboard/solo", async (req, res) => {
  const difficulty = req.query.difficulty || "all";
  res.json({ leaderboard: await getSoloTop(20, difficulty) });
});

// GET multi leaderboard — public
app.get("/api/leaderboard/multi", async (_req, res) => {
  res.json({ leaderboard: await getMultiTop(20) });
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

// Attach Redis adapter for horizontal scaling (no-op if REDIS_URL not set)
setupSocketRedisAdapter(io);

server.listen(PORT, () => {
  console.log(`FlashType server running on port ${PORT}`);
  console.log(`Allowed client origins: ${allowedOrigins.join(", ")}`);
  console.log(`Clerk auth: ${clerkEnabled ? "✓ configured" : "✗ disabled (local dev mode)"}`);
  console.log(`Supabase:   ${process.env.SUPABASE_URL       ? "✓ configured" : "✗ SUPABASE_URL not set"}`);
  console.log(`Redis:      ${process.env.REDIS_URL           ? "✓ " + process.env.REDIS_URL : "✗ REDIS_URL not set (single-node mode)"}`);
});
