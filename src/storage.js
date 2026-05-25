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
      notificationsSent: 0,
      lastStreamId: null,
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
        ...subscription,
        template: subscription.template || guild.template || defaultTemplates[guild.language] || defaultTemplate
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
    guild.stats = normalizeStats(guild.stats);
    if (!Array.isArray(guild.subscriptions)) guild.subscriptions = [];
    for (const subscription of guild.subscriptions) {
      subscription.twitchLogin = String(subscription.twitchLogin || '').toLowerCase();
      subscription.category = normalizeCategory(subscription.category);
      subscription.excludeCategory = normalizeCategory(subscription.excludeCategory);
      subscription.template = normalizeTemplate(subscription.template);
      subscription.notificationsSent = Number.isFinite(subscription.notificationsSent)
        ? subscription.notificationsSent
        : 0;
      subscription.lastStreamId ??= null;
      subscription.live ??= false;
    }
  }

  return data;
}

function normalizeCategory(category) {
  if (!category) return null;
  const normalized = String(category).trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function normalizeTemplate(template) {
  if (!template) return null;
  const normalized = String(template).trim();
  return normalized || null;
}

function normalizeLanguage(language) {
  return language === 'en' ? 'en' : defaultLanguage;
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
