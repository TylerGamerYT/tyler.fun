
async function loadTranslations() {
  const locale =
    document.documentElement.dataset.locale || "en";

  if (locale === "en") return;

  try {
    const response = await fetch(
      `/locales/${locale}.json`
    );

    if (!response.ok) {
      throw new Error("Could not load translations");
    }

    const translations = await response.json();

    document.querySelectorAll("[data-i18n]")
      .forEach((element) => {
        const key = element.dataset.i18n;
        const translated = translations[key];

        if (typeof translated === "string") {
          element.textContent = translated;
        }
      });
  } catch (error) {
    console.error("Translation loading failed:", error);
  }
}

loadTranslations();
