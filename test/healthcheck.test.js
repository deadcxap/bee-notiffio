import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('../src/healthcheck.js', import.meta.url));

export async function checkHealth(cwd, overrides = {}) {
  try {
    await exec(process.execPath, [script], {
      cwd,
      env: {
        ...process.env,
        DATA_FILE: '',
        POLL_INTERVAL_SECONDS: '60',
        HEALTHCHECK_MAX_POLL_LAG_SECONDS: '',
        ...overrides
      }
    });
    return { code: 0, stderr: '' };
  } catch (error) {
    return { code: error.code, stderr: error.stderr };
  }
}

test('healthcheck CLI handles runtime status and invalid configuration', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'notiffio-health-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'data'));
  const file = join(dir, 'data/bot-data.json');
  const ago = (seconds) => new Date(Date.now() - seconds * 1000).toISOString();
  const cases = [
    ['healthy', { lastPollSucceededAt: ago(5) }, {}, 0],
    ['older failure', { lastPollSucceededAt: ago(5), lastPollFailedAt: ago(10) }, {}, 0],
    ['no runtime', undefined, {}, 1],
    ['invalid date', { lastPollSucceededAt: 'invalid' }, {}, 1],
    ['stale poll', { lastPollSucceededAt: ago(300) }, {}, 1],
    ['latest poll failed', { lastPollSucceededAt: ago(10), lastPollFailedAt: ago(5), lastPollError: 'Twitch unavailable' }, {}, 1],
    ['failure in same millisecond', { lastPollSucceededAt: ago(5), lastPollFailedAt: ago(5) }, {}, 1],
    ['custom lag', { lastPollSucceededAt: ago(300) }, { HEALTHCHECK_MAX_POLL_LAG_SECONDS: '600' }, 0],
    ['long poll interval', { lastPollSucceededAt: ago(600) }, { POLL_INTERVAL_SECONDS: '300' }, 0],
    ['invalid lag', { lastPollSucceededAt: ago(5) }, { HEALTHCHECK_MAX_POLL_LAG_SECONDS: 'NaN' }, 1],
    ['negative lag', { lastPollSucceededAt: ago(5) }, { HEALTHCHECK_MAX_POLL_LAG_SECONDS: '-1' }, 1],
    ['invalid interval', { lastPollSucceededAt: ago(5) }, { POLL_INTERVAL_SECONDS: 'Infinity' }, 1],
    ['zero interval', { lastPollSucceededAt: ago(5) }, { POLL_INTERVAL_SECONDS: '0' }, 1],
    ['waiting for scheduled initial poll', { firstPollDueAt: ago(-300) }, {}, 0],
    ['initial poll overdue', { firstPollDueAt: ago(5) }, {}, 1],
    ['initial poll started but not completed', { firstPollDueAt: ago(-300), lastPollStartedAt: ago(5) }, {}, 1],
    ['initial poll failed', { firstPollDueAt: ago(-300), lastPollFailedAt: ago(5) }, {}, 1]
  ];
  for (const [name, runtime, env, code] of cases) {
    await t.test(name, async () => {
      await writeFile(file, JSON.stringify({ guilds: {}, runtime }));
      const result = await checkHealth(dir, env);
      assert.equal(result.code, code, result.stderr);
    });
  }
  await t.test('missing data file', async () => {
    await rm(file);
    assert.equal((await checkHealth(dir)).code, 1);
  });
  await t.test('malformed JSON', async () => {
    await writeFile(file, '{');
    assert.equal((await checkHealth(dir)).code, 1);
  });
  await t.test('custom DATA_FILE from .env without bot credentials', async () => {
    await writeFile(join(dir, '.env'), 'DATA_FILE=./custom.json\n');
    await writeFile(join(dir, 'custom.json'), JSON.stringify({ runtime: { lastPollSucceededAt: ago(5) } }));
    const env = { ...process.env };
    delete env.DATA_FILE;
    for (const key of ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET']) delete env[key];
    await exec(process.execPath, [script], { cwd: dir, env });
  });
});
