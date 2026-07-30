// test-redis.js — quick integration test for Redis leaderboard caching
require("dotenv").config();
const { createClient } = require("redis");

const REDIS_URL = process.env.REDIS_URL;

async function run() {
  if (!REDIS_URL) {
    console.error("❌ REDIS_URL is not set in .env");
    process.exit(1);
  }

  const client = createClient({ url: REDIS_URL });
  client.on("error", (err) => console.error("Redis error:", err.message));

  console.log("Connecting to Redis...");
  await client.connect();
  console.log("✓ Connected\n");

  // ── 1. PING ───────────────────────────────────────────────────────────────
  const pong = await client.ping();
  console.log(`[1] PING → ${pong}`);

  // ── 2. SET / GET ──────────────────────────────────────────────────────────
  await client.set("flashtype:test", "hello", { EX: 10 });
  const val = await client.get("flashtype:test");
  console.log(`[2] SET/GET → ${val}`);

  // ── 3. Sorted Set — simulate leaderboard write (zAdd) ─────────────────────
  const testKey = "test:lb:solo";
  await client.del(testKey); // clean slate

  const entries = [
    { score: 120, value: JSON.stringify({ username: "alice",   wpm: 120, accuracy: 98 }) },
    { score:  95, value: JSON.stringify({ username: "bob",     wpm:  95, accuracy: 91 }) },
    { score: 140, value: JSON.stringify({ username: "charlie", wpm: 140, accuracy: 99 }) },
    { score:  80, value: JSON.stringify({ username: "dave",    wpm:  80, accuracy: 85 }) },
  ];

  await client.zAdd(testKey, entries);
  console.log(`\n[3] Wrote ${entries.length} entries to sorted set "${testKey}"`);

  // ── 4. Read top-3 in descending order (zRange REV) ───────────────────────
  const top3 = await client.zRange(testKey, 0, 2, { REV: true });
  console.log("\n[4] Top-3 leaderboard (highest WPM first):");
  top3.forEach((m, i) => {
    const e = JSON.parse(m);
    console.log(`     ${i + 1}. ${e.username.padEnd(10)} ${e.wpm} WPM  ${e.accuracy}% ACC`);
  });

  // ── 5. Rank of a specific player ─────────────────────────────────────────
  const rank = await client.zRevRank(testKey, entries[0].value); // alice
  console.log(`\n[5] Alice's rank (0-indexed from top) → ${rank}`);

  // ── 6. TTL / expiry ──────────────────────────────────────────────────────
  await client.expire(testKey, 60);
  const ttl = await client.ttl(testKey);
  console.log(`[6] TTL on "${testKey}" → ${ttl}s`);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  await client.del("flashtype:test");
  await client.del(testKey);
  console.log("\n✓ Cleanup done — test keys deleted");

  await client.disconnect();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ All Redis tests passed!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

run().catch((err) => {
  console.error("❌ Test failed:", err.message);
  process.exit(1);
});
