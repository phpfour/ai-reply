import { PLATFORMS, TONES, TONE_LABELS, MESSAGES } from '../shared/constants.js';

/**
 * Smart Reply Extension Popup
 * Shows usage statistics and quick actions
 */
class PopupManager {
  constructor() {
    this.stats = null;
  }

  /**
   * Initialize the popup
   */
  async init() {
    await this.loadStats();
    this.render();
    this.attachEventListeners();
  }

  /**
   * Load statistics from storage
   */
  async loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGES.GET_STATS,
      });
      this.stats = response.stats;
    } catch (error) {
      console.error('Failed to load stats:', error);
      this.stats = {
        totalRepliesGenerated: 0,
        repliesByPlatform: {},
        repliesByTone: {},
        repliesInserted: 0,
      };
    }
  }

  /**
   * Render the statistics
   */
  render() {
    // Update total stats
    document.getElementById('total-generated').textContent =
      this.stats.totalRepliesGenerated.toLocaleString();
    document.getElementById('total-inserted').textContent =
      this.stats.repliesInserted.toLocaleString();

    // Render platform stats
    this.renderPlatformStats();

    // Render tone stats
    this.renderToneStats();
  }

  /**
   * Render platform statistics bars
   */
  renderPlatformStats() {
    const container = document.getElementById('platform-stats');
    const platformLabels = {
      [PLATFORMS.YOUTUBE]: 'YouTube',
      [PLATFORMS.INSTAGRAM]: 'Instagram',
      [PLATFORMS.LINKEDIN]: 'LinkedIn',
      [PLATFORMS.TWITTER]: 'X (Twitter)',
    };

    const platformData = this.stats.repliesByPlatform || {};
    const maxValue = Math.max(...Object.values(platformData), 1);

    container.innerHTML = Object.entries(platformLabels)
      .map(([key, label]) => {
        const value = platformData[key] || 0;
        const percentage = (value / maxValue) * 100;

        return `
          <div class="popup__chart-bar popup__chart-bar--${key}">
            <div class="popup__chart-bar-label">${label}</div>
            <div class="popup__chart-bar-track">
              <div class="popup__chart-bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="popup__chart-bar-value">${value}</div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * Render tone statistics bars
   */
  renderToneStats() {
    const container = document.getElementById('tone-stats');
    const toneData = this.stats.repliesByTone || {};
    const maxValue = Math.max(...Object.values(toneData), 1);

    container.innerHTML = Object.entries(TONE_LABELS)
      .map(([key, label]) => {
        const value = toneData[key] || 0;
        const percentage = (value / maxValue) * 100;

        return `
          <div class="popup__chart-bar popup__chart-bar--${key}">
            <div class="popup__chart-bar-label">${label}</div>
            <div class="popup__chart-bar-track">
              <div class="popup__chart-bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="popup__chart-bar-value">${value}</div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Open options
    document.getElementById('open-options').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Reset stats
    document.getElementById('reset-stats').addEventListener('click', () => {
      this.showResetConfirmation();
    });
  }

  /**
   * Show reset confirmation modal
   */
  showResetConfirmation() {
    const modal = document.createElement('div');
    modal.className = 'popup__modal';
    modal.innerHTML = `
      <div class="popup__modal-content">
        <div class="popup__modal-title">Reset Statistics?</div>
        <div class="popup__modal-message">
          This will permanently delete all your usage statistics. This action cannot be undone.
        </div>
        <div class="popup__modal-actions">
          <button class="popup__modal-btn popup__modal-btn--cancel">Cancel</button>
          <button class="popup__modal-btn popup__modal-btn--confirm">Reset</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.popup__modal-btn--cancel').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('.popup__modal-btn--confirm').addEventListener('click', async () => {
      await this.resetStats();
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Reset statistics
   */
  async resetStats() {
    try {
      await chrome.storage.local.set({
        smartReplyStats: {
          totalRepliesGenerated: 0,
          repliesByPlatform: {
            [PLATFORMS.YOUTUBE]: 0,
            [PLATFORMS.INSTAGRAM]: 0,
            [PLATFORMS.LINKEDIN]: 0,
            [PLATFORMS.TWITTER]: 0,
          },
          repliesByTone: {
            [TONES.AUTO]: 0,
            [TONES.FRIENDLY]: 0,
            [TONES.HUMOROUS]: 0,
            [TONES.ENGAGING]: 0,
          },
          repliesInserted: 0,
          lastUsed: null,
        },
      });

      await this.loadStats();
      this.render();
    } catch (error) {
      console.error('Failed to reset stats:', error);
    }
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  const popup = new PopupManager();
  popup.init();
});
