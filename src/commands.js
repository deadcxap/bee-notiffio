import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder
} from 'discord.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('twitch-subscribe')
    .setDescription('Подписать Discord-канал на уведомления о стриме Twitch.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option
        .setName('streamer')
        .setDescription('Логин Twitch, например: twitchdev')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('category')
        .setDescription('Уведомлять только по этим категориям через запятую, например: Beat Saber, Synth Riders')
        .setMaxLength(300)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('exclude_category')
        .setDescription('Не уведомлять по этим категориям через запятую, например: Beat Saber, Synth Riders')
        .setMaxLength(300)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('discord_channel')
        .setDescription('Discord-канал для уведомлений. По умолчанию текущий.')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('twitch-unsubscribe')
    .setDescription('Удалить подписку на уведомления Twitch.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option
        .setName('streamer')
        .setDescription('Логин Twitch, от которого нужно отписаться.')
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('discord_channel')
        .setDescription('Discord-канал. По умолчанию текущий.')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('twitch-list')
    .setDescription('Показать Twitch-подписки этого сервера.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder()
    .setName('twitch-edit')
    .setDescription('Редактировать существующую Twitch-подписку.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option
        .setName('streamer')
        .setDescription('Логин Twitch существующей подписки.')
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('discord_channel')
        .setDescription('Канал, где находится подписка. По умолчанию текущий.')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('new_discord_channel')
        .setDescription('Перенести подписку в другой канал.')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('category')
        .setDescription('Новый список разрешенных категорий через запятую.')
        .setMaxLength(300)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('exclude_category')
        .setDescription('Новый список исключенных категорий через запятую.')
        .setMaxLength(300)
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('clear_filters')
        .setDescription('Очистить category и exclude_category.')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('template')
        .setDescription('Новый личный шаблон этой подписки.')
        .setMaxLength(1800)
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('clear_template')
        .setDescription('Удалить личный шаблон подписки.')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('notification_mode')
        .setDescription('Как отправлять уведомление.')
        .addChoices(
          { name: 'text', value: 'text' },
          { name: 'embed', value: 'embed' },
          { name: 'both', value: 'both' }
        )
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('twitch-style')
    .setDescription('Настроить стиль уведомлений сервера.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('show')
        .setDescription('Показать текущий стиль уведомлений.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Выбрать стиль уведомлений.')
        .addStringOption((option) =>
          option
            .setName('notification_mode')
            .setDescription('text - старый режим, embed - карточка, both - текст + карточка.')
            .addChoices(
              { name: 'text', value: 'text' },
              { name: 'embed', value: 'embed' },
              { name: 'both', value: 'both' }
            )
            .setRequired(true)
        )
    ),
  new SlashCommandBuilder()
    .setName('twitch-help')
    .setDescription('Показать список команд Twitch-уведомлений.'),
  new SlashCommandBuilder()
    .setName('twitch-language')
    .setDescription('Настроить язык ответов бота на этом сервере.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('show')
        .setDescription('Показать текущий язык.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Выбрать язык.')
        .addStringOption((option) =>
          option
            .setName('language')
            .setDescription('Язык ответов.')
            .addChoices(
              { name: 'Русский', value: 'ru' },
              { name: 'English', value: 'en' }
            )
            .setRequired(true)
        )
    ),
  new SlashCommandBuilder()
    .setName('twitch-stats')
    .setDescription('Показать статистику Twitch-уведомлений этого сервера.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder()
    .setName('twitch-test')
    .setDescription('Отправить тестовое Twitch-уведомление в канал.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option
        .setName('streamer')
        .setDescription('Логин Twitch для теста. Если есть подписка, будет взят ее шаблон.')
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('discord_channel')
        .setDescription('Канал для тестового уведомления. По умолчанию текущий.')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('ping')
        .setDescription('Разрешить реальный @everyone/@here в тесте. По умолчанию выключено.')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('twitch-message')
    .setDescription('Настроить текст уведомления для этого сервера.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('show')
        .setDescription('Показать текущий шаблон уведомления.')
        .addStringOption((option) =>
          option
            .setName('streamer')
            .setDescription('Логин Twitch для шаблона конкретной подписки.')
            .setRequired(false)
        )
        .addChannelOption((option) =>
          option
            .setName('discord_channel')
            .setDescription('Канал подписки. По умолчанию текущий.')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Задать свой шаблон уведомления.')
        .addStringOption((option) =>
          option
            .setName('template')
            .setDescription('Плейсхолдеры: {streamer}, {title}, {game}, {url}, {viewers}, {started_at}, {channel}')
            .setMaxLength(1800)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('streamer')
            .setDescription('Логин Twitch для шаблона конкретной подписки.')
            .setRequired(false)
        )
        .addChannelOption((option) =>
          option
            .setName('discord_channel')
            .setDescription('Канал подписки. По умолчанию текущий.')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('reset')
        .setDescription('Вернуть стандартный шаблон уведомления.')
        .addStringOption((option) =>
          option
            .setName('streamer')
            .setDescription('Логин Twitch для шаблона конкретной подписки.')
            .setRequired(false)
        )
        .addChannelOption((option) =>
          option
            .setName('discord_channel')
            .setDescription('Канал подписки. По умолчанию текущий.')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
    )
].map((command) => command.toJSON());

export const defaultLanguage = 'ru';

export const defaultTemplates = {
  ru: '{streamer} вышел в эфир: {title}\n{url}',
  en: '{streamer} is live: {title}\n{url}'
};

export const defaultTemplate = defaultTemplates[defaultLanguage];
