import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_STATS
} from './constants.js';

/**
 * Chrome storage wrapper for settings and statistics
 */
class StorageManager {
  /**
   * Get settings from chrome.storage.sync
   * @returns {Promise<Object>} User settings
   */
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEYS.SETTINGS], (result) => {
        resolve(result[STORAGE_KEYS.SETTINGS] || { ...DEFAULT_SETTINGS });
      });
    });
  }

  /**
   * Save settings to chrome.storage.sync
   * @param {Object} settings - Settings to save
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: settings }, resolve);
    });
  }

  /**
   * Update specific settings fields
   * @param {Object} updates - Partial settings to update
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(updates) {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    await this.saveSettings(updated);
    return updated;
  }

  /**
   * Get statistics from chrome.storage.local
   * @returns {Promise<Object>} Usage statistics
   */
  async getStats() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.STATS], (result) => {
        resolve(result[STORAGE_KEYS.STATS] || { ...DEFAULT_STATS });
      });
    });
  }

  /**
   * Save statistics to chrome.storage.local
   * @param {Object} stats - Statistics to save
   * @returns {Promise<void>}
   */
  async saveStats(stats) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.STATS]: stats }, resolve);
    });
  }

  /**
   * Increment reply generation count
   * @param {string} platform - Platform identifier
   * @param {string} tone - Tone used
   * @returns {Promise<Object>} Updated statistics
   */
  async incrementReplyGenerated(platform, tone) {
    const stats = await this.getStats();
    stats.totalRepliesGenerated++;
    stats.repliesByPlatform[platform] = (stats.repliesByPlatform[platform] || 0) + 1;
    stats.repliesByTone[tone] = (stats.repliesByTone[tone] || 0) + 1;
    stats.lastUsed = new Date().toISOString();
    await this.saveStats(stats);
    return stats;
  }

  /**
   * Increment replies inserted count
   * @returns {Promise<Object>} Updated statistics
   */
  async incrementReplyInserted() {
    const stats = await this.getStats();
    stats.repliesInserted++;
    await this.saveStats(stats);
    return stats;
  }

  /**
   * Get API key from chrome.storage.sync
   * @returns {Promise<string|null>} API key or null
   */
  async getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEYS.API_KEY], (result) => {
        resolve(result[STORAGE_KEYS.API_KEY] || null);
      });
    });
  }

  /**
   * Save API key to chrome.storage.sync
   * @param {string} apiKey - API key to save
   * @returns {Promise<void>}
   */
  async saveApiKey(apiKey) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [STORAGE_KEYS.API_KEY]: apiKey }, resolve);
    });
  }

  /**
   * Reset statistics to defaults
   * @returns {Promise<Object>} Reset statistics
   */
  async resetStats() {
    const resetStats = { ...DEFAULT_STATS };
    await this.saveStats(resetStats);
    return resetStats;
  }

  /**
   * Reset all data (settings and stats)
   * @returns {Promise<void>}
   */
  async resetAll() {
    await Promise.all([
      this.saveSettings({ ...DEFAULT_SETTINGS }),
      this.saveStats({ ...DEFAULT_STATS }),
    ]);
  }
}

export const storage = new StorageManager();
export default storage;
