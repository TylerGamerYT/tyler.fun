const TYLER_SETTINGS_KEY = "tyler.fun.settings";

const DEFAULT_SETTINGS = {
    theme: "dark",
    accent: "blue",
    animations: true,
    displayName: "Guest",
    username: "Guest",
    avatarData: "",
    bannerData: "",
    // Badge Settings
    tylerBadge: false,
    adminBadge: false,
    staffBadge: false,
    verifiedBadge: false,
    emailBadge: false,
    memberBadge: true,
    fishBadge: false,
    bannedBadge: false,
    tawsifBadge: false
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
    root.dataset.animations = settings.animations ? "on" : "off";
}

applySettings();
