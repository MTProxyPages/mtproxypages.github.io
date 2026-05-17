/** Настройки сайта — редактируйте этот файл */
const SITE_CONFIG = {
  title: "MTProxy для Telegram",

  proxySections: [
    {
      id: "ru",
      label: "RU",
      url: "https://raw.githubusercontent.com/kort0881/telegram-proxy-collector/main/proxy_ru.txt",
    },
    {
      id: "eu",
      label: "Глобальные",
      url: "https://raw.githubusercontent.com/kort0881/telegram-proxy-collector/main/proxy_eu.txt",
    },
    {
      id: "all",
      label: "Все",
      url: "https://raw.githubusercontent.com/kort0881/telegram-proxy-collector/main/proxy_all.txt",
    },
  ],

  /** Ссылки внизу страницы: github | telegram */
  footerLinks: [
    {
      type: "github",
      href: "https://github.com/MTProxyPages",
      title: "Этот сайт на GitHub",
    },
    {
      type: "telegram",
      href: "https://t.me/LittleTapeProject",
      title: "Little Tape — Telegram",
    },
  ],
};
