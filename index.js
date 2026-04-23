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
const MEMORY_LIMIT_MB = 160;

// Minimal caching to keep memory low
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

// Fixed start timestamp — set once so the timer keeps counting forever
const START_TIMESTAMP = Date.now() - (724 * 3600 + 48 * 60 + 17) * 1000;

let largeImage = IMAGE_URL;
let imageReady = false;

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

    console.log("[RPC] Presence updated successfully");
  } catch (err) {
    console.error("[RPC] Failed to set presence:", err.message);
  }
}

function checkMemory() {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`[MEM] Heap: ${used.toFixed(1)}MB`);
  if (used > MEMORY_LIMIT_MB) {
    console.log(`[MEM] Over limit — clearing caches`);
    if (client.guilds) client.guilds.cache.clear();
    if (client.channels) client.channels.cache.clear();
    if (client.users) client.users.cache.clear();
    if (client.emojis) client.emojis.cache.clear();
    if (global.gc) {
      global.gc();
      console.log("[MEM] GC triggered");
    }
  }
}

client.on("ready", async () => {
  console.log(`[BOT] Logged in as ${client.user.tag}`);
  await setRPC();

  // Re-apply presence every 5 minutes to keep it alive
  setInterval(async () => {
    await setRPC();
  }, 5 * 60 * 1000);

  // Check memory every 2 minutes
  setInterval(() => {
    checkMemory();
  }, 2 * 60 * 1000);
});

// Reconnect automatically on disconnect
client.on("shardDisconnect", (event, id) => {
  console.log(`[NET] Disconnected (shard ${id}) — reconnecting in 5s...`);
  setTimeout(() => {
    client.login(TOKEN).catch(console.error);
  }, 5000);
});

// Restore presence if something clears it externally
client.on("presenceUpdate", (oldPresence, newPresence) => {
  if (
    newPresence?.userId === client.user?.id &&
    (!newPresence.activities || newPresence.activities.length === 0)
  ) {
    console.log("[RPC] Presence cleared externally — restoring...");
    setRPC();
  }
});

// Never crash on unhandled errors
process.on("uncaughtException", (err) => {
  console.error("[ERR] Uncaught exception:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("[ERR] Unhandled rejection:", reason?.message || reason);
});

client.on("error", (err) => {
  console.error("[ERR] Client error:", err.message);
});

console.log("[BOT] Starting...");
client.login(TOKEN).catch((err) => {
  console.error("[BOT] Login failed:", err.message);
  setInterval(() => {
    console.log("[BOT] Retrying login...");
    client.login(TOKEN).catch(console.error);
  }, 30000);
});
