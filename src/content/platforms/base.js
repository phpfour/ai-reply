import { UI_CONFIG } from '../../shared/constants.js';
import { observeElements, isElementVisible } from '../utils/dom.js';

/**
 * Base platform handler class
 * Provides common functionality for all platform handlers
 */
export class BasePlatform {
  constructor(platformId) {
    this.platformId = platformId;
    this.observers = [];
    this.processedInputs = new WeakSet();
    this.onButtonClick = null;
  }

  /**
   * Initialize the platform handler
   * @param {Function} onButtonClick - Callback when trigger button is clicked
   */
  init(onButtonClick) {
    this.onButtonClick = onButtonClick;
    this.setupObservers();
    this.scanForInputs();
  }

  /**
   * Set up mutation observers for dynamic content
   * Override in subclasses
   */
  setupObservers() {
    // To be implemented by subclasses
  }

  /**
   * Scan the page for comment inputs
   * Override in subclasses
   */
  scanForInputs() {
    // To be implemented by subclasses
  }

  /**
   * Get input selectors for this platform
   * Override in subclasses
   * @returns {string[]}
   */
  getInputSelectors() {
    return [];
  }

  /**
   * Extract context from the page for reply generation
   * Override in subclasses
   * @param {Element} inputElement - The input element
   * @returns {Object} Context object
   */
  extractContext(inputElement) {
    return {
      platform: this.platformId,
    };
  }

  /**
   * Get the target input element for text insertion
   * Override in subclasses if needed
   * @param {Element} container - The container element
   * @returns {Element|null}
   */
  getInputElement(container) {
    return container;
  }

  /**
   * Process an input element - add trigger button
   * @param {Element} inputElement - The input element or container
   */
  processInput(inputElement) {
    if (this.processedInputs.has(inputElement)) {
      return;
    }

    if (!isElementVisible(inputElement)) {
      return;
    }

    const button = this.createTriggerButton(inputElement);
    if (button) {
      this.injectButton(inputElement, button);
      this.processedInputs.add(inputElement);
    }
  }

  /**
   * Create the trigger button element
   * @param {Element} inputElement - Associated input element
   * @returns {Element}
   */
  createTriggerButton(inputElement) {
    const button = document.createElement('button');
    button.className = UI_CONFIG.BUTTON_CLASS;
    button.type = 'button';
    button.title = 'Generate smart reply';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
        <path d="M5 2L5.94 4.06L8 5L5.94 5.94L5 8L4.06 5.94L2 5L4.06 4.06L5 2Z" opacity="0.7"/>
        <path d="M19 16L19.94 18.06L22 19L19.94 19.94L19 22L18.06 19.94L16 19L18.06 18.06L19 16Z" opacity="0.7"/>
      </svg>
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.onButtonClick) {
        const context = this.extractContext(inputElement);
        const targetInput = this.getInputElement(inputElement);
        this.onButtonClick(button, targetInput, context);
      }
    });

    return button;
  }

  /**
   * Inject the trigger button near the input
   * Override in subclasses for platform-specific positioning
   * @param {Element} inputElement - The input element
   * @param {Element} button - The button element
   */
  injectButton(inputElement, button) {
    // Default: insert after the input
    inputElement.parentElement?.insertBefore(button, inputElement.nextSibling);
  }

  /**
   * Check if typing simulation is required for this platform
   * @returns {boolean}
   */
  requiresTypingSimulation() {
    return false;
  }

  /**
   * Clean up observers
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Handle URL/route changes (for SPAs)
   */
  onRouteChange() {
    // Clear processed inputs as the page content may have changed
    this.processedInputs = new WeakSet();
    this.scanForInputs();
  }
}

export default BasePlatform;
