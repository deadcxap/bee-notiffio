import assert from 'node:assert/strict';
import { fork, execFile } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const bot = fileURLToPath(new URL('../src/bot.js', import.meta.url));
const mock = fileURLToPath(new URL('./helpers/mock-services.js', import.meta.url));
const health = fileURLToPath(new URL('../src/healthcheck.js', import.meta.url));
const exec = promisify(execFile);

const stream = {
  id: 'stream-123', user_login: 'streamer', user_name: 'Streamer', game_name: 'Beat Saber',
  title: 'A stream', viewer_count: 10, started_at: '2026-10-29T12:00:00Z'
};

function legacyData() {
  return {
    guilds: {
      guild: {
        language: 'en', template: 'Custom {streamer}: {url}', notificationMode: 'both', notifyCategoryChanges: false,
        stats: { totalNotifications: 7, byStreamer: { streamer: 7 }, byCategory: { 'Beat Saber': 7 }, lastNotificationAt: '2026-10-29T12:00:00Z' },
        subscriptions: [{
          channelId: 'channel', twitchLogin: 'streamer', twitchDisplayName: 'Streamer', twitchUserId: 'twitch-user',
          category: 'Beat Saber, Synth Riders', excludeCategory: null, template: 'Personal {title}',
          notificationMode: 'text', notifyCategoryChanges: false, notificationsSent: 7,
          lastStreamId: stream.id, lastEndedAt: null, lastNotifiedAt: '2026-10-29T12:00:00Z',
          lastNotifiedCategory: 'beat saber', live: true, createdAt: '2026-01-01T00:00:00Z'
        }]
      }
    }
  };
}

async function launch(t, data, control = {}, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'notiffio-bot-'));
  const file = join(dir, 'bot-data.json');
  const controlFile = join(dir, 'control.json');
  const messagesFile = join(dir, 'messages.jsonl');
  await writeFile(file, JSON.stringify(data));
  await writeFile(controlFile, JSON.stringify(control));
  await writeFile(messagesFile, '');
  const env = {
    ...process.env, DISCORD_TOKEN: 'test-token', DISCORD_CLIENT_ID: 'test-id',
    TWITCH_CLIENT_ID: 'test-id', TWITCH_CLIENT_SECRET: 'test-secret',
    DATA_FILE: file, POLL_INTERVAL_SECONDS: '0.2', SKIP_INITIAL_POLL: '',
    HEALTHCHECK_MAX_POLL_LAG_SECONDS: '', TEST_CONTROL_FILE: controlFile, TEST_MESSAGES_FILE: messagesFile,
    ...options
  };
  const child = fork(bot, [], { cwd: dir, env, execArgv: ['--import', mock], silent: true });
  let logs = '';
  child.stdout.on('data', (chunk) => { logs += chunk; });
  child.stderr.on('data', (chunk) => { logs += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      await exited;
    }
    await rm(dir, { recursive: true, force: true });
  });
  return {
    async waitFor(predicate) {
      const deadline = Date.now() + 8000;
      do {
        const saved = JSON.parse(await readFile(file, 'utf8'));
        if (predicate(saved)) return saved;
        if (child.exitCode !== null) assert.fail(`Bot exited: ${logs}`);
        await setTimeout(25);
      } while (Date.now() < deadline);
      assert.fail(`Timed out waiting for runtime: ${logs}`);
    },
    async healthCode() {
      try {
        await exec(process.execPath, [health], { cwd: dir, env });
        return 0;
      } catch (error) { return error.code; }
    },
    async setControl(value) {
      await writeFile(`${controlFile}.tmp`, JSON.stringify(value));
      await rename(`${controlFile}.tmp`, controlFile);
    },
    async messages() { return (await readFile(messagesFile, 'utf8')).trim(); }
  };
}

test('bot without subscriptions reports success on every poll', async (t) => {
  const app = await launch(t, { guilds: {} });
  const first = await app.waitFor((data) => data.runtime?.lastPollSucceededAt);
  const next = await app.waitFor((data) => data.runtime?.lastPollSucceededAt > first.runtime.lastPollSucceededAt);
  assert.ok(next.runtime.lastPollStartedAt);
  assert.equal(await app.healthCode(), 0);
  assert.equal(await app.messages(), '');
});

test('upgrade preserves settings, stats and notification deduplication', async (t) => {
  const original = legacyData();
  const app = await launch(t, original, { streams: [stream] });
  const first = await app.waitFor((data) => data.runtime?.lastPollSucceededAt);
  assert.deepEqual(first.guilds, original.guilds);
  assert.equal(await app.messages(), '');
  assert.equal(await app.healthCode(), 0);
  await app.setControl({ streams: [{ ...stream, id: 'next-stream' }] });
  const next = await app.waitFor((data) => data.guilds.guild.stats.totalNotifications === 8);
  assert.equal(next.guilds.guild.subscriptions[0].lastStreamId, 'next-stream');
  assert.match(await app.messages(), /Personal A stream/);
  await app.waitFor((data) => data.runtime.lastPollSucceededAt > next.runtime.lastPollSucceededAt);
  assert.equal((await app.messages()).split('\n').length, 1);
});

for (const service of ['twitchFailure', 'discordFailure']) {
  test(`bot persists ${service} and recovers on next successful poll`, async (t) => {
    const original = legacyData();
    original.guilds.guild.subscriptions[0].lastStreamId = 'older-stream';
    const app = await launch(t, original, { [service]: true, streams: [stream] });
    const failed = await app.waitFor((data) => data.runtime?.lastPollFailedAt);
    assert.match(failed.runtime.lastPollError, /unavailable/);
    assert.equal(await app.healthCode(), 1);
    await app.setControl({ streams: [stream] });
    const recovered = await app.waitFor((data) => data.runtime?.lastPollSucceededAt && !data.runtime.lastPollFailedAt);
    assert.equal(recovered.runtime.lastPollError, null);
    assert.equal(recovered.guilds.guild.stats.totalNotifications, 8);
    assert.equal(await app.healthCode(), 0);
  });
}

test('restart clears old success before Discord is ready', async (t) => {
  const original = legacyData();
  original.runtime = { lastPollSucceededAt: new Date().toISOString() };
  const app = await launch(t, original, { holdReady: true });
  const saved = await app.waitFor((data) => data.runtime?.startedAt);
  assert.equal(saved.runtime.lastPollSucceededAt, null);
  assert.deepEqual(saved.guilds, original.guilds);
  assert.equal(await app.healthCode(), 1);
});

test('SKIP_INITIAL_POLL waits for first scheduled poll without false unhealthy status', async (t) => {
  const app = await launch(t, { guilds: {} }, {}, { SKIP_INITIAL_POLL: 'true', POLL_INTERVAL_SECONDS: '1' });
  const waiting = await app.waitFor((data) => data.runtime?.firstPollDueAt);
  assert.equal(waiting.runtime.lastPollSucceededAt, null);
  assert.equal(await app.healthCode(), 0);
  await app.waitFor((data) => data.runtime?.lastPollSucceededAt);
  assert.equal(await app.healthCode(), 0);
});
