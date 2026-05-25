# Notiffio Local

Локальный Discord-бот для уведомлений о старте стрима на Twitch. Работает через slash-команды Discord и polling Twitch Helix API, поэтому его можно запускать дома или на арендованном VPS без публичного webhook.

## Возможности

- `/twitch-subscribe streamer:<логин>` - подписать текущий Discord-канал на Twitch-канал.
- `/twitch-subscribe streamer:<логин> discord_channel:<канал>` - подписать выбранный канал.
- `/twitch-subscribe streamer:<логин> category:<категория>` - получать уведомления только если стрим запущен в указанной категории.
- `/twitch-subscribe streamer:<логин> exclude_category:<категория>` - получать уведомления по всем категориям, кроме указанной.
- `/twitch-unsubscribe streamer:<логин>` - удалить подписку.
- `/twitch-list` - показать подписки сервера.
- `/twitch-help` - показать список команд.
- `/twitch-message show` - показать шаблон уведомления.
- `/twitch-message set template:<текст>` - задать свой текст.
- `/twitch-message reset` - вернуть стандартный текст.
- `/twitch-message set template:<текст> streamer:<логин>` - задать шаблон только для подписки в текущем канале.
- `/twitch-message show streamer:<логин>` - показать шаблон конкретной подписки.
- `/twitch-message reset streamer:<логин>` - сбросить шаблон конкретной подписки к серверному.
- `/twitch-language show` - показать язык сервера.
- `/twitch-language set language:<ru|en>` - выбрать язык ответов бота.
- `/twitch-stats` - показать мини-статистику уведомлений сервера.
- `/twitch-test streamer:<логин>` - отправить тестовое уведомление в текущий канал.
- `/twitch-test streamer:<логин> ping:true` - отправить тест с реальным `@everyone/@here`.

Поддерживаемые плейсхолдеры в шаблоне:

```text
{streamer} {title} {game} {url} {viewers} {started_at} {channel}
```

Пример:

```text
{streamer} вышел в эфир!
{title}
Категория: {game}
{url}
```

Пример подписки только на Beat Saber:

```text
/twitch-subscribe streamer:somechannel category:Beat Saber discord_channel:#streams
```

Если стример запустит Minecraft или другую категорию, уведомление по такой подписке отправлено не будет.

Пример двух каналов для одного стримера:

```text
/twitch-subscribe streamer:somechannel category:Beat Saber discord_channel:#beat-saber
/twitch-subscribe streamer:somechannel exclude_category:Beat Saber discord_channel:#other-streams
```

## Шаблоны

По умолчанию шаблон задается на весь сервер:

```text
/twitch-message set template:@everyone {streamer} в эфире: {title} {url}
```

Можно задать отдельный шаблон для конкретной подписки в текущем канале:

```text
/twitch-message set streamer:somechannel template:@BeatSaberPing {streamer} играет в {game}: {url}
```

Если подписка находится в другом канале, добавьте `discord_channel`.

## Язык

Бот поддерживает ответы на русском и английском:

```text
/twitch-language set language:en
/twitch-language set language:ru
```

Команда `/twitch-help` показывает справку на выбранном языке.

## Статистика

`/twitch-stats` показывает, сколько уведомлений бот отправил на сервере, топ стримеров и топ категорий. Статистика начинает копиться после версии с этой командой.

## Тест уведомления

Команда отправляет пример уведомления без ожидания реального стрима:

```text
/twitch-test streamer:somechannel
```

Если в выбранном канале есть подписка на этого стримера, бот использует шаблон этой подписки. Если личного шаблона нет, используется серверный шаблон.

По умолчанию `@everyone` и `@here` в тесте не пингуют людей. Для проверки реального пинга:

```text
/twitch-test streamer:somechannel ping:true
```

## Быстрый запуск

1. Установите Node.js 20 или новее.
2. Создайте Discord-приложение и бота в Discord Developer Portal.
3. Пригласите бота на сервер со scopes `bot` и `applications.commands`; из прав минимум нужны `Send Messages` и `View Channels`.
4. Создайте Twitch-приложение в Twitch Developer Console и получите `Client ID` и `Client Secret`.
5. Установите зависимости:

```bash
npm install
```

6. Создайте `.env` на основе `.env.example`.
7. Зарегистрируйте slash-команды:

```bash
npm run deploy-commands
```

Во время разработки укажите `DISCORD_GUILD_ID`, чтобы команды появились на одном сервере почти сразу. Без него команды регистрируются глобально и могут появляться дольше.

8. Запустите бота:

```bash
npm start
```

## Как это работает

Бот регулярно опрашивает Twitch `Get Streams` по всем подписанным логинам. Если канал стал live и этот stream id еще не был отправлен, бот пишет уведомление в подписанный Discord-канал. Когда стрим заканчивается, состояние сбрасывается, и следующий запуск стрима снова отправит уведомление.

Данные хранятся в JSON-файле `data/bot-data.json`, путь можно поменять через `DATA_FILE`.

## Запуск на VPS

Минимальный вариант через `pm2`:

```bash
npm install
npm run deploy-commands
npm install -g pm2
pm2 start src/bot.js --name notiffio-local
pm2 save
```

Для systemd лучше запускать `npm start` из папки проекта и хранить `.env` рядом с проектом или в environment-файле сервиса.

## Полезные ссылки

- Discord Application Commands: https://docs.discord.com/developers/docs/interactions/slash-commands
- Twitch Client Credentials Flow: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/
- Twitch Get Streams API: https://dev.twitch.tv/docs/api/reference/#get-streams
