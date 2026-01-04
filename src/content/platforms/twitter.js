import { PLATFORMS } from '../../shared/constants.js';
import { BasePlatform } from './base.js';
import { observeElements, getTextContent } from '../utils/dom.js';

/**
 * Twitter/X platform handler
 */
export class TwitterPlatform extends BasePlatform {
  constructor() {
    super(PLATFORMS.TWITTER);
  }

  /**
   * Input selectors for Twitter/X
   */
  getInputSelectors() {
    return [
      // Tweet composer
      '[data-testid="tweetTextarea_0"]',
      // Reply composer
      '[data-testid="tweetTextarea_0_label"]',
      // General draft editors
      '.DraftEditor-root',
      // Contenteditable divs
      '[contenteditable="true"][data-contents="true"]',
      // Reply box
      '[aria-label*="reply" i][role="textbox"]',
      '[aria-label*="post" i][role="textbox"]',
    ];
  }

  /**
   * Set up observers for Twitter's dynamic content
   */
  setupObservers() {
    // Observe for reply modals and tweet composers
    const observer = observeElements(
      '[data-testid="tweetTextarea_0"], [data-testid="reply"], .DraftEditor-root',
      (element) => {
        setTimeout(() => this.processEditor(element), 100);
      }
    );
    this.observers.push(observer);

    // Observe for dialogs (quote tweets, replies)
    const dialogObserver = observeElements(
      '[role="dialog"], [aria-modal="true"]',
      (element) => {
        setTimeout(() => this.scanForInputs(), 200);
      }
    );
    this.observers.push(dialogObserver);
  }

  /**
   * Scan for existing inputs
   */
  scanForInputs() {
    // Find tweet/reply composers
    const editors = document.querySelectorAll(
      '[data-testid="tweetTextarea_0"], ' +
      '.DraftEditor-root, ' +
      '[role="textbox"][data-contents="true"]'
    );

    editors.forEach(editor => this.processEditor(editor));
  }

  /**
   * Process a tweet editor
   * @param {Element} editor - Editor element
   */
  processEditor(editor) {
    // Find the composer container
    const composer = editor.closest('[data-testid="tweetbox-composer"]') ||
                     editor.closest('[data-testid="toolBar"]')?.parentElement ||
                     editor.closest('.DraftEditor-root')?.parentElement?.parentElement;

    const container = composer || editor.closest('form') || editor.parentElement?.parentElement;

    if (!container || this.processedInputs.has(container)) {
      return;
    }

    const button = this.createTriggerButton(editor);
    if (!button) return;

    // Style for Twitter/X
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      color: rgb(29, 155, 240);
      border-radius: 50%;
      transition: background-color 0.2s;
    `;

    // Find the toolbar or actions area
    const toolbar = container.querySelector('[data-testid="toolBar"]') ||
                    container.querySelector('[role="group"]') ||
                    container.querySelector('.public-DraftEditorPlaceholder-root')?.parentElement;

    if (toolbar) {
      // Insert at the start of the toolbar
      const firstChild = toolbar.firstChild;
      if (firstChild) {
        toolbar.insertBefore(button, firstChild);
      } else {
        toolbar.appendChild(button);
      }
    } else {
      // Try to find near the tweet button
      const tweetButton = container.querySelector('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]');
      if (tweetButton && tweetButton.parentElement) {
        tweetButton.parentElement.insertBefore(button, tweetButton);
      } else {
        // Append to editor parent
        editor.parentElement?.appendChild(button);
      }
    }

    this.processedInputs.add(container);
  }

  /**
   * Get the actual input element
   * @param {Element} editor - Editor element
   * @returns {Element}
   */
  getInputElement(editor) {
    // Try to find the contenteditable div
    if (editor.getAttribute('contenteditable') === 'true') {
      return editor;
    }

    // Find contenteditable in parent
    const draftEditor = editor.closest('.DraftEditor-root') || editor;
    const contentEditable = draftEditor.querySelector('[contenteditable="true"]');

    if (contentEditable) {
      return contentEditable;
    }

    // Find the data-contents element
    const dataContents = draftEditor.querySelector('[data-contents="true"]');
    if (dataContents) {
      return dataContents;
    }

    return editor;
  }

  /**
   * Extract context for Twitter/X
   * @param {Element} editor - The editor element
   * @returns {Object} Context object
   */
  extractContext(editor) {
    const context = {
      platform: this.platformId,
      tweetContent: null,
      tweetAuthor: null,
      originalComment: null,
    };

    // Find the tweet we're replying to
    const dialog = editor.closest('[role="dialog"]') || document;

    // Check if this is a reply
    const replyTarget = dialog.querySelector(
      '[data-testid="tweet"]:first-of-type, ' +
      'article[data-testid="tweet"]'
    );

    if (replyTarget) {
      // Get tweet text
      const tweetText = replyTarget.querySelector(
        '[data-testid="tweetText"], ' +
        '[lang] span'
      );
      if (tweetText) {
        context.tweetContent = getTextContent(tweetText).substring(0, 500);
        context.originalComment = context.tweetContent;
      }

      // Get tweet author
      const authorElement = replyTarget.querySelector(
        '[data-testid="User-Name"] a, ' +
        'a[role="link"][href^="/"]'
      );
      if (authorElement) {
        context.tweetAuthor = getTextContent(authorElement);
      }
    } else {
      // Not a reply - might be quoting or composing new tweet
      // Try to get context from the timeline
      const visibleTweet = document.querySelector('article[data-testid="tweet"]');
      if (visibleTweet) {
        const tweetText = visibleTweet.querySelector('[data-testid="tweetText"]');
        if (tweetText) {
          context.tweetContent = getTextContent(tweetText).substring(0, 500);
        }
      }
    }

    return context;
  }

  /**
   * Twitter uses Draft.js, typing simulation is required
   */
  requiresTypingSimulation() {
    return true;
  }
}

export default TwitterPlatform;
