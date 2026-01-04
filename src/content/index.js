import { PLATFORMS, TONES, MESSAGES } from '../shared/constants.js';
import storage from '../shared/storage.js';
import { YouTubePlatform } from './platforms/youtube.js';
import { InstagramPlatform } from './platforms/instagram.js';
import { LinkedInPlatform } from './platforms/linkedin.js';
import { TwitterPlatform } from './platforms/twitter.js';
import { SmartReplyPopup } from './ui/popup.js';
import { insertText } from './utils/typing.js';

/**
 * Smart Reply Content Script
 * Main entry point for the content script
 */
class SmartReplyApp {
  constructor() {
    this.platform = null;
    this.popup = null;
    this.settings = null;
    this.currentTriggerButton = null;
    this.lastUrl = window.location.href;

    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.handleInsert = this.handleInsert.bind(this);
    this.handleRegenerate = this.handleRegenerate.bind(this);
  }

  /**
   * Initialize the application
   */
  async init() {
    // Detect platform
    const platformId = this.detectPlatform();
    if (!platformId) {
      console.log('Smart Reply: Unsupported platform');
      return;
    }

    // Load settings
    this.settings = await this.loadSettings();

    // Check if platform is enabled
    if (!this.settings.enabledPlatforms[platformId]) {
      console.log(`Smart Reply: ${platformId} is disabled`);
      return;
    }

    // Initialize platform handler
    this.platform = this.createPlatformHandler(platformId);
    if (!this.platform) {
      console.error('Smart Reply: Failed to create platform handler');
      return;
    }

    // Initialize popup
    this.popup = new SmartReplyPopup();

    // Initialize platform with button click handler
    this.platform.init(this.handleButtonClick);

    // Handle SPA navigation
    this.setupNavigationListener();

    console.log(`Smart Reply: Initialized for ${platformId}`);
  }

  /**
   * Detect the current platform based on hostname
   * @returns {string|null}
   */
  detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();

    if (hostname.includes('youtube.com')) {
      return PLATFORMS.YOUTUBE;
    }
    if (hostname.includes('instagram.com')) {
      return PLATFORMS.INSTAGRAM;
    }
    if (hostname.includes('linkedin.com')) {
      return PLATFORMS.LINKEDIN;
    }
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return PLATFORMS.TWITTER;
    }

    return null;
  }

  /**
   * Create platform handler based on platform ID
   * @param {string} platformId - Platform identifier
   * @returns {BasePlatform|null}
   */
  createPlatformHandler(platformId) {
    switch (platformId) {
      case PLATFORMS.YOUTUBE:
        return new YouTubePlatform();
      case PLATFORMS.INSTAGRAM:
        return new InstagramPlatform();
      case PLATFORMS.LINKEDIN:
        return new LinkedInPlatform();
      case PLATFORMS.TWITTER:
        return new TwitterPlatform();
      default:
        return null;
    }
  }

  /**
   * Load settings from storage
   * @returns {Promise<Object>}
   */
  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGES.GET_SETTINGS,
      });
      return response.settings;
    } catch (error) {
      console.error('Smart Reply: Failed to load settings', error);
      return {
        defaultTone: TONES.AUTO,
        enabledPlatforms: {
          [PLATFORMS.YOUTUBE]: true,
          [PLATFORMS.INSTAGRAM]: true,
          [PLATFORMS.LINKEDIN]: true,
          [PLATFORMS.TWITTER]: true,
        },
        typingSimulation: true,
        typingSpeed: 50,
      };
    }
  }

  /**
   * Set up listener for SPA navigation
   */
  setupNavigationListener() {
    // Handle popstate (back/forward)
    window.addEventListener('popstate', () => {
      this.handleNavigation();
    });

    // Handle pushState/replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleNavigation();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handleNavigation();
    };

    // Periodic check for URL changes (fallback)
    setInterval(() => {
      if (window.location.href !== this.lastUrl) {
        this.lastUrl = window.location.href;
        this.handleNavigation();
      }
    }, 1000);
  }

  /**
   * Handle navigation changes
   */
  handleNavigation() {
    this.lastUrl = window.location.href;

    // Close popup if open
    if (this.popup?.isOpen()) {
      this.popup.hide();
    }

    // Re-scan for inputs
    if (this.platform) {
      setTimeout(() => {
        this.platform.onRouteChange();
      }, 500);
    }
  }

  /**
   * Handle trigger button click
   * @param {HTMLElement} button - Trigger button
   * @param {HTMLElement} targetInput - Target input element
   * @param {Object} context - Context for reply generation
   */
  async handleButtonClick(button, targetInput, context) {
    // Close popup if clicking the same button
    if (this.popup?.isOpen() && this.currentTriggerButton === button) {
      this.popup.hide();
      this.currentTriggerButton = null;
      return;
    }

    this.currentTriggerButton = button;

    // Show popup
    this.popup.show(button, targetInput, context, {
      onInsert: this.handleInsert,
      onRegenerate: this.handleRegenerate,
    });

    // Generate replies
    await this.generateReplies(context, this.settings.defaultTone);
  }

  /**
   * Handle insert reply
   * @param {string} text - Reply text to insert
   * @param {HTMLElement} targetInput - Target input element
   */
  async handleInsert(text, targetInput) {
    if (!targetInput || !text) return;

    const useSimulation = this.platform?.requiresTypingSimulation() &&
                          this.settings.typingSimulation;

    const success = await insertText(targetInput, text, {
      simulate: useSimulation,
      speed: this.settings.typingSpeed,
    });

    if (success) {
      // Update stats
      try {
        await chrome.runtime.sendMessage({
          type: MESSAGES.UPDATE_STATS,
          action: 'incrementInserted',
        });
      } catch (error) {
        console.error('Smart Reply: Failed to update stats', error);
      }
    }
  }

  /**
   * Handle regenerate request
   * @param {Object} context - Context for reply generation
   * @param {string} tone - Selected tone
   */
  async handleRegenerate(context, tone) {
    await this.generateReplies(context, tone);
  }

  /**
   * Generate replies using the background script
   * @param {Object} context - Context for reply generation
   * @param {string} tone - Selected tone
   */
  async generateReplies(context, tone) {
    try {
      this.popup.setLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: MESSAGES.GENERATE_REPLIES,
        context,
        tone,
      });

      if (response.success) {
        this.popup.setSuggestions(response.suggestions);
      } else {
        if (response.suggestions && response.suggestions.length > 0) {
          // Show fallback suggestions with warning
          this.popup.setSuggestions(response.suggestions);
        } else {
          this.popup.setError(response.error || 'Failed to generate replies');
        }
      }
    } catch (error) {
      console.error('Smart Reply: Error generating replies', error);
      this.popup.setError('Failed to communicate with extension. Please try again.');
    }
  }

  /**
   * Clean up the application
   */
  destroy() {
    if (this.platform) {
      this.platform.destroy();
    }
    if (this.popup) {
      this.popup.hide();
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new SmartReplyApp();
    app.init();
  });
} else {
  const app = new SmartReplyApp();
  app.init();
}
