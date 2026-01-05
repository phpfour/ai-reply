import {
  PLATFORMS,
  TONES,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_USER_PROFILE,
  MESSAGES,
} from '../shared/constants.js';

/**
 * Smart Reply Options Page
 */
class OptionsManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.userProfile = { ...DEFAULT_USER_PROFILE };
    this.apiKey = '';
  }

  /**
   * Initialize the options page
   */
  async init() {
    await this.loadSettings();
    this.populateForm();
    this.attachEventListeners();
    await this.loadDebugLogs();
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      // Get settings
      const settingsResult = await chrome.storage.sync.get([STORAGE_KEYS.SETTINGS]);
      this.settings = settingsResult[STORAGE_KEYS.SETTINGS] || { ...DEFAULT_SETTINGS };

      // Get API key
      const apiKeyResult = await chrome.storage.sync.get([STORAGE_KEYS.API_KEY]);
      this.apiKey = apiKeyResult[STORAGE_KEYS.API_KEY] || '';

      // Get user profile
      const profileResult = await chrome.storage.sync.get([STORAGE_KEYS.USER_PROFILE]);
      this.userProfile = profileResult[STORAGE_KEYS.USER_PROFILE] || { ...DEFAULT_USER_PROFILE };
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * Populate form with current settings
   */
  populateForm() {
    // API Key
    document.getElementById('api-key').value = this.apiKey;

    // AI Model
    document.getElementById('ai-model').value = this.settings.selectedModel || 'gpt-5-mini';

    // Default tone
    document.getElementById('default-tone').value = this.settings.defaultTone;

    // Typing simulation
    const typingCheckbox = document.getElementById('typing-simulation');
    typingCheckbox.checked = this.settings.typingSimulation;
    this.updateTypingSpeedVisibility();

    // Typing speed
    const typingSpeed = document.getElementById('typing-speed');
    typingSpeed.value = this.settings.typingSpeed;
    this.updateTypingSpeedLabel();

    // Platforms
    document.getElementById('platform-youtube').checked =
      this.settings.enabledPlatforms[PLATFORMS.YOUTUBE];
    document.getElementById('platform-instagram').checked =
      this.settings.enabledPlatforms[PLATFORMS.INSTAGRAM];
    document.getElementById('platform-linkedin').checked =
      this.settings.enabledPlatforms[PLATFORMS.LINKEDIN];
    document.getElementById('platform-twitter').checked =
      this.settings.enabledPlatforms[PLATFORMS.TWITTER];

    // User profile
    document.getElementById('user-nickname').value = this.userProfile.nickname || '';
    document.getElementById('user-occupation').value = this.userProfile.occupation || '';
    document.getElementById('user-bio').value = this.userProfile.bio || '';
    document.getElementById('reply-style').value = this.userProfile.replyStyle || '';
    document.getElementById('custom-instructions').value = this.userProfile.customInstructions || '';
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Toggle API key visibility
    document.getElementById('toggle-key').addEventListener('click', () => {
      this.toggleApiKeyVisibility();
    });

    // Typing simulation toggle
    document.getElementById('typing-simulation').addEventListener('change', () => {
      this.updateTypingSpeedVisibility();
    });

    // Typing speed slider
    document.getElementById('typing-speed').addEventListener('input', () => {
      this.updateTypingSpeedLabel();
    });

    // Save settings
    document.getElementById('save-settings').addEventListener('click', () => {
      this.saveSettings();
    });

    // Reset settings
    document.getElementById('reset-settings').addEventListener('click', () => {
      this.resetSettings();
    });

    // Debug log refresh
    document.getElementById('refresh-logs').addEventListener('click', () => {
      this.loadDebugLogs();
    });

    // Debug log clear
    document.getElementById('clear-logs').addEventListener('click', () => {
      this.clearDebugLogs();
    });
  }

  /**
   * Toggle API key visibility
   */
  toggleApiKeyVisibility() {
    const input = document.getElementById('api-key');
    const showIcon = document.querySelector('.icon-show');
    const hideIcon = document.querySelector('.icon-hide');

    if (input.type === 'password') {
      input.type = 'text';
      showIcon.style.display = 'none';
      hideIcon.style.display = 'block';
    } else {
      input.type = 'password';
      showIcon.style.display = 'block';
      hideIcon.style.display = 'none';
    }
  }

  /**
   * Update typing speed label
   */
  updateTypingSpeedLabel() {
    const speed = document.getElementById('typing-speed').value;
    document.getElementById('typing-speed-value').textContent = `${speed}ms`;
  }

  /**
   * Update typing speed field visibility
   */
  updateTypingSpeedVisibility() {
    const isEnabled = document.getElementById('typing-simulation').checked;
    const speedField = document.getElementById('typing-speed-field');
    speedField.style.opacity = isEnabled ? '1' : '0.5';
    speedField.style.pointerEvents = isEnabled ? 'auto' : 'none';
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      // Gather settings from form
      const settings = {
        selectedModel: document.getElementById('ai-model').value,
        defaultTone: document.getElementById('default-tone').value,
        typingSimulation: document.getElementById('typing-simulation').checked,
        typingSpeed: parseInt(document.getElementById('typing-speed').value, 10),
        enabledPlatforms: {
          [PLATFORMS.YOUTUBE]: document.getElementById('platform-youtube').checked,
          [PLATFORMS.INSTAGRAM]: document.getElementById('platform-instagram').checked,
          [PLATFORMS.LINKEDIN]: document.getElementById('platform-linkedin').checked,
          [PLATFORMS.TWITTER]: document.getElementById('platform-twitter').checked,
        },
      };

      // Get API key
      const apiKey = document.getElementById('api-key').value.trim();

      // Gather user profile
      const userProfile = {
        nickname: document.getElementById('user-nickname').value.trim(),
        occupation: document.getElementById('user-occupation').value.trim(),
        bio: document.getElementById('user-bio').value.trim(),
        replyStyle: document.getElementById('reply-style').value,
        customInstructions: document.getElementById('custom-instructions').value.trim(),
      };

      // Save to storage
      await chrome.storage.sync.set({
        [STORAGE_KEYS.SETTINGS]: settings,
        [STORAGE_KEYS.API_KEY]: apiKey,
        [STORAGE_KEYS.USER_PROFILE]: userProfile,
      });

      this.settings = settings;
      this.apiKey = apiKey;
      this.userProfile = userProfile;

      this.showToast('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showToast('Failed to save settings', 'error');
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings() {
    try {
      this.settings = { ...DEFAULT_SETTINGS };
      this.userProfile = { ...DEFAULT_USER_PROFILE };

      await chrome.storage.sync.set({
        [STORAGE_KEYS.SETTINGS]: this.settings,
        [STORAGE_KEYS.USER_PROFILE]: this.userProfile,
      });

      this.populateForm();
      this.showToast('Settings reset to defaults', 'success');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      this.showToast('Failed to reset settings', 'error');
    }
  }

  /**
   * Load and display debug logs
   */
  async loadDebugLogs() {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.DEBUG_LOGS]);
      const logs = result[STORAGE_KEYS.DEBUG_LOGS] || [];
      this.renderDebugLogs(logs);
    } catch (error) {
      console.error('Failed to load debug logs:', error);
    }
  }

  /**
   * Clear all debug logs
   */
  async clearDebugLogs() {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.DEBUG_LOGS]: [] });
      this.renderDebugLogs([]);
      this.showToast('Debug logs cleared', 'success');
    } catch (error) {
      console.error('Failed to clear debug logs:', error);
      this.showToast('Failed to clear logs', 'error');
    }
  }

  /**
   * Render debug logs to the UI
   * @param {Array} logs - Array of debug log entries
   */
  renderDebugLogs(logs) {
    const container = document.getElementById('debug-log');

    if (!logs || logs.length === 0) {
      container.innerHTML = `
        <div class="options__debug-empty">
          <p>No debug logs yet. Generate a reply to see the prompts and responses.</p>
        </div>
      `;
      return;
    }

    const html = logs.map(log => {
      const time = new Date(log.timestamp).toLocaleString();
      const statusClass = log.success ? 'options__debug-success' : 'options__debug-error';
      const statusText = log.success ? 'Success' : 'Error';

      return `
        <div class="options__debug-entry">
          <div class="options__debug-header">
            <span class="options__debug-platform">${this.escapeHtml(log.platform || 'Unknown')}</span>
            <span class="options__debug-time">${time}</span>
          </div>

          <div class="options__debug-section">
            <div class="options__debug-section-title">Model</div>
            <div class="options__debug-content options__debug-model">${this.escapeHtml(log.model || 'N/A')}</div>
          </div>

          <div class="options__debug-section">
            <div class="options__debug-section-title">System Prompt</div>
            <div class="options__debug-content">${this.escapeHtml(log.systemPrompt || 'N/A')}</div>
          </div>

          <div class="options__debug-section">
            <div class="options__debug-section-title">User Prompt</div>
            <div class="options__debug-content">${this.escapeHtml(log.userPrompt || 'N/A')}</div>
          </div>

          <div class="options__debug-section">
            <div class="options__debug-section-title">Response <span class="${statusClass}">(${statusText})</span></div>
            <div class="options__debug-content">${this.escapeHtml(log.error || log.response || 'N/A')}</div>
          </div>

          ${log.suggestions ? `
          <div class="options__debug-section">
            <div class="options__debug-section-title">Parsed Suggestions</div>
            <div class="options__debug-content">${log.suggestions.map((s, i) => `${i + 1}. ${this.escapeHtml(s)}`).join('\n')}</div>
          </div>
          ` : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {string} type - Toast type (success/error)
   */
  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `options__toast options__toast--${type} show`;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

// Initialize options page
document.addEventListener('DOMContentLoaded', () => {
  const options = new OptionsManager();
  options.init();
});
