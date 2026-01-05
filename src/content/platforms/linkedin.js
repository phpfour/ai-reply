import { PLATFORMS } from '../../shared/constants.js';
import { BasePlatform } from './base.js';
import { observeElements, getTextContent } from '../utils/dom.js';

/**
 * LinkedIn platform handler
 */
export class LinkedInPlatform extends BasePlatform {
  constructor() {
    super(PLATFORMS.LINKEDIN);
  }

  /**
   * Input selectors for LinkedIn comments
   */
  getInputSelectors() {
    return [
      // Comment editor
      '.comments-comment-box__form .ql-editor',
      '.comments-comment-texteditor .ql-editor',
      // Reply editor
      '.comments-reply-box .ql-editor',
      // General contenteditable
      '[data-placeholder*="comment" i]',
      '.editor-content [contenteditable="true"]',
      // New comment box
      '.comment-box [contenteditable="true"]',
    ];
  }

  /**
   * Set up observers for LinkedIn's dynamic content
   */
  setupObservers() {
    // Observe for comment boxes appearing
    const observer = observeElements(
      '.comments-comment-box, .comments-reply-box, .feed-shared-update-v2__comments-container',
      (element) => {
        setTimeout(() => this.scanForInputs(), 100);
      }
    );
    this.observers.push(observer);

    // Observe for Quill editors
    const editorObserver = observeElements(
      '.ql-editor[contenteditable="true"]',
      (element) => {
        this.processEditor(element);
      }
    );
    this.observers.push(editorObserver);
  }

  /**
   * Scan for existing inputs
   */
  scanForInputs() {
    // Find all Quill editors in comment boxes
    const editors = document.querySelectorAll(
      '.comments-comment-box .ql-editor, ' +
      '.comments-reply-box .ql-editor, ' +
      '.comments-comment-texteditor .ql-editor'
    );

    editors.forEach(editor => this.processEditor(editor));
  }

  /**
   * Process a Quill editor
   * @param {Element} editor - Editor element
   */
  processEditor(editor) {
    // Find the comment box container
    const commentBox = editor.closest('.comments-comment-box') ||
                       editor.closest('.comments-reply-box') ||
                       editor.closest('.comments-comment-texteditor');

    if (!commentBox || this.processedInputs.has(commentBox)) {
      return;
    }

    const button = this.createTriggerButton(editor);
    if (!button) return;

    // Style for LinkedIn
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: rgba(0, 0, 0, 0.6);
      border-radius: 50%;
      transition: background-color 0.2s;
      margin-right: 4px;
    `;

    // Find the button container (actions area)
    const actionsContainer = commentBox.querySelector(
      '.comments-comment-box__controls, ' +
      '.comments-comment-box-comment__controls, ' +
      '.display-flex'
    );

    if (actionsContainer) {
      // Insert at the beginning of actions
      actionsContainer.insertBefore(button, actionsContainer.firstChild);
    } else {
      // Try to find submit button and insert before it
      const submitButton = commentBox.querySelector(
        'button[type="submit"], ' +
        '.comments-comment-box__submit-button, ' +
        'button.artdeco-button--primary'
      );

      if (submitButton && submitButton.parentElement) {
        submitButton.parentElement.insertBefore(button, submitButton);
      } else {
        // Append to comment box
        editor.parentElement?.appendChild(button);
      }
    }

    this.processedInputs.add(commentBox);
  }

  /**
   * Get the actual input element
   * @param {Element} editor - Editor element
   * @returns {Element}
   */
  getInputElement(editor) {
    // If it's the ql-editor, return it
    if (editor.classList?.contains('ql-editor')) {
      return editor;
    }

    // Find ql-editor in parent
    const container = editor.closest('.comments-comment-box') ||
                      editor.closest('.comments-reply-box');

    if (container) {
      return container.querySelector('.ql-editor') || editor;
    }

    return editor;
  }

  /**
   * Extract context for LinkedIn
   * @param {Element} editor - The editor element
   * @returns {Object} Context object
   */
  extractContext(editor) {
    const context = {
      platform: this.platformId,
      postContent: null,
      postAuthor: null,
      originalComment: null,
    };

    try {
      // Find the post container - walk up the DOM from the editor
      const post = this.findPostContainer(editor);

      if (post) {
        // Extract post content
        context.postContent = this.extractPostContent(post);
        context.postAuthor = this.extractPostAuthor(post);
      }

      // Check if replying to a comment
      const replyBox = editor.closest('.comments-reply-box');
      if (replyBox) {
        context.originalComment = this.extractParentComment(replyBox);
      }

      console.log('Smart Reply: Extracted LinkedIn context:', context);
    } catch (error) {
      console.error('Smart Reply: Error extracting LinkedIn context:', error);
    }

    return context;
  }

  /**
   * Find the post container from an editor element
   * @param {Element} editor - Editor element
   * @returns {Element|null}
   */
  findPostContainer(editor) {
    // Try various container selectors
    const selectors = [
      '.feed-shared-update-v2',
      '.feed-shared-post',
      '[data-urn*="activity"]',
      'article',
      '.occludable-update',
    ];

    for (const selector of selectors) {
      const container = editor.closest(selector);
      if (container) {
        return container;
      }
    }

    // Fallback: find the nearest post on the page
    return document.querySelector('.feed-shared-update-v2') ||
           document.querySelector('[data-urn*="activity"]');
  }

  /**
   * Extract post content from a post container
   * @param {Element} post - Post container
   * @returns {string|null}
   */
  extractPostContent(post) {
    if (!post) return null;

    // Try multiple selectors for post content
    const contentSelectors = [
      '.feed-shared-update-v2__description',
      '.feed-shared-text',
      '.feed-shared-inline-show-more-text',
      '.update-components-text',
      '[data-test-id="main-feed-activity-content"]',
      '.break-words span[dir="ltr"]',
      '.feed-shared-update-v2__commentary span',
      'span.break-words',
    ];

    for (const selector of contentSelectors) {
      const element = post.querySelector(selector);
      if (element) {
        const text = getTextContent(element);
        if (text && text.length > 10) {
          return text.substring(0, 500);
        }
      }
    }

    // Try to find any substantial text content
    const allText = post.querySelectorAll('span[dir="ltr"], span.break-words');
    for (const span of allText) {
      const text = getTextContent(span);
      if (text && text.length > 50) {
        return text.substring(0, 500);
      }
    }

    return null;
  }

  /**
   * Extract post author from a post container
   * @param {Element} post - Post container
   * @returns {string|null}
   */
  extractPostAuthor(post) {
    if (!post) return null;

    const authorSelectors = [
      '.update-components-actor__name span',
      '.feed-shared-actor__name span',
      '.update-components-actor__title span',
      'a.app-aware-link span[aria-hidden="true"]',
      '.feed-shared-actor__name a',
      '[data-test-id="actor-name"]',
    ];

    for (const selector of authorSelectors) {
      const element = post.querySelector(selector);
      if (element) {
        const text = getTextContent(element);
        // Filter out common non-name text
        if (text && text.length > 1 && text.length < 100 &&
            !text.includes('follower') && !text.includes('•')) {
          return text;
        }
      }
    }

    return null;
  }

  /**
   * Extract parent comment when replying to a comment
   * @param {Element} replyBox - Reply box element
   * @returns {string|null}
   */
  extractParentComment(replyBox) {
    const commentItem = replyBox.closest('.comments-comment-item') ||
                        replyBox.closest('.comments-comments-list__comment-item');

    if (!commentItem) return null;

    const commentSelectors = [
      '.comments-comment-item__main-content span[dir="ltr"]',
      '.update-components-text',
      '.comments-comment-item-content-body span',
      'span.break-words',
    ];

    for (const selector of commentSelectors) {
      const element = commentItem.querySelector(selector);
      if (element) {
        const text = getTextContent(element);
        if (text && text.length > 5) {
          return text.substring(0, 300);
        }
      }
    }

    return null;
  }

  /**
   * LinkedIn uses Quill editor, typing simulation recommended
   */
  requiresTypingSimulation() {
    return true;
  }
}

export default LinkedInPlatform;
