# Notiffio Local

Локальный Discord-бот для уведомлений о старте стрима на Twitch. Работает через slash-команды Discord и polling Twitch Helix API, поэтому его можно запускать дома или на арендованном VPS без публичного webhook.

## Возможности

- `/twitch-subscribe streamer:<логин>` - подписать текущий Discord-канал на Twitch-канал.
- `/twitch-subscribe streamer:<логин> discord_channel:<канал>` - подписать выбранный канал.
- `/twitch-subscribe streamer:<логин> category:<категории>` - получать уведомления только если стрим запущен в одной из категорий через запятую.
- `/twitch-subscribe streamer:<логин> exclude_category:<категории>` - получать уведомления по всем категориям, кроме указанных через запятую.
- `/twitch-unsubscribe streamer:<логин>` - удалить подписку.
- `/twitch-edit streamer:<логин>` - редактировать существующую подписку в текущем канале.
- `/twitch-edit streamer:<логин> category:<категории>` - заменить список разрешенных категорий.
- `/twitch-edit streamer:<логин> exclude_category:<категории>` - заменить список исключенных категорий.
- `/twitch-edit streamer:<логин> clear_filters:true` - убрать фильтры категорий.
- `/twitch-edit streamer:<логин> new_discord_channel:<канал>` - перенести подписку в другой канал.
- `/twitch-edit streamer:<логин> notification_mode:<text|embed|both>` - задать стиль уведомления для подписки.
- `/twitch-edit streamer:<логин> notify_category_changes:false` - отключить уведомления при смене категории для подписки.
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
- `/twitch-style show` - показать стиль уведомлений сервера.
- `/twitch-style set notification_mode:<text|embed|both>` - выбрать стиль уведомлений.
- `/twitch-style category_changes enabled:false` - отключить уведомления при смене категории на сервере.

Поддерживаемые плейсхолдеры в шаблоне:

```text
{streamer} {title} {game} {url} {viewers} {started_at} {channel}
```

Для переноса строки в slash-команде используйте `\n`:

```text
@everyone {streamer} вышел в эфир!\nНазвание: {title}\nКатегория: {game}\n{url}
```

Пример:

```text
{streamer} вышел в эфир!
{title}
Категория: {game}
{url}
```

Пример подписки только на Beat Saber и Synth Riders:

```text
/twitch-subscribe streamer:somechannel category:Beat Saber, Synth Riders discord_channel:#streams
```

Если стример запустит Minecraft или другую категорию, уведомление по такой подписке отправлено не будет.

Пример двух каналов для одного стримера:

```text
/twitch-subscribe streamer:somechannel category:Beat Saber discord_channel:#beat-saber
/twitch-subscribe streamer:somechannel exclude_category:Beat Saber, Synth Riders discord_channel:#other-streams
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

## Стиль уведомлений

По умолчанию бот отправляет обычный текстовый шаблон. Можно включить embed-карточку:

```text
/twitch-style set notification_mode:embed
```

Или два сообщения сразу: сначала текстовый шаблон, потом embed-карточка с названием стрима, категорией, зрителями и превью:

```text
/twitch-style set notification_mode:both
```

Для одной конкретной подписки:

```text
/twitch-edit streamer:somechannel notification_mode:both
```

Embed-карточка показывает стримера крупным заголовком, кликабельное название стрима, категорию, зрителей, превью и кнопку `Смотреть на Twitch`.

Уведомления при смене категории можно отключить на весь сервер:

```text
/twitch-style category_changes enabled:false
```

Или только на одну подписку:

```text
/twitch-edit streamer:somechannel notify_category_changes:false
```

## Защита от дублей

Бот не отправляет одно и то же уведомление повторно после рестарта. Если стример завершил стрим и перезапустил его в той же категории в течение 10 минут, уведомление не отправится повторно.

Если категория изменилась во время стрима или новый стрим запущен уже в другой категории, бот отправит новое уведомление в подходящие подписки.

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

1. Установите Node.js 22 LTS или новее. Совместимость с Node.js 20 сохранена, но эта версия уже не получает обновлений безопасности.
2. Создайте Discord-приложение и бота в Discord Developer Portal.
3. Пригласите бота на сервер со scopes `bot` и `applications.commands`; из прав минимум нужны `Send Messages` и `View Channels`.
4. Создайте Twitch-приложение в Twitch Developer Console и получите `Client ID` и `Client Secret`.
5. Установите зависимости:

```bash
npm ci
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

## Запуск в Docker

1. Создайте `.env` на основе `.env.example`.
2. Загрузите и запустите контейнер версии 1.2.2:

```bash
docker compose pull
docker compose up -d
```

3. Зарегистрируйте slash-команды (один раз после первого запуска или при изменении команд):

```bash
docker compose run --rm notiffio npm run deploy-commands
```

4. Просмотр логов:

```bash
docker compose logs -f notiffio
```

`docker-compose.yml` монтирует локальную папку `./data` в контейнер (`/app/data`), поэтому подписки и статистика сохраняются между перезапусками.

## Обновление до 1.2.2

Сохраните существующие `.env`, папку данных и настройки volumes. Перед обновлением сделайте резервную копию `data/bot-data.json`. В своём compose-файле измените только образ на `ghcr.io/deadcxap/bee-notiffio:1.2.2`, затем выполните:

```bash
docker compose pull notiffio
docker compose up -d notiffio
```

Миграция данных и повторная регистрация slash-команд не нужны. Подписки, фильтры категорий, личные и серверные шаблоны, язык, стиль, статистика и защита от повторных уведомлений сохраняются. Новый блок `runtime` содержит только состояние мониторинга; версия 1.2.1 его игнорирует, поэтому можно вернуть прежний тег образа без преобразования файла данных.

В старых compose-файлах встречается явный `HEALTHCHECK_MAX_POLL_LAG_SECONDS: 240`. Он продолжает работать и имеет приоритет над `.env`. Если увеличиваете интервал опроса, увеличьте этот порог или уберите его из compose, чтобы использовался автоматический расчёт. Старые теги образов, включая `1.0`, остаются закреплены за прежними выпусками.

## Мониторинг и healthcheck контейнера

Бот записывает runtime-статус в свой `DATA_FILE` (по умолчанию `data/bot-data.json`): `runtime.startedAt`, `runtime.firstPollDueAt`, `runtime.lastPollStartedAt`, `runtime.lastPollSucceededAt`, `runtime.lastPollFailedAt`, `runtime.lastPollError`. Статус сбрасывается при запуске, чтобы успех предыдущего процесса не скрывал проблему нового.

В Docker-образ добавлен `HEALTHCHECK`, который проверяет:
- что был хотя бы один успешный polling Twitch;
- что с момента последнего успешного polling прошло не больше порога `HEALTHCHECK_MAX_POLL_LAG_SECONDS`;
- что последняя попытка polling не завершилась ошибкой после последнего успеха.

Цикл без подписок тоже считается успешным. При ошибке Twitch, отправки уведомления или сохранения данных бот записывает ошибку, а следующий успешный цикл очищает её. При `SKIP_INITIAL_POLL=true` проверка допускает ожидание первого запланированного опроса после подключения к Discord.

Проверка статуса:

```bash
docker inspect --format='{{.State.Health.Status}}' notiffio
docker inspect --format='{{json .State.Health.Log}}' notiffio | jq
```

По умолчанию порог равен `max(180, POLL_INTERVAL_SECONDS * 3)` секунд. Его можно переопределить через `HEALTHCHECK_MAX_POLL_LAG_SECONDS` в `.env` или environment контейнера; значение должно быть положительным конечным числом.

При запуске без Docker доступна та же проверка: `npm run healthcheck`. Она читает `.env` и тот же `DATA_FILE`, что и бот. Docker помечает контейнер как `unhealthy` после трёх неудачных проверок; сам по себе этот статус не перезапускает контейнер через `restart: unless-stopped`.

## CI/CD контейнера (GitHub Actions)

В репозитории добавлен workflow `.github/workflows/docker-image.yml`, который:

- собирает multi-arch образ (`linux/amd64`, `linux/arm64`);
- перед сборкой запускает тесты на Node.js 20 и 22;
- публикует образ в GitHub Container Registry: `ghcr.io/<owner>/bee-notiffio`;
- на push в ветки обновляет branch-теги и тег `dev` для default-ветки;
- на PR собирает и (для PR из этого же репозитория) публикует `pr-<номер>` теги;
- на push тега формата `vX.Y.Z` публикует версии (`X.Y.Z`, `X.Y`) и `latest`.

Пример запуска из GHCR:

```bash
docker run -d   --name notiffio   --restart unless-stopped   --env-file .env   -v $(pwd)/data:/app/data   ghcr.io/<owner>/bee-notiffio:latest
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
