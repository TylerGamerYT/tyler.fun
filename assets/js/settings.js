const TYLER_SETTINGS_KEY = "tyler.fun.settings";

const ALLOWED_ACCENTS = [
    "red", "orange", "yellow", "green", 
    "blue", "purple", "pink", "white", 
    "gray", "black"
];

const DEFAULT_SETTINGS = {
    theme: "dark",
    accent: "blue",
    animations: true,
    displayName: "Guest",
    username: "Guest",
    bio: "Just browsing. Not logged in. Don't mind me.",
    avatarData: "",
    bannerData: "",
    // Badges in updated order
    tylerBadge: false,
    fishBadge: false,
    tawsifBadge: false,
    adminBadge: false,
    staffBadge: false,
    verifiedBadge: false,
    emailBadge: false,
    memberBadge: true,
    bannedBadge: false
};

function getSettings() {
    try {
        const saved = localStorage.getItem(TYLER_SETTINGS_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        
        // Validate accent selection against supported colors
        if (parsed.accent && !ALLOWED_ACCENTS.includes(parsed.accent)) {
            parsed.accent = DEFAULT_SETTINGS.accent;
        }

        return {
            ...DEFAULT_SETTINGS,
            ...parsed
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings(settings) {
    try {
        localStorage.setItem(
            TYLER_SETTINGS_KEY,
            JSON.stringify({
                ...DEFAULT_SETTINGS,
                ...settings
            })
        );
    } catch (e) {
        console.error("Failed to save settings to localStorage:", e);
    }
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

// Initial execution
applySettings();
