const TYLER_SETTINGS_KEY = "tyler.fun.settings";

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

// Initial apply call on load
applySettings();

// UI Bindings for settings.html
document.addEventListener("DOMContentLoaded", () => {
    const settingsForm = document.getElementById("settingsForm");
    if (!settingsForm) return;

    const currentSettings = getSettings();

    // Populate UI elements with current settings values
    const inputs = settingsForm.querySelectorAll("[data-setting]");
    inputs.forEach((input) => {
        const key = input.dataset.setting;
        if (input.type === "checkbox") {
            input.checked = Boolean(currentSettings[key]);
        } else {
            input.value = currentSettings[key] ?? "";
        }
    });

    // Handle saving form
    settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const updated = { ...getSettings() };

        inputs.forEach((input) => {
            const key = input.dataset.setting;
            if (input.type === "checkbox") {
                updated[key] = input.checked;
            } else {
                updated[key] = input.value;
            }
        });

        saveSettings(updated);

        const statusMsg = document.getElementById("statusMessage");
        if (statusMsg) {
            statusMsg.style.display = "block";
            setTimeout(() => {
                statusMsg.style.display = "none";
            }, 2500);
        }
    });

    // Handle reset button
    const resetBtn = document.getElementById("resetSettingsBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            resetSettings();
            location.reload();
        });
    }
});
