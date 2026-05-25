import 'dotenv/config';

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function numberEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return parsed;
}

export const config = {
  discordToken: requireEnv('DISCORD_TOKEN'),
  discordClientId: requireEnv('DISCORD_CLIENT_ID'),
  discordGuildId: process.env.DISCORD_GUILD_ID?.trim() || null,
  twitchClientId: requireEnv('TWITCH_CLIENT_ID'),
  twitchClientSecret: requireEnv('TWITCH_CLIENT_SECRET'),
  pollIntervalMs: numberEnv('POLL_INTERVAL_SECONDS', 60) * 1000,
  dataFile: process.env.DATA_FILE?.trim() || './data/bot-data.json'
};
