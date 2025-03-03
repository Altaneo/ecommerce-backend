const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const path = require("path");
const middleware = require("i18next-http-middleware");

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    backend: {
        loadPath: path.join(__dirname, "locales/{{lng}}.json"),
      },
    detection: {
      order: ["querystring", "cookie", "header"],
      caches: ["cookie"],
    },
  });

module.exports = i18next;
