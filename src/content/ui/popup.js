import { UI_CONFIG, TONES, TONE_LABELS, MESSAGES } from '../../shared/constants.js';
import { calculatePopupPosition } from '../utils/dom.js';

/**
 * Draggable popup component for Smart Reply
 */
export class SmartReplyPopup {
  constructor() {
    this.element = null;
    this.isVisible = false;
    this.isDragging = false;
    this.currentTone = TONES.AUTO;
    this.suggestions = [];
    this.isLoading = false;
    this.error = null;
    this.targetInput = null;
    this.context = null;
    this.onInsert = null;
    this.onRegenerate = null;
    this.dragOffset = { x: 0, y: 0 };
    this.position = { top: 0, left: 0 };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
  }

  /**
   * Create the popup element
   * @returns {HTMLElement}
   */
  createElement() {
    const popup = document.createElement('div');
    popup.className = UI_CONFIG.POPUP_CLASS;
    popup.id = UI_CONFIG.POPUP_ID;
    popup.innerHTML = this.getTemplate();

    // Add event listeners
    this.attachEventListeners(popup);

    return popup;
  }

  /**
   * Get the popup HTML template
   * @returns {string}
   */
  getTemplate() {
    return `
      <div class="smart-reply-popup__header">
        <div class="smart-reply-popup__title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>Smart Reply</span>
        </div>
        <button class="smart-reply-popup__close" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="smart-reply-popup__tones">
        ${this.getToneButtons()}
      </div>
      <div class="smart-reply-popup__content">
        ${this.getContentTemplate()}
      </div>
      <div class="smart-reply-popup__footer">
        <span>Powered by AI</span>
        <button class="smart-reply-popup__regenerate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Regenerate
        </button>
      </div>
    `;
  }

  /**
   * Get tone buttons HTML
   * @returns {string}
   */
  getToneButtons() {
    return Object.entries(TONE_LABELS)
      .map(([value, label]) => `
        <button
          class="smart-reply-popup__tone ${value === this.currentTone ? 'active' : ''}"
          data-tone="${value}"
        >
          ${label}
        </button>
      `)
      .join('');
  }

  /**
   * Get content template based on state
   * @returns {string}
   */
  getContentTemplate() {
    if (this.isLoading) {
      return `
        <div class="smart-reply-popup__loading">
          <div class="smart-reply-popup__spinner"></div>
          <span>Generating replies...</span>
        </div>
      `;
    }

    if (this.error) {
      return `
        <div class="smart-reply-popup__error">
          <svg class="smart-reply-popup__error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div class="smart-reply-popup__error-message">${this.error}</div>
          <button class="smart-reply-popup__retry">Try Again</button>
        </div>
      `;
    }

    if (this.suggestions.length === 0) {
      return `
        <div class="smart-reply-popup__loading">
          <div class="smart-reply-popup__spinner"></div>
          <span>Generating replies...</span>
        </div>
      `;
    }

    return this.suggestions
      .map((suggestion, index) => `
        <div class="smart-reply-popup__suggestion" data-index="${index}">
          <div class="smart-reply-popup__suggestion-text">${this.escapeHtml(suggestion)}</div>
          <div class="smart-reply-popup__suggestion-actions">
            <button class="smart-reply-popup__suggestion-btn smart-reply-popup__suggestion-btn--copy" data-action="copy" data-index="${index}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </button>
            <button class="smart-reply-popup__suggestion-btn smart-reply-popup__suggestion-btn--insert" data-action="insert" data-index="${index}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              Insert
            </button>
          </div>
        </div>
      `)
      .join('');
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string}
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Attach event listeners to popup
   * @param {HTMLElement} popup - Popup element
   */
  attachEventListeners(popup) {
    // Close button
    const closeBtn = popup.querySelector('.smart-reply-popup__close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Header for dragging
    const header = popup.querySelector('.smart-reply-popup__header');
    header?.addEventListener('mousedown', this.handleDragStart);

    // Tone buttons
    popup.addEventListener('click', (e) => {
      const toneBtn = e.target.closest('.smart-reply-popup__tone');
      if (toneBtn) {
        const tone = toneBtn.dataset.tone;
        this.setTone(tone);
      }
    });

    // Suggestion actions
    popup.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('.smart-reply-popup__suggestion-btn');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const index = parseInt(actionBtn.dataset.index, 10);
        this.handleSuggestionAction(action, index, actionBtn);
      }

      // Click on suggestion card to insert
      const suggestionCard = e.target.closest('.smart-reply-popup__suggestion');
      if (suggestionCard && !actionBtn) {
        const index = parseInt(suggestionCard.dataset.index, 10);
        this.handleSuggestionAction('insert', index);
      }
    });

    // Retry button
    popup.addEventListener('click', (e) => {
      if (e.target.closest('.smart-reply-popup__retry')) {
        this.regenerate();
      }
    });

    // Regenerate button
    popup.addEventListener('click', (e) => {
      if (e.target.closest('.smart-reply-popup__regenerate')) {
        this.regenerate();
      }
    });
  }

  /**
   * Handle suggestion action (copy/insert)
   * @param {string} action - Action type
   * @param {number} index - Suggestion index
   * @param {HTMLElement} button - Button element
   */
  async handleSuggestionAction(action, index, button = null) {
    const suggestion = this.suggestions[index];
    if (!suggestion) return;

    if (action === 'copy') {
      await navigator.clipboard.writeText(suggestion);
      if (button) {
        button.classList.add('smart-reply-popup__suggestion-btn--copied');
        button.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Copied!
        `;
        setTimeout(() => {
          button.classList.remove('smart-reply-popup__suggestion-btn--copied');
          button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          `;
        }, 1500);
      }
    } else if (action === 'insert') {
      if (this.onInsert) {
        await this.onInsert(suggestion, this.targetInput);
        this.hide();
      }
    }
  }

  /**
   * Set the current tone and regenerate
   * @param {string} tone - Tone value
   */
  setTone(tone) {
    if (tone === this.currentTone) return;

    this.currentTone = tone;

    // Update active state
    const tones = this.element?.querySelectorAll('.smart-reply-popup__tone');
    tones?.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tone === tone);
    });

    // Regenerate with new tone
    this.regenerate();
  }

  /**
   * Regenerate suggestions
   */
  regenerate() {
    if (this.onRegenerate) {
      this.setLoading(true);
      this.onRegenerate(this.context, this.currentTone);
    }
  }

  /**
   * Handle drag start
   * @param {MouseEvent} e - Mouse event
   */
  handleDragStart(e) {
    if (e.target.closest('.smart-reply-popup__close')) return;

    this.isDragging = true;
    this.element?.classList.add('smart-reply-popup--dragging');

    const rect = this.element.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    document.addEventListener('mousemove', this.handleDrag);
    document.addEventListener('mouseup', this.handleDragEnd);
  }

  /**
   * Handle drag
   * @param {MouseEvent} e - Mouse event
   */
  handleDrag(e) {
    if (!this.isDragging || !this.element) return;

    const newLeft = e.clientX - this.dragOffset.x;
    const newTop = e.clientY - this.dragOffset.y;

    // Keep popup within viewport
    const maxLeft = window.innerWidth - this.element.offsetWidth - 16;
    const maxTop = window.innerHeight - this.element.offsetHeight - 16;

    this.position = {
      left: Math.max(16, Math.min(newLeft, maxLeft)),
      top: Math.max(16, Math.min(newTop, maxTop)),
    };

    this.element.style.left = `${this.position.left}px`;
    this.element.style.top = `${this.position.top}px`;
  }

  /**
   * Handle drag end
   */
  handleDragEnd() {
    this.isDragging = false;
    this.element?.classList.remove('smart-reply-popup--dragging');

    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.handleDragEnd);
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    if (e.key === 'Escape') {
      this.hide();
    }
  }

  /**
   * Handle clicks outside the popup
   * @param {MouseEvent} e - Mouse event
   */
  handleClickOutside(e) {
    if (this.element && !this.element.contains(e.target)) {
      // Don't close if clicking on the trigger button
      if (e.target.closest(`.${UI_CONFIG.BUTTON_CLASS}`)) return;
      this.hide();
    }
  }

  /**
   * Show the popup
   * @param {HTMLElement} triggerButton - Button that triggered the popup
   * @param {HTMLElement} targetInput - Input element to insert reply into
   * @param {Object} context - Context for reply generation
   * @param {Object} callbacks - Callback functions
   */
  show(triggerButton, targetInput, context, callbacks = {}) {
    this.targetInput = targetInput;
    this.context = context;
    this.onInsert = callbacks.onInsert;
    this.onRegenerate = callbacks.onRegenerate;
    this.suggestions = [];
    this.error = null;
    this.isLoading = true;

    // Create element if doesn't exist
    if (!this.element) {
      this.element = this.createElement();
    } else {
      this.updateContent();
    }

    // Calculate position
    const popupSize = { width: 380, height: 400 };
    this.position = calculatePopupPosition(triggerButton, popupSize);

    this.element.style.top = `${this.position.top}px`;
    this.element.style.left = `${this.position.left}px`;

    // Add to DOM
    if (!document.body.contains(this.element)) {
      document.body.appendChild(this.element);
    }

    // Add animation class
    this.element.classList.add('smart-reply-popup--entering');
    setTimeout(() => {
      this.element?.classList.remove('smart-reply-popup--entering');
    }, 200);

    this.isVisible = true;

    // Add global event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    setTimeout(() => {
      document.addEventListener('click', this.handleClickOutside);
    }, 100);
  }

  /**
   * Hide the popup
   */
  hide() {
    if (!this.isVisible || !this.element) return;

    this.element.classList.add('smart-reply-popup--exiting');

    setTimeout(() => {
      this.element?.remove();
      this.element = null;
      this.isVisible = false;
    }, 150);

    // Remove global event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('click', this.handleClickOutside);
  }

  /**
   * Update the content area
   */
  updateContent() {
    if (!this.element) return;

    const content = this.element.querySelector('.smart-reply-popup__content');
    if (content) {
      content.innerHTML = this.getContentTemplate();
    }
  }

  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    this.isLoading = loading;
    if (loading) {
      this.error = null;
      this.suggestions = [];
    }
    this.updateContent();
  }

  /**
   * Set suggestions
   * @param {string[]} suggestions - Array of suggestions
   */
  setSuggestions(suggestions) {
    this.isLoading = false;
    this.error = null;
    this.suggestions = suggestions;
    this.updateContent();
  }

  /**
   * Set error state
   * @param {string} error - Error message
   */
  setError(error) {
    this.isLoading = false;
    this.error = error;
    this.updateContent();
  }

  /**
   * Check if popup is currently visible
   * @returns {boolean}
   */
  isOpen() {
    return this.isVisible;
  }
}

export default SmartReplyPopup;
