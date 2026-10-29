import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { getDataFile, getPollIntervalSeconds, numberEnv } from './runtime-config.js';

function parseDate(value) {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

async function main() {
  const pollIntervalSeconds = getPollIntervalSeconds();
  const maxLagSeconds = numberEnv('HEALTHCHECK_MAX_POLL_LAG_SECONDS', Math.max(180, pollIntervalSeconds * 3));
  const raw = await readFile(getDataFile(), 'utf8');
  const data = JSON.parse(raw);
  const runtime = data?.runtime || {};

  const lastSuccess = parseDate(runtime.lastPollSucceededAt);
  const lastFailure = parseDate(runtime.lastPollFailedAt);
  const now = Date.now();

  if (lastSuccess === null) {
    // SKIP_INITIAL_POLL may delay the first cycle beyond Docker's start period.
    const firstPollDue = parseDate(runtime.firstPollDueAt);
    if (!runtime.lastPollStartedAt && lastFailure === null && firstPollDue !== null && now < firstPollDue) return;
    throw new Error('Бот еще не завершил ни одного успешного цикла polling (lastPollSucceededAt пустой).');
  }

  const lagSeconds = (now - lastSuccess) / 1000;
  if (lagSeconds > maxLagSeconds) {
    throw new Error(`Слишком давно не было успешного polling: ${Math.round(lagSeconds)}s > ${maxLagSeconds}s.`);
  }

  if (lastFailure !== null && lastFailure >= lastSuccess) {
    throw new Error(`Последний polling завершился ошибкой: ${runtime.lastPollError || 'unknown error'}`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
