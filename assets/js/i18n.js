/*
 * Lightweight i18n for tyler.fun.
 *
 * English is the default language and lives directly in the page markup, so it
 * doubles as the fallback: if a locale file can't be loaded, or doesn't contain
 * a key, the original English text is simply left untouched.
 *
 * Markup hooks:
 *   data-i18n="key"              -> replaces the element's text
 *   data-i18n-placeholder="key"  -> replaces the placeholder attribute
 *   data-i18n-title="key"        -> replaces the title attribute
 *
 * Scripts can use window.i18n.t(key, fallback) for dynamic strings and
 * window.i18n.ready (a promise that never rejects) to wait for translations.
 *
 * The chosen language is stored in the shared settings object
 * ("tyler.fun.settings" -> language) by settings.js. It is read here directly
 * as well, so pages that don't load settings.js (login, signup) still work.
 */
(function () {
  const SETTINGS_KEY = "tyler.fun.settings";
  const DEFAULT_LOCALE = "en";
  const SUPPORTED_LOCALES = ["en", "fr", "es"];

  const root = document.documentElement;
  let dictionary = {};

  function resolveLocale() {
    let locale = root.dataset.locale;

    if (!locale) {
      try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
        locale = saved.language;
      } catch {
        locale = DEFAULT_LOCALE;
      }
    }

    return SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  }

  const locale = resolveLocale();
  root.dataset.locale = locale;
  root.lang = locale;

  // Returns the translation for `key`, or `fallback` (the default-language
  // text) when the key is missing or empty.
  function t(key, fallback = "") {
    const value = dictionary[key];
    return typeof value === "string" && value.trim() !== "" ? value : fallback;
  }

  function applyTranslations(scope = document) {
    const targets = [
      ["data-i18n", (el, text) => { el.textContent = text; }],
      ["data-i18n-placeholder", (el, text) => el.setAttribute("placeholder", text)],
      ["data-i18n-title", (el, text) => el.setAttribute("title", text)]
    ];

    for (const [attribute, apply] of targets) {
      scope.querySelectorAll(`[${attribute}]`).forEach((element) => {
        const text = t(element.getAttribute(attribute));

        // Missing translation: keep the existing default-language text.
        if (text) apply(element, text);
      });
    }
  }

  async function loadTranslations() {
    if (locale === DEFAULT_LOCALE) return;

    try {
      const response = await fetch(`/locales/${locale}.json`);

      if (!response.ok) {
        throw new Error(`Failed to load translations (${response.status})`);
      }

      dictionary = await response.json();
      applyTranslations();
    } catch (error) {
      // Fall back to the default language already in the markup.
      console.error("Translation error:", error);
    }
  }

  window.i18n = {
    locale,
    t,
    apply: applyTranslations,
    ready: loadTranslations()
  };
})();
