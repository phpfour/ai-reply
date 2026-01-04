import { PLATFORMS } from '../../shared/constants.js';
import { BasePlatform } from './base.js';
import { observeElements, getTextContent } from '../utils/dom.js';

/**
 * Instagram platform handler
 */
export class InstagramPlatform extends BasePlatform {
  constructor() {
    super(PLATFORMS.INSTAGRAM);
  }

  /**
   * Input selectors for Instagram comments
   */
  getInputSelectors() {
    return [
      // Comment input on posts
      'form textarea[placeholder*="comment" i]',
      'form textarea[aria-label*="comment" i]',
      // Reply input
      'form textarea[placeholder*="reply" i]',
      // General text areas in forms
      'article form textarea',
      // Contenteditable divs (newer UI)
      '[contenteditable="true"][role="textbox"]',
      // Direct message input
      'div[role="textbox"][contenteditable="true"]',
    ];
  }

  /**
   * Set up observers for Instagram's dynamic content
   */
  setupObservers() {
    // Observe for comment forms appearing
    const observer = observeElements(
      'article form, [role="dialog"] form, section form',
      (element) => {
        setTimeout(() => this.processForm(element), 100);
      }
    );
    this.observers.push(observer);

    // Observe for textboxes (newer React-based UI)
    const textboxObserver = observeElements(
      '[role="textbox"][contenteditable="true"]',
      (element) => {
        this.processTextbox(element);
      }
    );
    this.observers.push(textboxObserver);
  }

  /**
   * Scan for existing inputs
   */
  scanForInputs() {
    // Find forms with comment inputs
    const forms = document.querySelectorAll('article form, [role="dialog"] form, section form');
    forms.forEach(form => this.processForm(form));

    // Find textboxes
    const textboxes = document.querySelectorAll('[role="textbox"][contenteditable="true"]');
    textboxes.forEach(textbox => this.processTextbox(textbox));
  }

  /**
   * Process a form element
   * @param {Element} form - Form element
   */
  processForm(form) {
    if (this.processedInputs.has(form)) {
      return;
    }

    const textarea = form.querySelector('textarea');
    const textbox = form.querySelector('[role="textbox"][contenteditable="true"]');
    const input = textarea || textbox;

    if (!input) {
      return;
    }

    this.injectButtonNearInput(input, form);
    this.processedInputs.add(form);
  }

  /**
   * Process a textbox element
   * @param {Element} textbox - Textbox element
   */
  processTextbox(textbox) {
    const form = textbox.closest('form');
    if (form && this.processedInputs.has(form)) {
      return;
    }

    if (this.processedInputs.has(textbox)) {
      return;
    }

    this.injectButtonNearInput(textbox, textbox.parentElement);
    this.processedInputs.add(textbox);
  }

  /**
   * Inject button near the input
   * @param {Element} input - Input element
   * @param {Element} container - Container element
   */
  injectButtonNearInput(input, container) {
    const button = this.createTriggerButton(input);
    if (!button) return;

    // Style for Instagram's aesthetic
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #8e8e8e;
      border-radius: 50%;
      transition: color 0.2s;
      position: relative;
      z-index: 1;
    `;

    // Find the submit button or post button
    const submitButton = container.querySelector(
      'button[type="submit"], ' +
      'div[role="button"]:last-child, ' +
      '[data-testid="post-button"]'
    );

    if (submitButton && submitButton.parentElement) {
      submitButton.parentElement.insertBefore(button, submitButton);
    } else {
      // Append to form
      const form = input.closest('form');
      if (form) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.alignItems = 'center';
        buttonContainer.appendChild(button);
        form.appendChild(buttonContainer);
      } else {
        input.parentElement?.appendChild(button);
      }
    }
  }

  /**
   * Get the actual input element
   * @param {Element} input - Input element
   * @returns {Element}
   */
  getInputElement(input) {
    // If it's already the input, return it
    if (input.tagName === 'TEXTAREA' || input.getAttribute('contenteditable') === 'true') {
      return input;
    }

    // Try to find textarea or contenteditable in parent
    const form = input.closest('form');
    if (form) {
      return form.querySelector('textarea') ||
             form.querySelector('[contenteditable="true"]') ||
             input;
    }

    return input;
  }

  /**
   * Extract context for Instagram
   * @param {Element} input - The input element
   * @returns {Object} Context object
   */
  extractContext(input) {
    const context = {
      platform: this.platformId,
      postCaption: null,
      postAuthor: null,
      originalComment: null,
    };

    // Find the article or post container
    const article = input.closest('article') ||
                   input.closest('[role="dialog"]')?.querySelector('article') ||
                   document.querySelector('article');

    if (article) {
      // Get post caption
      const captionElement = article.querySelector(
        'div > span:first-child, ' +
        'h1 + div span, ' +
        '[class*="Caption"] span'
      );
      if (captionElement) {
        context.postCaption = getTextContent(captionElement).substring(0, 500);
      }

      // Get post author
      const authorElement = article.querySelector(
        'header a[role="link"], ' +
        'header span a, ' +
        'a[href^="/"]:first-of-type'
      );
      if (authorElement) {
        context.postAuthor = getTextContent(authorElement);
      }

      // Check if replying to a comment
      const replyingTo = input.closest('[role="dialog"]')?.querySelector('[class*="reply"]');
      if (replyingTo) {
        const commentText = replyingTo.closest('div')?.querySelector('span');
        if (commentText) {
          context.originalComment = getTextContent(commentText);
        }
      }
    }

    return context;
  }

  /**
   * Instagram's React inputs require typing simulation
   */
  requiresTypingSimulation() {
    return true;
  }
}

export default InstagramPlatform;
