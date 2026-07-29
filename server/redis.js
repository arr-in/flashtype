// redis.js — Redis client + Socket.io horizontal-scaling adapter
// If REDIS_URL is not set or connection fails, the server continues without Redis.
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

let redisClient = null;        // shared read/write client
let redisPub = null;           // pub client for socket adapter
let redisSub = null;           // sub client for socket adapter
let redisAvailable = false;

const REDIS_URL = process.env.REDIS_URL;

/**
 * Connect to Redis.
 * Returns a { pub, sub } pair ready for the Socket.io adapter, or null on failure.
 */
async function connectRedis() {
  if (!REDIS_URL) {
    console.warn(
      "[redis] REDIS_URL not set — Redis caching & horizontal scaling disabled."
    );
    return null;
  }

  try {
    // Three separate clients: one general-purpose + two for pub/sub
    redisClient = createClient({ url: REDIS_URL });
    redisPub    = createClient({ url: REDIS_URL });
    redisSub    = createClient({ url: REDIS_URL });

    // Surface errors without crashing
    for (const client of [redisClient, redisPub, redisSub]) {
      client.on("error", (err) =>
        console.warn("[redis] Client error:", err.message)
      );
    }

    await Promise.all([
      redisClient.connect(),
      redisPub.connect(),
      redisSub.connect()
    ]);

    redisAvailable = true;
    console.log("[redis] ✓ Connected to", REDIS_URL);
    return { pub: redisPub, sub: redisSub };
  } catch (err) {
    console.warn("[redis] ✗ Connection failed — falling back to no-cache mode:", err.message);
    redisAvailable = false;
    return null;
  }
}

/**
 * Attach the Socket.io redis-adapter for cross-node event broadcasting.
 * Safe to call even if Redis is unavailable (no-op).
 */
async function setupSocketRedisAdapter(io) {
  const clients = await connectRedis();
  if (!clients) {
    console.warn("[redis] Socket.io redis-adapter NOT attached — single-node mode.");
    return;
  }
  io.adapter(createAdapter(clients.pub, clients.sub));
  console.log("[redis] ✓ Socket.io redis-adapter attached — horizontal scaling enabled.");
}

/**
 * Get the shared Redis client for leaderboard caching.
 * Returns null if Redis is not available.
 */
function getRedisClient() {
  return redisAvailable ? redisClient : null;
}

module.exports = { setupSocketRedisAdapter, getRedisClient };
