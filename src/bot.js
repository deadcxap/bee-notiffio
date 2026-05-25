import {
  Client,
  Events,
  GatewayIntentBits,
  PermissionsBitField
} from 'discord.js';
import { config } from './config.js';
import { defaultLanguage, defaultTemplate, defaultTemplates } from './commands.js';
import { JsonStorage } from './storage.js';
import { TwitchApi } from './twitch.js';

const messages = {
  ru: {
    error: 'Ошибка',
    chooseOneFilter: 'Используйте либо category, либо exclude_category, но не оба сразу.',
    twitchNotFound: (login) => `Twitch-канал "${login}" не найден.`,
    subscriptionAdded: 'Подписка добавлена',
    subscriptionUpdated: 'Подписка обновлена',
    subscriptionRemoved: (login, channel) => `Подписка на ${login} удалена из ${channel}.`,
    subscriptionMissing: (login, channel) => `Подписка на ${login} в ${channel} не найдена.`,
    noSubscriptions: 'На этом сервере пока нет Twitch-подписок.',
    currentTemplate: 'Текущий шаблон',
    serverTemplate: 'серверный',
    subscriptionTemplate: 'шаблон подписки',
    templateUpdated: 'Шаблон уведомления обновлен.',
    templateReset: 'Шаблон уведомления сброшен.',
    subscriptionTemplateUpdated: 'Шаблон подписки обновлен.',
    subscriptionTemplateReset: 'Шаблон подписки сброшен. Теперь используется серверный шаблон.',
    subscriptionForTemplateMissing: 'Подписка для такого стримера и канала не найдена.',
    languageCurrent: (language) => `Текущий язык: ${language}.`,
    languageUpdated: (language) => `Язык сервера обновлен: ${language}.`,
    statsEmpty: 'Статистика пока пустая: бот еще не отправлял уведомления на этом сервере.',
    statsTitle: 'Статистика Twitch-уведомлений',
    total: 'Всего уведомлений',
    lastNotification: 'Последнее уведомление',
    topStreamers: 'Топ стримеров',
    topCategories: 'Топ категорий',
    customTemplate: ', свой шаблон',
    testSent: (channel) => `Тестовое уведомление отправлено в ${channel}.`,
    testTitle: 'Тестовое уведомление',
    testCategory: 'Тестовая категория',
    never: 'никогда',
    onlyCategory: (category) => `, только категория: ${category}`,
    exceptCategory: (category) => `, кроме категории: ${category}`,
    noTitle: 'Без названия',
    noCategory: 'Без категории',
    noChannelAccess: 'У меня нет доступа к этому каналу. Дайте боту права View Channel и Send Messages или выберите другой канал в параметре discord_channel.',
    chooseTextChannel: 'Выберите текстовый канал сервера, куда бот сможет отправлять уведомления.',
    missingView: (name) => `У меня нет права View Channel для #${name}.`,
    missingSend: (name) => `У меня нет права Send Messages для #${name}.`,
    missingThreadSend: (name) => `У меня нет права Send Messages in Threads для #${name}.`,
    help: [
      '**Команды Twitch-уведомлений**',
      '',
      '**Подписки**',
      '`/twitch-subscribe streamer:<логин>` - подписать текущий канал на все стримы выбранного Twitch-канала.',
      '`/twitch-subscribe streamer:<логин> discord_channel:#канал` - подписать не текущий, а выбранный Discord-канал.',
      '`/twitch-subscribe streamer:<логин> category:<игра>` - уведомлять только когда стрим идет в указанной категории, например `Beat Saber`.',
      '`/twitch-subscribe streamer:<логин> exclude_category:<игра>` - уведомлять по всем категориям, кроме указанной. Удобно для схемы “Beat Saber в один канал, все остальное в другой”.',
      '`/twitch-unsubscribe streamer:<логин>` - удалить подписку из текущего канала.',
      '`/twitch-unsubscribe streamer:<логин> discord_channel:#канал` - удалить подписку из выбранного канала.',
      '`/twitch-list` - показать все подписки сервера, их каналы, фильтры категорий и наличие личного шаблона.',
      '',
      '**Кастомизация уведомлений**',
      '`/twitch-message show` - показать серверный шаблон. Он используется для всех подписок без личного шаблона.',
      '`/twitch-message set template:<текст>` - задать серверный шаблон уведомления.',
      '`/twitch-message reset` - вернуть серверный шаблон по умолчанию для текущего языка.',
      '`/twitch-message show streamer:<логин>` - показать шаблон конкретной подписки в текущем канале.',
      '`/twitch-message set streamer:<логин> template:<текст>` - задать шаблон только для подписки в текущем канале.',
      '`/twitch-message reset streamer:<логин>` - удалить личный шаблон подписки, после этого снова используется серверный.',
      '`/twitch-message ... discord_channel:#канал` - добавить, если нужная подписка находится не в текущем канале.',
      'Плейсхолдеры для шаблонов: `{streamer}`, `{title}`, `{game}`, `{url}`, `{viewers}`, `{started_at}`, `{channel}`.',
      'Пример: `@everyone {streamer} играет в {game}: {title} {url}`.',
      '',
      '**Тест и настройки**',
      '`/twitch-test streamer:<логин>` - отправить тестовое уведомление. Если в этом канале есть подписка на стримера, будет использован ее личный шаблон или серверный шаблон.',
      '`/twitch-test streamer:<логин> ping:true` - тест с реальным `@everyone/@here`. Без `ping:true` mention остается текстом без уведомления.',
      '`/twitch-language show` - показать язык сервера.',
      '`/twitch-language set language:<ru|en>` - выбрать язык ответов бота и `/twitch-help`.',
      '`/twitch-stats` - показать мини-статистику: сколько уведомлений отправлено, топ стримеров и топ категорий.',
      '`/twitch-help` - показать эту справку.'
    ]
  },
  en: {
    error: 'Error',
    chooseOneFilter: 'Use either category or exclude_category, not both at the same time.',
    twitchNotFound: (login) => `Twitch channel "${login}" was not found.`,
    subscriptionAdded: 'Subscription added',
    subscriptionUpdated: 'Subscription updated',
    subscriptionRemoved: (login, channel) => `Unsubscribed from ${login} in ${channel}.`,
    subscriptionMissing: (login, channel) => `No subscription for ${login} in ${channel}.`,
    noSubscriptions: 'There are no Twitch subscriptions on this server yet.',
    currentTemplate: 'Current template',
    serverTemplate: 'server',
    subscriptionTemplate: 'subscription template',
    templateUpdated: 'Notification template updated.',
    templateReset: 'Notification template reset.',
    subscriptionTemplateUpdated: 'Subscription template updated.',
    subscriptionTemplateReset: 'Subscription template reset. The server template is now used.',
    subscriptionForTemplateMissing: 'No subscription found for that streamer and channel.',
    languageCurrent: (language) => `Current language: ${language}.`,
    languageUpdated: (language) => `Server language updated: ${language}.`,
    statsEmpty: 'Stats are empty: the bot has not sent notifications on this server yet.',
    statsTitle: 'Twitch notification stats',
    total: 'Total notifications',
    lastNotification: 'Last notification',
    topStreamers: 'Top streamers',
    topCategories: 'Top categories',
    customTemplate: ', custom template',
    testSent: (channel) => `Test notification sent to ${channel}.`,
    testTitle: 'Test notification',
    testCategory: 'Test category',
    never: 'never',
    onlyCategory: (category) => `, only category: ${category}`,
    exceptCategory: (category) => `, except category: ${category}`,
    noTitle: 'Untitled stream',
    noCategory: 'No category',
    noChannelAccess: 'I do not have access to this channel. Give the bot View Channel and Send Messages permissions or choose another channel with discord_channel.',
    chooseTextChannel: 'Choose a server text channel where the bot can send notifications.',
    missingView: (name) => `I do not have View Channel permission for #${name}.`,
    missingSend: (name) => `I do not have Send Messages permission for #${name}.`,
    missingThreadSend: (name) => `I do not have Send Messages in Threads permission for #${name}.`,
    help: [
      '**Twitch Notification Commands**',
      '',
      '**Subscriptions**',
      '`/twitch-subscribe streamer:<login>` - subscribe the current channel to all streams from a Twitch channel.',
      '`/twitch-subscribe streamer:<login> discord_channel:#channel` - subscribe a selected Discord channel instead of the current one.',
      '`/twitch-subscribe streamer:<login> category:<game>` - notify only when the stream is in that category, for example `Beat Saber`.',
      '`/twitch-subscribe streamer:<login> exclude_category:<game>` - notify for all categories except that one. Useful for “Beat Saber in one channel, everything else in another”.',
      '`/twitch-unsubscribe streamer:<login>` - remove a subscription from the current channel.',
      '`/twitch-unsubscribe streamer:<login> discord_channel:#channel` - remove a subscription from the selected channel.',
      '`/twitch-list` - show server subscriptions, channels, category filters, and whether a custom template is set.',
      '',
      '**Notification Customization**',
      '`/twitch-message show` - show the server template. It is used by every subscription without its own template.',
      '`/twitch-message set template:<text>` - set the server notification template.',
      '`/twitch-message reset` - reset the server template to the default for the current language.',
      '`/twitch-message show streamer:<login>` - show the template for one subscription in the current channel.',
      '`/twitch-message set streamer:<login> template:<text>` - set a template only for that subscription in the current channel.',
      '`/twitch-message reset streamer:<login>` - remove the subscription template, falling back to the server template.',
      '`/twitch-message ... discord_channel:#channel` - add this when the target subscription is in another channel.',
      'Template placeholders: `{streamer}`, `{title}`, `{game}`, `{url}`, `{viewers}`, `{started_at}`, `{channel}`.',
      'Example: `@everyone {streamer} is playing {game}: {title} {url}`.',
      '',
      '**Testing and Settings**',
      '`/twitch-test streamer:<login>` - send a test notification. If this channel has a subscription for the streamer, its custom template or the server template is used.',
      '`/twitch-test streamer:<login> ping:true` - test with real `@everyone/@here`. Without `ping:true`, the mention stays silent text.',
      '`/twitch-language show` - show this server language.',
      '`/twitch-language set language:<ru|en>` - choose bot response and `/twitch-help` language.',
      '`/twitch-stats` - show mini stats: sent notifications, top streamers, and top categories.',
      '`/twitch-help` - show this help.'
    ]
  }
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const storage = new JsonStorage(config.dataFile);
const twitch = new TwitchApi({
  clientId: config.twitchClientId,
  clientSecret: config.twitchClientSecret
});

let pollInProgress = false;

client.once(Events.ClientReady, async (readyClient) => {
  await storage.load();
  storage.setRuntimeStatus({ startedAt: new Date().toISOString() });
  await storage.save();
  console.log(`Logged in as ${readyClient.user.tag}.`);
  console.log(`Polling Twitch every ${config.pollIntervalMs / 1000} seconds.`);
  void pollTwitch();
  setInterval(() => void pollTwitch(), config.pollIntervalMs);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.inGuild()) return;

  try {
    if (interaction.commandName === 'twitch-subscribe') {
      await handleSubscribe(interaction);
    } else if (interaction.commandName === 'twitch-unsubscribe') {
      await handleUnsubscribe(interaction);
    } else if (interaction.commandName === 'twitch-list') {
      await handleList(interaction);
    } else if (interaction.commandName === 'twitch-help') {
      await handleHelp(interaction);
    } else if (interaction.commandName === 'twitch-language') {
      await handleLanguage(interaction);
    } else if (interaction.commandName === 'twitch-stats') {
      await handleStats(interaction);
    } else if (interaction.commandName === 'twitch-test') {
      await handleTest(interaction);
    } else if (interaction.commandName === 'twitch-message') {
      await handleMessage(interaction);
    }
  } catch (error) {
    console.error(error);
    const lang = getInteractionLanguage(interaction);
    const content = `${t(lang, 'error')}: ${error.message}`;
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content });
    } else {
      await interaction.reply({ content, ephemeral: true });
    }
  }
});

async function handleSubscribe(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const login = normalizeLogin(interaction.options.getString('streamer', true));
  const category = normalizeCategory(interaction.options.getString('category'));
  const excludeCategory = normalizeCategory(interaction.options.getString('exclude_category'));
  const lang = getInteractionLanguage(interaction);
  if (category && excludeCategory) {
    await interaction.editReply(t(lang, 'chooseOneFilter'));
    return;
  }

  const channel = await resolveNotificationChannel(interaction);
  assertNotificationChannel(channel);

  const user = await twitch.getUserByLogin(login);
  if (!user) {
    await interaction.editReply(t(lang, 'twitchNotFound')(login));
    return;
  }

  const result = storage.addSubscription({
    guildId: interaction.guildId,
    channelId: channel.id,
    twitchLogin: user.login.toLowerCase(),
    twitchDisplayName: user.display_name,
    twitchUserId: user.id,
    category,
    excludeCategory
  });
  await storage.save();

  const action = result.created ? t(lang, 'subscriptionAdded') : t(lang, 'subscriptionUpdated');
  const filterText = formatFilterText({ category, excludeCategory }, lang);
  await interaction.editReply(`${action}: ${user.display_name} -> ${channel}${filterText}.`);
}

async function handleUnsubscribe(interaction) {
  const lang = getInteractionLanguage(interaction);
  const login = normalizeLogin(interaction.options.getString('streamer', true));
  const channel = await resolveNotificationChannel(interaction);
  assertNotificationChannel(channel);

  const removed = storage.removeSubscription({
    guildId: interaction.guildId,
    channelId: channel.id,
    twitchLogin: login
  });
  await storage.save();

  await interaction.reply({
    content: removed
      ? t(lang, 'subscriptionRemoved')(login, channel)
      : t(lang, 'subscriptionMissing')(login, channel),
    ephemeral: true
  });
}

async function handleList(interaction) {
  const lang = getInteractionLanguage(interaction);
  const guild = storage.getGuild(interaction.guildId);
  if (guild.subscriptions.length === 0) {
    await interaction.reply({ content: t(lang, 'noSubscriptions'), ephemeral: true });
    return;
  }

  const lines = guild.subscriptions
    .sort((left, right) => left.twitchLogin.localeCompare(right.twitchLogin))
    .map((subscription) => {
      const filter = formatFilterText(subscription, lang);
      const template = subscription.template ? t(lang, 'customTemplate') : '';
      return `- ${subscription.twitchDisplayName || subscription.twitchLogin} -> <#${subscription.channelId}>${filter}${template}`;
    });

  await interaction.reply({
    content: lines.join('\n').slice(0, 1900),
    ephemeral: true
  });
}

async function handleHelp(interaction) {
  const lang = getInteractionLanguage(interaction);
  const chunks = splitDiscordMessage(t(lang, 'help'));
  await interaction.reply({ content: chunks[0], ephemeral: true });

  for (const chunk of chunks.slice(1)) {
    await interaction.followUp({ content: chunk, ephemeral: true });
  }
}

async function handleLanguage(interaction) {
  const guild = storage.getGuild(interaction.guildId);
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'show') {
    const lang = guild.language || defaultLanguage;
    await interaction.reply({ content: t(lang, 'languageCurrent')(lang), ephemeral: true });
    return;
  }

  if (subcommand === 'set') {
    guild.language = interaction.options.getString('language', true);
    await storage.save();
    await interaction.reply({
      content: t(guild.language, 'languageUpdated')(guild.language),
      ephemeral: true
    });
  }
}

async function handleStats(interaction) {
  const lang = getInteractionLanguage(interaction);
  const guild = storage.getGuild(interaction.guildId);
  const stats = guild.stats;

  if (!stats?.totalNotifications) {
    await interaction.reply({ content: t(lang, 'statsEmpty'), ephemeral: true });
    return;
  }

  const lines = [
    `**${t(lang, 'statsTitle')}**`,
    `${t(lang, 'total')}: ${stats.totalNotifications}`,
    `${t(lang, 'lastNotification')}: ${stats.lastNotificationAt || t(lang, 'never')}`,
    '',
    `**${t(lang, 'topStreamers')}**`,
    ...formatTop(stats.byStreamer),
    '',
    `**${t(lang, 'topCategories')}**`,
    ...formatTop(stats.byCategory)
  ];

  await interaction.reply({
    content: lines.join('\n').slice(0, 1900),
    ephemeral: true
  });
}

async function handleTest(interaction) {
  const lang = getInteractionLanguage(interaction);
  const login = normalizeLogin(interaction.options.getString('streamer', true));
  const channel = await resolveNotificationChannel(interaction);
  const allowPing = interaction.options.getBoolean('ping') || false;
  assertNotificationChannel(channel);

  const user = await twitch.getUserByLogin(login);
  if (!user) {
    await interaction.reply({ content: t(lang, 'twitchNotFound')(login), ephemeral: true });
    return;
  }

  const guild = storage.getGuild(interaction.guildId);
  const subscription = storage.findSubscription({
    guildId: interaction.guildId,
    channelId: channel.id,
    twitchLogin: user.login.toLowerCase()
  });
  const template = subscription?.template || guild.template || defaultTemplates[guild.language] || defaultTemplate;
  const gameName = subscription?.category || t(lang, 'testCategory');
  const stream = {
    id: 'test-stream-id',
    user_login: user.login,
    user_name: user.display_name,
    title: t(lang, 'testTitle'),
    game_name: gameName,
    viewer_count: 123,
    started_at: new Date().toISOString()
  };

  await channel.send({
    content: renderTemplate(template, stream, guild.language),
    allowedMentions: { parse: allowPing ? ['everyone'] : [] }
  });

  await interaction.reply({
    content: t(lang, 'testSent')(channel),
    ephemeral: true
  });
}

async function handleMessage(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const guild = storage.getGuild(interaction.guildId);
  const lang = getInteractionLanguage(interaction);
  const target = await resolveTemplateTarget(interaction);

  if (subcommand === 'show') {
    const template = target.subscription
      ? target.subscription.template || guild.template || defaultTemplates[guild.language] || defaultTemplate
      : guild.template || defaultTemplates[guild.language] || defaultTemplate;
    const label = target.subscription ? t(lang, 'subscriptionTemplate') : t(lang, 'serverTemplate');
    await interaction.reply({
      content: `${t(lang, 'currentTemplate')} (${label}):\n\`\`\`\n${template}\n\`\`\``,
      ephemeral: true
    });
    return;
  }

  if (subcommand === 'reset') {
    if (target.subscription) {
      target.subscription.template = null;
      await storage.save();
      await interaction.reply({ content: t(lang, 'subscriptionTemplateReset'), ephemeral: true });
      return;
    }

    guild.template = defaultTemplates[guild.language] || defaultTemplate;
    await storage.save();
    await interaction.reply({ content: t(lang, 'templateReset'), ephemeral: true });
    return;
  }

  if (subcommand === 'set') {
    if (target.subscription) {
      target.subscription.template = interaction.options.getString('template', true);
      await storage.save();
      await interaction.reply({ content: t(lang, 'subscriptionTemplateUpdated'), ephemeral: true });
      return;
    }

    guild.template = interaction.options.getString('template', true);
    await storage.save();
    await interaction.reply({ content: t(lang, 'templateUpdated'), ephemeral: true });
  }
}

async function pollTwitch() {
  if (pollInProgress) return;
  pollInProgress = true;

  try {
    storage.setRuntimeStatus({
      lastPollStartedAt: new Date().toISOString(),
      lastPollError: null
    });

    const subscriptions = storage.allSubscriptions();
    const streamsByLogin = await twitch.getStreamsByLogins(
      subscriptions.map((subscription) => subscription.twitchLogin)
    );

    for (const subscription of subscriptions) {
      const stream = streamsByLogin.get(subscription.twitchLogin);
      const guild = storage.getGuild(subscription.guildId);
      const stored = guild.subscriptions.find(
        (item) =>
          item.channelId === subscription.channelId &&
          item.twitchLogin === subscription.twitchLogin
      );
      if (!stored) continue;

      if (!stream) {
        stored.live = false;
        continue;
      }

      if (!matchesCategoryFilter(stored.category, stored.excludeCategory, stream.game_name)) {
        stored.live = true;
        stored.lastStreamId = stream.id;
        stored.twitchDisplayName = stream.user_name;
        continue;
      }

      if (stored.live && stored.lastStreamId === stream.id) {
        continue;
      }

      const channel = await client.channels.fetch(subscription.channelId).catch(() => null);
      if (!channel?.isTextBased()) {
        console.warn(`Cannot notify channel ${subscription.channelId}; it is missing or not text-based.`);
        continue;
      }

      const message = renderTemplate(subscription.template, stream, subscription.language);
      await channel.send({
        content: message,
        allowedMentions: { parse: ['everyone'] }
      });

      stored.live = true;
      stored.lastStreamId = stream.id;
      stored.twitchDisplayName = stream.user_name;
      storage.recordNotification({
        guildId: subscription.guildId,
        subscription: stored,
        stream
      });
    }

    storage.setRuntimeStatus({
      lastPollSucceededAt: new Date().toISOString(),
      lastPollError: null
    });
    await storage.save();
  } catch (error) {
    storage.setRuntimeStatus({
      lastPollFailedAt: new Date().toISOString(),
      lastPollError: error?.message || String(error)
    });
    await storage.save();
    console.error('Polling failed:', error);
  } finally {
    pollInProgress = false;
  }
}

function renderTemplate(template, stream, language = defaultLanguage) {
  const lang = normalizeLanguage(language);
  const url = `https://www.twitch.tv/${stream.user_login}`;
  const values = {
    streamer: stream.user_name,
    title: stream.title || t(lang, 'noTitle'),
    game: stream.game_name || t(lang, 'noCategory'),
    url,
    viewers: String(stream.viewer_count ?? 0),
    started_at: stream.started_at || '',
    channel: stream.user_login
  };

  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value),
    template || defaultTemplate
  );
}

function normalizeLogin(login) {
  return login.trim().replace(/^https?:\/\/(www\.)?twitch\.tv\//i, '').replace(/^@/, '').split(/[/?#]/)[0].toLowerCase();
}

function normalizeCategory(category) {
  if (!category) return null;
  const normalized = category.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function matchesCategoryFilter(includeFilter, excludeFilter, gameName) {
  const normalizedGame = normalizeForCompare(gameName || '');
  if (includeFilter && normalizeForCompare(includeFilter) !== normalizedGame) return false;
  if (excludeFilter && normalizeForCompare(excludeFilter) === normalizedGame) return false;
  return true;
}

function normalizeForCompare(value) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function formatFilterText({ category, excludeCategory }, language = defaultLanguage) {
  const lang = normalizeLanguage(language);
  if (category) return t(lang, 'onlyCategory')(category);
  if (excludeCategory) return t(lang, 'exceptCategory')(excludeCategory);
  return '';
}

async function resolveTemplateTarget(interaction) {
  const streamer = interaction.options.getString('streamer');
  if (!streamer) return { subscription: null };

  const lang = getInteractionLanguage(interaction);
  const channel = await resolveNotificationChannel(interaction);
  assertNotificationChannel(channel);
  const twitchLogin = normalizeLogin(streamer);
  const subscription = storage.findSubscription({
    guildId: interaction.guildId,
    channelId: channel.id,
    twitchLogin
  });

  if (!subscription) {
    throw new Error(t(lang, 'subscriptionForTemplateMissing'));
  }

  return { subscription };
}

function formatTop(values) {
  const rows = Object.entries(values || {})
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, count], index) => `${index + 1}. ${name}: ${count}`);

  return rows.length ? rows : ['-'];
}

function splitDiscordMessage(lines, maxLength = 1900) {
  const chunks = [];
  let current = '';

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length > maxLength) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks.length ? chunks : ['-'];
}

function getInteractionLanguage(interaction) {
  if (!interaction.guildId) return defaultLanguage;
  return normalizeLanguage(storage.getGuild(interaction.guildId).language);
}

function normalizeLanguage(language) {
  return language === 'en' ? 'en' : defaultLanguage;
}

function t(language, key) {
  return messages[normalizeLanguage(language)][key];
}

async function resolveNotificationChannel(interaction) {
  const selectedChannel = interaction.options.getChannel('discord_channel');
  if (selectedChannel) return selectedChannel;

  if (interaction.channel) return interaction.channel;

  return client.channels.fetch(interaction.channelId).catch(() => {
    const lang = getInteractionLanguage(interaction);
    throw new Error(t(lang, 'noChannelAccess'));
  });
}

function assertNotificationChannel(channel) {
  const language = channel?.guildId ? normalizeLanguage(storage.getGuild(channel.guildId).language) : defaultLanguage;
  if (!channel?.guild || !channel.isTextBased()) {
    throw new Error(t(language, 'chooseTextChannel'));
  }

  const permissions = channel.guild.members.me?.permissionsIn(channel);
  if (permissions && !permissions.has(PermissionsBitField.Flags.ViewChannel)) {
    throw new Error(t(language, 'missingView')(channel.name));
  }

  if (permissions && !permissions.has(PermissionsBitField.Flags.SendMessages)) {
    throw new Error(t(language, 'missingSend')(channel.name));
  }

  if (channel.isThread?.() && permissions && !permissions.has(PermissionsBitField.Flags.SendMessagesInThreads)) {
    throw new Error(t(language, 'missingThreadSend')(channel.name));
  }
}

process.on('SIGINT', async () => {
  await storage.save();
  client.destroy();
  process.exit(0);
});

await client.login(config.discordToken);
