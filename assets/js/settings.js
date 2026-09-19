// Default settings object
const DEFAULT_SETTINGS = {
    displayName: "Guest",
    username: "Guest",
    bio: "Just browsing. Not logged in. Don't mind me.",
    theme: "dark",
    accent: "blue",
    animations: true,
    tylerBadge: false,
    fishBadge: false,
    tawsifBadge: false,
    adminBadge: false,
    staffBadge: false,
    verifiedBadge: false,
    emailBadge: false,
    memberBadge: false,
    bannedBadge: false,
    avatarData: null,
    bannerData: null
};

// Get settings from LocalStorage
window.getSettings = function () {
    try {
        const saved = localStorage.getItem("tyler_settings");
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
        console.error("Error reading settings:", e);
        return { ...DEFAULT_SETTINGS };
    }
};

// Save a specific key/value pair
window.updateSetting = function (key, value) {
    try {
        const current = window.getSettings();
        current[key] = value;
        localStorage.setItem("tyler_settings", JSON.stringify(current));
    } catch (e) {
        console.error("Error saving setting:", e);
    }
};

// Reset settings to default
window.resetSettings = function () {
    try {
        localStorage.removeItem("tyler_settings");
    } catch (e) {
        console.error("Error resetting settings:", e);
    }
};
