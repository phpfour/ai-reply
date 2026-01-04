import { PLATFORMS } from '../../shared/constants.js';
import { BasePlatform } from './base.js';
import { observeElements, getTextContent } from '../utils/dom.js';

/**
 * YouTube platform handler
 */
export class YouTubePlatform extends BasePlatform {
  constructor() {
    super(PLATFORMS.YOUTUBE);
  }

  /**
   * Input selectors for YouTube comments
   */
  getInputSelectors() {
    return [
      // Main comment box
      'ytd-comment-simplebox-renderer #contenteditable-root',
      // Reply boxes
      'ytd-comment-renderer #contenteditable-root',
      // Comment input placeholder (before activation)
      '#placeholder-area',
      // Alternative selectors
      'ytd-comments #contenteditable-root',
      '#comment-dialog #contenteditable-root',
    ];
  }

  /**
   * Set up observers for YouTube's dynamic content
   */
  setupObservers() {
    // Observe for comment section loading
    const observer = observeElements(
      'ytd-comment-simplebox-renderer, ytd-comment-renderer ytd-commentbox',
      (element) => {
        this.processCommentBox(element);
      }
    );
    this.observers.push(observer);

    // Also observe for reply boxes that appear on click
    const replyObserver = observeElements(
      '#reply-dialog, #comment-dialog',
      (element) => {
        setTimeout(() => this.scanForInputs(), 100);
      }
    );
    this.observers.push(replyObserver);
  }

  /**
   * Scan for existing comment inputs
   */
  scanForInputs() {
    // Main comment box
    const mainCommentBox = document.querySelector('ytd-comment-simplebox-renderer');
    if (mainCommentBox) {
      this.processCommentBox(mainCommentBox);
    }

    // Reply boxes
    const replyBoxes = document.querySelectorAll('ytd-comment-renderer ytd-commentbox');
    replyBoxes.forEach(box => this.processCommentBox(box));
  }

  /**
   * Process a comment box container
   * @param {Element} container - Comment box container
   */
  processCommentBox(container) {
    if (this.processedInputs.has(container)) {
      return;
    }

    // Find the contenteditable element
    const contentEditable = container.querySelector('#contenteditable-root');
    if (!contentEditable) {
      return;
    }

    // Find the button container (near submit button)
    const buttonContainer = container.querySelector('#submit-button')?.parentElement ||
                           container.querySelector('#buttons') ||
                           container.querySelector('ytd-button-renderer')?.parentElement;

    if (buttonContainer) {
      const button = this.createTriggerButton(container);
      if (button) {
        // Style for YouTube
        button.style.cssText = `
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          margin-right: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--yt-spec-text-secondary, #606060);
          border-radius: 50%;
          transition: background-color 0.2s;
        `;

        // Insert before submit button
        const submitBtn = buttonContainer.querySelector('#submit-button, ytd-button-renderer');
        if (submitBtn) {
          buttonContainer.insertBefore(button, submitBtn);
        } else {
          buttonContainer.appendChild(button);
        }

        this.processedInputs.add(container);
      }
    }
  }

  /**
   * Get the actual input element from a container
   * @param {Element} container - Container element
   * @returns {Element|null}
   */
  getInputElement(container) {
    return container.querySelector('#contenteditable-root') || container;
  }

  /**
   * Extract context for YouTube
   * @param {Element} container - The comment box container
   * @returns {Object} Context object
   */
  extractContext(container) {
    const context = {
      platform: this.platformId,
      postTitle: null,
      postDescription: null,
      postAuthor: null,
      originalComment: null,
    };

    // Get video title
    const titleElement = document.querySelector(
      'h1.ytd-video-primary-info-renderer yt-formatted-string, ' +
      'h1.ytd-watch-metadata yt-formatted-string, ' +
      '#title h1 yt-formatted-string'
    );
    if (titleElement) {
      context.postTitle = getTextContent(titleElement);
    }

    // Get video description (first part)
    const descriptionElement = document.querySelector(
      '#description-inline-expander yt-formatted-string, ' +
      'ytd-expander#description yt-formatted-string, ' +
      '#description yt-formatted-string'
    );
    if (descriptionElement) {
      context.postDescription = getTextContent(descriptionElement).substring(0, 500);
    }

    // Get channel name
    const channelElement = document.querySelector(
      '#channel-name yt-formatted-string a, ' +
      'ytd-channel-name yt-formatted-string a, ' +
      '#owner-name a'
    );
    if (channelElement) {
      context.postAuthor = getTextContent(channelElement);
    }

    // Check if this is a reply to a comment
    const commentRenderer = container.closest('ytd-comment-renderer');
    if (commentRenderer) {
      const commentText = commentRenderer.querySelector('#content-text');
      if (commentText) {
        context.originalComment = getTextContent(commentText);
      }
    }

    return context;
  }

  /**
   * YouTube uses contenteditable, typing simulation helps but not strictly required
   */
  requiresTypingSimulation() {
    return false;
  }
}

export default YouTubePlatform;
