import { readFile } from 'node:fs/promises';

const dataFile = process.env.DATA_FILE?.trim() || '/app/data/bot-data.json';
const pollIntervalSeconds = Number(process.env.POLL_INTERVAL_SECONDS || '60');
const maxLagSeconds = Number(process.env.HEALTHCHECK_MAX_POLL_LAG_SECONDS || String(Math.max(180, pollIntervalSeconds * 3)));

function parseDate(value) {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

async function main() {
  const raw = await readFile(dataFile, 'utf8');
  const data = JSON.parse(raw);
  const runtime = data?.runtime || {};

  const lastSuccess = parseDate(runtime.lastPollSucceededAt);
  const lastFailure = parseDate(runtime.lastPollFailedAt);

  if (!lastSuccess) {
    throw new Error('Бот еще не завершил ни одного успешного цикла polling (lastPollSucceededAt пустой).');
  }

  const now = Date.now();
  const lagSeconds = (now - lastSuccess) / 1000;
  if (lagSeconds > maxLagSeconds) {
    throw new Error(`Слишком давно не было успешного polling: ${Math.round(lagSeconds)}s > ${maxLagSeconds}s.`);
  }

  if (lastFailure && lastFailure > lastSuccess) {
    throw new Error(`Последний polling завершился ошибкой: ${runtime.lastPollError || 'unknown error'}`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
