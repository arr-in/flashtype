require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { clerkMiddleware, requireAuth } = require("@clerk/express");
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

// ── Clerk middleware — attaches req.auth to every request ─────────────────────
// clerkMiddleware() is permissive: it doesn't block unauthenticated requests,
// it just enriches req. Use requireAuth() on specific routes to enforce auth.
app.use(clerkMiddleware());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// ── Leaderboard REST API ──────────────────────────────────────────────────────

// POST solo score — requires auth (Clerk JWT)
app.post("/api/leaderboard/solo", requireAuth(), async (req, res) => {
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

// POST multi score — requires auth (Clerk JWT)
app.post("/api/leaderboard/multi", requireAuth(), async (req, res) => {
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

server.listen(PORT, () => {
  console.log(`FlashType server running on port ${PORT}`);
  console.log(`Allowed client origins: ${allowedOrigins.join(", ")}`);
  console.log(`Clerk auth: ${process.env.CLERK_SECRET_KEY ? "✓ configured" : "✗ CLERK_SECRET_KEY not set"}`);
  console.log(`Supabase: ${process.env.SUPABASE_URL ? "✓ configured" : "✗ SUPABASE_URL not set"}`);
});
