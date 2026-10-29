import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { JsonStorage } from '../src/storage.js';

test('storage can save again after a transient write failure', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'notiffio-storage-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const parent = join(dir, 'data');
  await writeFile(parent, 'blocks mkdir');
  const storage = new JsonStorage(join(parent, 'bot-data.json'));
  await assert.rejects(storage.save());
  await rm(parent);
  storage.getGuild('existing-guild').template = 'Custom {streamer}';
  await Promise.all([storage.save(), storage.save()]);
  const saved = JSON.parse(await readFile(storage.filePath, 'utf8'));
  assert.equal(saved.guilds['existing-guild'].template, 'Custom {streamer}');
});
