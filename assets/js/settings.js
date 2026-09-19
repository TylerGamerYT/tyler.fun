const TYLER_SETTINGS_KEY = "tyler.fun.settings";

const DEFAULT_SETTINGS = {
    theme: "dark",
    accent: "blue",
    animations: true,
    memberBadge: true
};

function getSettings() {
    try {
        const saved = localStorage.getItem(TYLER_SETTINGS_KEY);
        return {
            ...DEFAULT_SETTINGS,
            ...(saved ? JSON.parse(saved) : {})
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings(settings) {
    localStorage.setItem(
        TYLER_SETTINGS_KEY,
        JSON.stringify({
            ...DEFAULT_SETTINGS,
            ...settings
        })
    );

    applySettings();
}

function updateSetting(key, value) {
    saveSettings({
        ...getSettings(),
        [key]: value
    });
}

function resetSettings() {
    localStorage.removeItem(TYLER_SETTINGS_KEY);
    applySettings();
}

function applySettings() {
    const settings = getSettings();
    const root = document.documentElement;

    root.dataset.theme = settings.theme;
    root.dataset.accent = settings.accent;

    if (settings.animations) {
        root.dataset.animations = "on";
    } else {
        root.dataset.animations = "off";
    }
}

applySettings();
