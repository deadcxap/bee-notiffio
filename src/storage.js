import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { defaultLanguage, defaultTemplate, defaultTemplates } from './commands.js';

const emptyData = {
  guilds: {}
};

export class JsonStorage {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = structuredClone(emptyData);
    this.writeQueue = Promise.resolve();
  }

  async load() {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      this.data = normalize(JSON.parse(raw));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      this.data = structuredClone(emptyData);
      await this.save();
    }
  }

  async save() {
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(dirname(this.filePath), { recursive: true });
      const tempPath = `${this.filePath}.tmp`;
      await writeFile(tempPath, `${JSON.stringify(this.data, null, 2)}\n`, 'utf8');
      await rename(tempPath, this.filePath);
    });
    return this.writeQueue;
  }

  getGuild(guildId) {
    if (!this.data.guilds[guildId]) {
      this.data.guilds[guildId] = {
        language: defaultLanguage,
        template: defaultTemplate,
        notificationMode: 'text',
        subscriptions: [],
        stats: createEmptyStats()
      };
    }
    return this.data.guilds[guildId];
  }

  addSubscription({
    guildId,
    channelId,
    twitchLogin,
    twitchDisplayName,
    twitchUserId,
    category,
    excludeCategory
  }) {
    const guild = this.getGuild(guildId);
    const existing = guild.subscriptions.find(
      (subscription) =>
        subscription.channelId === channelId &&
        subscription.twitchLogin === twitchLogin
    );

    if (existing) {
      existing.twitchDisplayName = twitchDisplayName;
      existing.twitchUserId = twitchUserId;
      existing.category = category;
      existing.excludeCategory = excludeCategory;
      existing.template ??= null;
      existing.notificationMode ??= null;
      existing.notificationsSent ??= 0;
      return { created: false, subscription: existing };
    }

    const subscription = {
      channelId,
      twitchLogin,
      twitchDisplayName,
      twitchUserId,
      category,
      excludeCategory,
      template: null,
      notificationMode: null,
      notificationsSent: 0,
      lastStreamId: null,
      lastEndedAt: null,
      lastNotifiedAt: null,
      lastNotifiedCategory: null,
      live: false,
      createdAt: new Date().toISOString()
    };
    guild.subscriptions.push(subscription);
    return { created: true, subscription };
  }

  removeSubscription({ guildId, channelId, twitchLogin }) {
    const guild = this.getGuild(guildId);
    const before = guild.subscriptions.length;
    guild.subscriptions = guild.subscriptions.filter(
      (subscription) =>
        subscription.channelId !== channelId ||
        subscription.twitchLogin !== twitchLogin
    );
    return before !== guild.subscriptions.length;
  }

  allSubscriptions() {
    return Object.entries(this.data.guilds).flatMap(([guildId, guild]) =>
      guild.subscriptions.map((subscription) => ({
        guildId,
        language: guild.language,
        guildNotificationMode: guild.notificationMode,
        ...subscription,
        template: subscription.template || guild.template || defaultTemplates[guild.language] || defaultTemplate,
        notificationMode: subscription.notificationMode || guild.notificationMode || 'text'
      }))
    );
  }

  findSubscription({ guildId, channelId, twitchLogin }) {
    const guild = this.getGuild(guildId);
    return guild.subscriptions.find(
      (subscription) =>
        subscription.channelId === channelId &&
        subscription.twitchLogin === twitchLogin
    );
  }

  recordNotification({ guildId, subscription, stream }) {
    const guild = this.getGuild(guildId);
    guild.stats ??= createEmptyStats();
    guild.stats.totalNotifications += 1;
    guild.stats.lastNotificationAt = new Date().toISOString();

    const streamerKey = stream.user_login.toLowerCase();
    const categoryKey = stream.game_name || 'No category';
    guild.stats.byStreamer[streamerKey] = (guild.stats.byStreamer[streamerKey] || 0) + 1;
    guild.stats.byCategory[categoryKey] = (guild.stats.byCategory[categoryKey] || 0) + 1;

    subscription.notificationsSent = (subscription.notificationsSent || 0) + 1;
  }
}

function normalize(raw) {
  const data = raw && typeof raw === 'object' ? raw : structuredClone(emptyData);
  if (!data.guilds || typeof data.guilds !== 'object') data.guilds = {};

  for (const guild of Object.values(data.guilds)) {
    guild.language = normalizeLanguage(guild.language);
    if (!guild.template) guild.template = defaultTemplates[guild.language] || defaultTemplate;
    guild.notificationMode = normalizeNotificationMode(guild.notificationMode) || 'text';
    guild.stats = normalizeStats(guild.stats);
    if (!Array.isArray(guild.subscriptions)) guild.subscriptions = [];
    for (const subscription of guild.subscriptions) {
      subscription.twitchLogin = String(subscription.twitchLogin || '').toLowerCase();
      subscription.category = normalizeCategories(subscription.category);
      subscription.excludeCategory = normalizeCategories(subscription.excludeCategory);
      subscription.template = normalizeTemplate(subscription.template);
      subscription.notificationMode = normalizeNotificationMode(subscription.notificationMode);
      subscription.notificationsSent = Number.isFinite(subscription.notificationsSent)
        ? subscription.notificationsSent
        : 0;
      subscription.lastStreamId ??= null;
      subscription.lastEndedAt ??= null;
      subscription.lastNotifiedAt ??= null;
      subscription.lastNotifiedCategory ??= null;
      subscription.live ??= false;
    }
  }

  return data;
}

function normalizeCategories(categories) {
  if (!categories) return null;
  const items = Array.isArray(categories) ? categories : String(categories).split(',');
  const normalized = items
    .map((category) => String(category).trim().replace(/\s+/g, ' '))
    .filter(Boolean);

  return normalized.length ? normalized.join(', ') : null;
}

function normalizeTemplate(template) {
  if (!template) return null;
  const normalized = String(template).trim();
  return normalized || null;
}

function normalizeLanguage(language) {
  return language === 'en' ? 'en' : defaultLanguage;
}

function normalizeNotificationMode(mode) {
  return ['text', 'embed', 'both'].includes(mode) ? mode : null;
}

function normalizeStats(stats) {
  return {
    totalNotifications: Number.isFinite(stats?.totalNotifications) ? stats.totalNotifications : 0,
    byStreamer: stats?.byStreamer && typeof stats.byStreamer === 'object' ? stats.byStreamer : {},
    byCategory: stats?.byCategory && typeof stats.byCategory === 'object' ? stats.byCategory : {},
    lastNotificationAt: stats?.lastNotificationAt || null
  };
}

function createEmptyStats() {
  return {
    totalNotifications: 0,
    byStreamer: {},
    byCategory: {},
    lastNotificationAt: null
  };
}
