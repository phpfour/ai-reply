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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
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
