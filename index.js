// Polyfill for Railway/older Node environments
if (typeof globalThis.ReadableStream === "undefined") {
  const { ReadableStream } = require("stream/web");
  globalThis.ReadableStream = ReadableStream;
}
if (typeof globalThis.WritableStream === "undefined") {
  const { WritableStream } = require("stream/web");
  globalThis.WritableStream = WritableStream;
}
if (typeof globalThis.TransformStream === "undefined") {
  const { TransformStream } = require("stream/web");
  globalThis.TransformStream = TransformStream;
}

const { Client, RichPresence, Options } = require("discord.js-selfbot-v13");

const TOKEN = process.env.DISCORD_TOKEN || process.env.TOKEN;
const APP_ID = "1038950275913019402";
const IMAGE_URL =
  "https://i.pinimg.com/736x/37/84/1f/37841f7e4e07101448f58b45e2125686.jpg";
const MEMORY_LIMIT_MB = 170;

// Show which platform is running the bot
const platform = process.env.RAILWAY_ENVIRONMENT
  ? `Railway (env: ${process.env.RAILWAY_ENVIRONMENT})`
  : process.env.REPL_ID
  ? "Replit"
  : "Unknown";

console.log(`[BOT] Running on: ${platform}`);

// Minimal caching to keep memory low from the start
const client = new Client({
  makeCache: Options.cacheWithLimits({
    MessageManager: 0,
    ReactionManager: 0,
    GuildEmojiManager: 0,
    PresenceManager: 0,
    VoiceStateManager: 0,
    ThreadManager: 0,
    ThreadMemberManager: 0,
    StageInstanceManager: 0,
    GuildScheduledEventManager: 0,
    GuildStickerManager: 0,
    GuildInviteManager: 0,
    GuildBanManager: 0,
  }),
  sweepers: {
    messages: { interval: 60, lifetime: 1 },
    users: {
      interval: 3600,
      filter: () => (u) => !u.bot && u.id !== client.user?.id,
    },
  },
});

// Fixed start timestamp — NEVER changes, so the timer keeps counting forever
const START_TIMESTAMP = Date.now() - (724 * 3600 + 48 * 60 + 17) * 1000;

let largeImage = IMAGE_URL;
let imageReady = false;

// ─── Memory Cleaner ───────────────────────────────────────────────────────────
// Runs every 60 seconds. Clears Discord caches when heap reaches 170MB.
// Does NOT touch RPC, timer, or reconnect logic.
function cleanMemory() {
  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
  const mem = process.memoryUsage();
  const heapUsed = mem.heapUsed / 1024 / 1024;

  if (heapUsed >= MEMORY_LIMIT_MB) {
    console.log(`[MEM] Heap at ${mb(mem.heapUsed)}MB — cleaning caches...`);
    // Clear only Discord internal caches, never touch RPC or timestamps
    try { client.guilds.cache.forEach(g => {
      g.members?.cache.clear();
      g.channels?.cache.clear();
      g.roles?.cache.clear();
    }); } catch (_) {}
    try { client.channels.cache.clear(); } catch (_) {}
    try { client.users.cache.clear(); } catch (_) {}
    try { client.emojis.cache.clear(); } catch (_) {}
    if (global.gc) global.gc();
    const after = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`[MEM] Cleaned — heap now ${after.toFixed(1)}MB`);
  }
}

setInterval(cleanMemory, 60 * 1000);

// ─── RPC ──────────────────────────────────────────────────────────────────────
async function setRPC() {
  if (!client.user) return;
  try {
    if (!imageReady) {
      const external = await RichPresence.getExternal(client, APP_ID, IMAGE_URL);
      if (external && external[0]) {
        largeImage = external[0].external_asset_path;
        imageReady = true;
      }
    }

    const presence = new RichPresence(client)
      .setApplicationId(APP_ID)
      .setType("COMPETING")
      .setName("Pure ego")
      .setDetails("𝙊𝙪𝙩 𝙤𝙛 𝙢𝙮 𝙥𝙧𝙞𝙢𝙚 𝙗𝙪𝙩 𝙨𝙩𝙞𝙡𝙡🚬")
      .setState("𝙸  𝙼    𝚆  𝙸  𝙽  𝙽  𝙸  𝙽  𝙶   🏆 ⚡")
      .setAssetsLargeImage(largeImage)
      .setStartTimestamp(START_TIMESTAMP)
      .addButton("🌕🌕🌕", "https://guns.lol/376k")
      .addButton("🌕🌕🌕", "https://guns.lol/376k");

    await client.user.setPresence({
      activities: [presence],
      status: "dnd",
    });

    console.log("[RPC] Presence active");
  } catch (err) {
    console.error("[RPC] Failed to set presence:", err.message);
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────
client.on("ready", async () => {
  console.log(`[BOT] Logged in as ${client.user.tag}`);
  await setRPC();

  // Refresh presence every 5 minutes to keep it alive
  setInterval(setRPC, 5 * 60 * 1000);
});

// Auto-reconnect on disconnect
client.on("shardDisconnect", (event, id) => {
  console.log(`[NET] Disconnected — reconnecting in 5s...`);
  setTimeout(() => client.login(TOKEN).catch(console.error), 5000);
});

// Restore RPC if something externally clears it
client.on("presenceUpdate", (_, newPresence) => {
  if (
    newPresence?.userId === client.user?.id &&
    (!newPresence.activities || newPresence.activities.length === 0)
  ) {
    console.log("[RPC] Cleared externally — restoring...");
    setRPC();
  }
});

// ─── Crash Guards ─────────────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("[ERR] Uncaught exception:", err.message);
});
process.on("unhandledRejection", (reason) => {
  console.error("[ERR] Unhandled rejection:", reason?.message || reason);
});
client.on("error", (err) => {
  console.error("[ERR] Client error:", err.message);
});

// ─── Login ────────────────────────────────────────────────────────────────────
console.log("[BOT] Starting...");
client.login(TOKEN).catch((err) => {
  console.error("[BOT] Login failed:", err.message);
  setInterval(() => {
    console.log("[BOT] Retrying login...");
    client.login(TOKEN).catch(console.error);
  }, 30000);
});
