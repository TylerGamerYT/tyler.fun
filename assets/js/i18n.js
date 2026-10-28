
async function loadTranslations() {
  const locale =
    document.documentElement.dataset.locale || "en";

  if (locale === "en") return;

  try {
    const response = await fetch(`/locales/${locale}.json`);

    if (!response.ok) {
      throw new Error("Failed to load translations");
    }

    const translations = await response.json();

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const translation = translations[element.dataset.i18n];

      if (typeof translation === "string") {
        element.textContent = translation;
      }
    });
  } catch (error) {
    console.error("Translation error:", error);
  }
}

loadTranslations();
