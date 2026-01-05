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
