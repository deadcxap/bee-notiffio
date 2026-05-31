import {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  PermissionsBitField
} from 'discord.js';
import { config } from './config.js';
import { defaultLanguage, defaultTemplate, defaultTemplates } from './commands.js';
import { JsonStorage } from './storage.js';
import { TwitchApi } from './twitch.js';

const RESTART_SUPPRESS_MS = 10 * 60 * 1000;

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
    editNoChanges: 'Не указано, что изменить.',
    editUpdated: 'Подписка обновлена.',
    styleCurrent: (mode) => `Текущий стиль уведомлений: ${mode}.`,
    styleUpdated: (mode) => `Стиль уведомлений обновлен: ${mode}.`,
    embedCategory: 'Категория',
    embedViewers: 'Зрители',
    embedStartedAt: 'Начало',
    embedWatch: 'Смотреть на Twitch',
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
    onlyCategory: (category) => `, только категории: ${category}`,
    exceptCategory: (category) => `, кроме категорий: ${category}`,
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
      '`/twitch-subscribe streamer:<логин> category:<игры>` - уведомлять только когда стрим идет в одной из указанных категорий, например `Beat Saber, Synth Riders`.',
      '`/twitch-subscribe streamer:<логин> exclude_category:<игры>` - уведомлять по всем категориям, кроме указанных через запятую. Удобно для схемы “VR-ритм игры в один канал, все остальное в другой”.',
      '`/twitch-unsubscribe streamer:<логин>` - удалить подписку из текущего канала.',
      '`/twitch-unsubscribe streamer:<логин> discord_channel:#канал` - удалить подписку из выбранного канала.',
      '`/twitch-edit streamer:<логин>` - изменить существующую подписку в текущем канале.',
      '`/twitch-edit streamer:<логин> category:<игры>` - заменить список разрешенных категорий.',
      '`/twitch-edit streamer:<логин> exclude_category:<игры>` - заменить список исключенных категорий.',
      '`/twitch-edit streamer:<логин> clear_filters:true` - убрать все фильтры категорий.',
      '`/twitch-edit streamer:<логин> new_discord_channel:#канал` - перенести подписку в другой канал.',
      '`/twitch-edit streamer:<логин> notification_mode:<text|embed|both>` - задать стиль только для этой подписки.',
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
      'Для переноса строки используйте `\\n`, например: `@everyone {streamer}\\n{title}\\n{url}`.',
      'Пример: `@everyone {streamer} играет в {game}: {title} {url}`.',
      '`/twitch-style show` - показать стиль уведомлений сервера.',
      '`/twitch-style set notification_mode:text` - только текстовый шаблон.',
      '`/twitch-style set notification_mode:embed` - только красивая embed-карточка.',
      '`/twitch-style set notification_mode:both` - два сообщения: текстовый шаблон и embed-карточка.',
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
    editNoChanges: 'No changes were provided.',
    editUpdated: 'Subscription updated.',
    styleCurrent: (mode) => `Current notification style: ${mode}.`,
    styleUpdated: (mode) => `Notification style updated: ${mode}.`,
    embedCategory: 'Category',
    embedViewers: 'Viewers',
    embedStartedAt: 'Started',
    embedWatch: 'Watch on Twitch',
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
    onlyCategory: (category) => `, only categories: ${category}`,
    exceptCategory: (category) => `, except categories: ${category}`,
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
      '`/twitch-subscribe streamer:<login> category:<games>` - notify only when the stream is in one of these comma-separated categories, for example `Beat Saber, Synth Riders`.',
      '`/twitch-subscribe streamer:<login> exclude_category:<games>` - notify for all categories except the comma-separated ones. Useful for “VR rhythm games in one channel, everything else in another”.',
      '`/twitch-unsubscribe streamer:<login>` - remove a subscription from the current channel.',
      '`/twitch-unsubscribe streamer:<login> discord_channel:#channel` - remove a subscription from the selected channel.',
      '`/twitch-edit streamer:<login>` - edit an existing subscription in the current channel.',
      '`/twitch-edit streamer:<login> category:<games>` - replace the allowed category list.',
      '`/twitch-edit streamer:<login> exclude_category:<games>` - replace the excluded category list.',
      '`/twitch-edit streamer:<login> clear_filters:true` - remove category filters.',
      '`/twitch-edit streamer:<login> new_discord_channel:#channel` - move the subscription to another channel.',
      '`/twitch-edit streamer:<login> notification_mode:<text|embed|both>` - set style only for this subscription.',
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
      'Use `\\n` for line breaks, for example: `@everyone {streamer}\\n{title}\\n{url}`.',
      'Example: `@everyone {streamer} is playing {game}: {title} {url}`.',
      '`/twitch-style show` - show this server notification style.',
      '`/twitch-style set notification_mode:text` - text template only.',
      '`/twitch-style set notification_mode:embed` - rich embed card only.',
      '`/twitch-style set notification_mode:both` - two messages: text template and embed card.',
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
  console.log(`Logged in as ${readyClient.user.tag}.`);
  console.log(`Polling Twitch every ${config.pollIntervalMs / 1000} seconds.`);
  if (config.skipInitialPoll) {
    console.log('Initial Twitch poll skipped by SKIP_INITIAL_POLL.');
  } else {
    void pollTwitch();
  }
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
    } else if (interaction.commandName === 'twitch-edit') {
      await handleEdit(interaction);
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
    } else if (interaction.commandName === 'twitch-style') {
      await handleStyle(interaction);
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
  const category = normalizeCategories(interaction.options.getString('category'));
  const excludeCategory = normalizeCategories(interaction.options.getString('exclude_category'));
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
      const mode = subscription.notificationMode ? `, mode: ${subscription.notificationMode}` : '';
      return `- ${subscription.twitchDisplayName || subscription.twitchLogin} -> <#${subscription.channelId}>${filter}${template}${mode}`;
    });

  await interaction.reply({
    content: lines.join('\n').slice(0, 1900),
    ephemeral: true
  });
}

async function handleEdit(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const lang = getInteractionLanguage(interaction);
  const login = normalizeLogin(interaction.options.getString('streamer', true));
  const channel = await resolveNotificationChannel(interaction);
  assertNotificationChannel(channel);

  const subscription = storage.findSubscription({
    guildId: interaction.guildId,
    channelId: channel.id,
    twitchLogin: login
  });

  if (!subscription) {
    await interaction.editReply(t(lang, 'subscriptionForTemplateMissing'));
    return;
  }

  const category = normalizeCategories(interaction.options.getString('category'));
  const excludeCategory = normalizeCategories(interaction.options.getString('exclude_category'));
  const clearFilters = interaction.options.getBoolean('clear_filters') || false;
  const template = interaction.options.getString('template');
  const clearTemplate = interaction.options.getBoolean('clear_template') || false;
  const notificationMode = interaction.options.getString('notification_mode');
  const newChannel = interaction.options.getChannel('new_discord_channel');

  if (category && excludeCategory) {
    await interaction.editReply(t(lang, 'chooseOneFilter'));
    return;
  }

  let changed = false;
  if (clearFilters) {
    subscription.category = null;
    subscription.excludeCategory = null;
    changed = true;
  } else if (category || excludeCategory) {
    subscription.category = category;
    subscription.excludeCategory = excludeCategory;
    changed = true;
  }

  if (template !== null) {
    subscription.template = template;
    changed = true;
  } else if (clearTemplate) {
    subscription.template = null;
    changed = true;
  }

  if (notificationMode) {
    subscription.notificationMode = notificationMode;
    changed = true;
  }

  if (newChannel) {
    assertNotificationChannel(newChannel);
    subscription.channelId = newChannel.id;
    changed = true;
  }

  if (!changed) {
    await interaction.editReply(t(lang, 'editNoChanges'));
    return;
  }

  await storage.save();
  const filterText = formatFilterText(subscription, lang);
  const modeText = subscription.notificationMode ? `, mode: ${subscription.notificationMode}` : '';
  await interaction.editReply(`${t(lang, 'editUpdated')}: ${subscription.twitchDisplayName || subscription.twitchLogin} -> <#${subscription.channelId}>${filterText}${modeText}.`);
}

async function handleHelp(interaction) {
  const lang = getInteractionLanguage(interaction);
  const chunks = splitDiscordMessage(t(lang, 'help'));
  await interaction.reply({ content: chunks[0], ephemeral: true });

  for (const chunk of chunks.slice(1)) {
    await interaction.followUp({ content: chunk, ephemeral: true });
  }
}

async function handleStyle(interaction) {
  const guild = storage.getGuild(interaction.guildId);
  const lang = getInteractionLanguage(interaction);
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'show') {
    await interaction.reply({
      content: t(lang, 'styleCurrent')(guild.notificationMode || 'text'),
      ephemeral: true
    });
    return;
  }

  if (subcommand === 'set') {
    guild.notificationMode = interaction.options.getString('notification_mode', true);
    await storage.save();
    await interaction.reply({
      content: t(lang, 'styleUpdated')(guild.notificationMode),
      ephemeral: true
    });
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
  const notificationMode = subscription?.notificationMode || guild.notificationMode || 'text';
  const gameName = firstCategory(subscription?.category) || t(lang, 'testCategory');
  const stream = {
    id: 'test-stream-id',
    user_login: user.login,
    user_name: user.display_name,
    title: t(lang, 'testTitle'),
    game_name: gameName,
    viewer_count: 123,
    started_at: new Date().toISOString()
  };

  await sendNotification({
    channel,
    subscription: {
      twitchDisplayName: user.display_name,
      template,
      language: guild.language,
      notificationMode
    },
    stream,
    allowEveryone: allowPing
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
        if (stored.live) {
          stored.lastEndedAt = new Date().toISOString();
        }
        stored.live = false;
        continue;
      }

      if (!matchesCategoryFilter(stored.category, stored.excludeCategory, stream.game_name)) {
        stored.live = true;
        stored.lastStreamId = stream.id;
        stored.lastNotifiedCategory = null;
        stored.twitchDisplayName = stream.user_name;
        continue;
      }

      if (!shouldSendNotification(stored, stream)) {
        stored.live = true;
        stored.lastStreamId = stream.id;
        stored.twitchDisplayName = stream.user_name;
        continue;
      }

      const channel = await client.channels.fetch(subscription.channelId).catch(() => null);
      if (!channel?.isTextBased()) {
        console.warn(`Cannot notify channel ${subscription.channelId}; it is missing or not text-based.`);
        continue;
      }

      await sendNotification({ channel, subscription, stream, allowEveryone: true });

      stored.live = true;
      stored.lastStreamId = stream.id;
      stored.twitchDisplayName = stream.user_name;
      stored.lastNotifiedAt = new Date().toISOString();
      stored.lastNotifiedCategory = normalizeForCompare(stream.game_name || '');
      storage.recordNotification({
        guildId: subscription.guildId,
        subscription: stored,
        stream
      });
    }

    await storage.save();
  } catch (error) {
    console.error('Polling failed:', error);
  } finally {
    pollInProgress = false;
  }
}

async function sendNotification({ channel, subscription, stream, allowEveryone }) {
  const mode = subscription.notificationMode || 'text';
  const text = renderTemplate(subscription.template, stream, subscription.language);
  const allowedMentions = getAllowedMentions(allowEveryone);

  if (mode === 'text') {
    await channel.send({ content: text, allowedMentions });
    return;
  }

  const embed = buildStreamEmbed(stream, subscription.language);
  if (mode === 'embed') {
    await channel.send({
      content: extractMentionPrefix(text),
      embeds: [embed],
      allowedMentions
    });
    return;
  }

  await channel.send({ content: text, allowedMentions });
  await channel.send({ embeds: [embed], allowedMentions: getAllowedMentions(false) });
}

function getAllowedMentions(enabled) {
  return { parse: enabled ? ['everyone', 'roles'] : [] };
}

function buildStreamEmbed(stream, language = defaultLanguage) {
  const lang = normalizeLanguage(language);
  const url = `https://www.twitch.tv/${stream.user_login}`;
  const thumbnailUrl = stream.thumbnail_url
    ? stream.thumbnail_url.replace('{width}', '1280').replace('{height}', '720')
    : null;

  const embed = new EmbedBuilder()
    .setColor(0x9146ff)
    .setAuthor({ name: stream.user_name, url })
    .setTitle(stream.title || t(lang, 'noTitle'))
    .setURL(url)
    .addFields(
      { name: t(lang, 'embedCategory'), value: stream.game_name || t(lang, 'noCategory'), inline: true },
      { name: t(lang, 'embedViewers'), value: String(stream.viewer_count ?? 0), inline: true },
      { name: t(lang, 'embedStartedAt'), value: stream.started_at || t(lang, 'never'), inline: false }
    )
    .setFooter({ text: t(lang, 'embedWatch') })
    .setTimestamp(new Date());

  if (thumbnailUrl) {
    embed.setImage(`${thumbnailUrl}?t=${Date.now()}`);
  }

  return embed;
}

function extractMentionPrefix(text) {
  const mentions = text.match(/(?:^|\s)(@everyone|@here)(?=\s|$)/g);
  if (!mentions) return null;
  return mentions.map((mention) => mention.trim()).join(' ');
}

function shouldSendNotification(subscription, stream) {
  const category = normalizeForCompare(stream.game_name || '');
  if (subscription.lastStreamId === stream.id && subscription.lastNotifiedCategory === category) {
    return false;
  }

  if (
    subscription.lastStreamId !== stream.id &&
    subscription.lastEndedAt &&
    subscription.lastNotifiedCategory === category &&
    Date.now() - Date.parse(subscription.lastEndedAt) < RESTART_SUPPRESS_MS
  ) {
    return false;
  }

  return true;
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

  const rendered = Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value),
    template || defaultTemplate
  );

  return rendered.replaceAll('\\n', '\n');
}

function normalizeLogin(login) {
  return login.trim().replace(/^https?:\/\/(www\.)?twitch\.tv\//i, '').replace(/^@/, '').split(/[/?#]/)[0].toLowerCase();
}

function normalizeCategories(categories) {
  if (!categories) return null;
  const normalized = categories
    .split(',')
    .map((category) => category.trim().replace(/\s+/g, ' '))
    .filter(Boolean);

  return normalized.length ? normalized.join(', ') : null;
}

function matchesCategoryFilter(includeFilter, excludeFilter, gameName) {
  const normalizedGame = normalizeForCompare(gameName || '');
  const includeFilters = splitCategories(includeFilter).map(normalizeForCompare);
  const excludeFilters = splitCategories(excludeFilter).map(normalizeForCompare);
  if (includeFilters.length > 0 && !includeFilters.includes(normalizedGame)) return false;
  if (excludeFilters.includes(normalizedGame)) return false;
  return true;
}

function normalizeForCompare(value) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function splitCategories(categories) {
  if (!categories) return [];
  return String(categories)
    .split(',')
    .map((category) => category.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
}

function firstCategory(categories) {
  return splitCategories(categories)[0] || null;
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
