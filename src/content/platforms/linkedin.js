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

    // Find the post container
    const post = editor.closest('.feed-shared-update-v2') ||
                 editor.closest('article') ||
                 document.querySelector('.feed-shared-update-v2');

    if (post) {
      // Get post content
      const postContent = post.querySelector(
        '.feed-shared-update-v2__description, ' +
        '.feed-shared-text, ' +
        '.update-components-text span[dir="ltr"]'
      );
      if (postContent) {
        context.postContent = getTextContent(postContent).substring(0, 500);
      }

      // Get post author
      const authorElement = post.querySelector(
        '.update-components-actor__name span, ' +
        '.feed-shared-actor__name span, ' +
        'a.app-aware-link span[aria-hidden="true"]'
      );
      if (authorElement) {
        context.postAuthor = getTextContent(authorElement);
      }
    }

    // Check if replying to a comment
    const replyBox = editor.closest('.comments-reply-box');
    if (replyBox) {
      const parentComment = replyBox.closest('.comments-comment-item');
      if (parentComment) {
        const commentText = parentComment.querySelector(
          '.comments-comment-item__main-content span[dir="ltr"], ' +
          '.update-components-text'
        );
        if (commentText) {
          context.originalComment = getTextContent(commentText);
        }
      }
    }

    return context;
  }

  /**
   * LinkedIn uses Quill editor, typing simulation recommended
   */
  requiresTypingSimulation() {
    return true;
  }
}

export default LinkedInPlatform;
