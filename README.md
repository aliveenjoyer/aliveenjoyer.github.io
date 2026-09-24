# Сайт сервера AliveEnjoyer

Сезонный Minecraft-сервер AliveEnjoyer, модератора Twitch-каналов sashawaify, QissMe_, skipsleeps, aiihosh1no и ezdok_nakomaze. Discord: https://discord.gg/sashawaify

- Сезон 2 «Echoes in the Sky»: Minecraft 1.21.1, сборка на основе Craftoria, 1–21 октября 2026. Главная страница и карта сезона (`season2-map.html`).
- Сезон 1 «Whispers in the Void»: хоррор-сборка на Minecraft 1.20.1, 11–19 сентября 2026. Архив на главной и итоги (`season1.html`).

Сайт: https://aliveenjoyer.github.io/ (старый адрес mikolakiyv.github.io/whispers-in-the-void переадресует сюда)

Картинки построек первого сезона отрисованы изометрическим рендером из настоящего мира сервера, скриншоты сделаны в игре. Форма заявки отправляет данные на API сервера (`app.js`, константа `API`), карта сезона берёт прогресс оттуда же (`roadmap.js`).

Счётчик посещений (`stat.js`): один маленький запрос на наш же сервер при открытии страницы, без cookies и сторонних счётчиков; сервер хранит не IP, а суточный хеш. Не считать свой браузер: открыть сайт с `?nostat=1` (вернуть — `?nostat=0`).
