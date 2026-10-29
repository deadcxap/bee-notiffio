export function numberEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return parsed;
}

export function getDataFile() {
  return process.env.DATA_FILE?.trim() || './data/bot-data.json';
}

export function getPollIntervalSeconds() {
  return numberEnv('POLL_INTERVAL_SECONDS', 60);
}
