// Preloaded only by integration tests. Never connects to Discord or Twitch.
import { appendFile, readFile } from 'node:fs/promises';
import { Client, Events } from 'discord.js';

const control = async () => JSON.parse(await readFile(process.env.TEST_CONTROL_FILE, 'utf8'));

Client.prototype.login = async function () {
  this.channels.fetch = async () => ({
    isTextBased: () => true,
    send: async (message) => {
      if ((await control()).discordFailure) throw new Error('Discord unavailable');
      await appendFile(process.env.TEST_MESSAGES_FILE, `${JSON.stringify(message)}\n`);
    }
  });
  if (!(await control()).holdReady) {
    setImmediate(() => this.emit(Events.ClientReady, { user: { tag: 'test-bot' } }));
  }
  // Keep the process alive when testing a pending Discord connection.
  setInterval(() => {}, 60_000);
  return 'test-token';
};

globalThis.fetch = async (url) => {
  const state = await control();
  if (url === 'https://id.twitch.tv/oauth2/token') {
    return Response.json({ access_token: 'test-token', expires_in: 3600 });
  }
  if (String(url).startsWith('https://api.twitch.tv/helix/streams?')) {
    if (state.twitchFailure) return new Response('Twitch unavailable', { status: 503 });
    return Response.json({ data: state.streams || [] });
  }
  throw new Error(`Unexpected test request: ${url}`);
};
