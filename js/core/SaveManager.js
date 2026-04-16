/**
 * SaveManager - 存档管理器
 * 基于 LocalStorage 实现游戏存档的读写
 */
const SAVE_KEY = 'kpl_legend_save';
const SETTINGS_KEY = 'kpl_legend_settings';

export class SaveManager {
    static save(data) {
        try {
            const payload = {
                version: 1,
                timestamp: Date.now(),
                data
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
            return true;
        } catch (e) {
            console.error('[SaveManager] Save failed:', e);
            return false;
        }
    }

    static load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;
            const payload = JSON.parse(raw);
            return payload.data || null;
        } catch (e) {
            console.error('[SaveManager] Load failed:', e);
            return null;
        }
    }

    static hasSave() {
        return localStorage.getItem(SAVE_KEY) !== null;
    }

    static deleteSave() {
        localStorage.removeItem(SAVE_KEY);
    }

    static saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('[SaveManager] Settings save failed:', e);
        }
    }

    static loadSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            return raw ? JSON.parse(raw) : { bgmVolume: 0.5, sfxVolume: 0.7 };
        } catch (e) {
            return { bgmVolume: 0.5, sfxVolume: 0.7 };
        }
    }
}
