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

    try {
      // Method 1: Check if we're in a reply dialog
      const dialog = editor.closest('[role="dialog"]');

      if (dialog) {
        // In a reply modal - find the tweet being replied to
        const tweets = dialog.querySelectorAll('article[data-testid="tweet"]');
        // The first tweet in the dialog is what we're replying to
        if (tweets.length > 0) {
          const targetTweet = tweets[0];
          context.tweetContent = this.extractTweetText(targetTweet);
          context.tweetAuthor = this.extractTweetAuthor(targetTweet);
          context.originalComment = context.tweetContent;
        }
      }

      // Method 2: Check if we're on a tweet detail page (replying inline)
      if (!context.tweetContent) {
        // Look for the main tweet on the page (usually has tabindex)
        const mainTweet = document.querySelector('article[data-testid="tweet"][tabindex="-1"]') ||
                          document.querySelector('[data-testid="tweet-text-show-more-link"]')?.closest('article') ||
                          document.querySelector('article[data-testid="tweet"]');

        if (mainTweet) {
          context.tweetContent = this.extractTweetText(mainTweet);
          context.tweetAuthor = this.extractTweetAuthor(mainTweet);
          context.originalComment = context.tweetContent;
        }
      }

      // Method 3: Find tweet from URL if on a tweet page
      if (!context.tweetContent) {
        const url = window.location.href;
        if (url.includes('/status/')) {
          // We're on a tweet detail page
          const tweetArticle = document.querySelector('article[data-testid="tweet"]');
          if (tweetArticle) {
            context.tweetContent = this.extractTweetText(tweetArticle);
            context.tweetAuthor = this.extractTweetAuthor(tweetArticle);
            context.originalComment = context.tweetContent;
          }
        }
      }

      console.log('Smart Reply: Extracted Twitter context:', context);
    } catch (error) {
      console.error('Smart Reply: Error extracting Twitter context:', error);
    }

    return context;
  }

  /**
   * Extract tweet text from a tweet article
   * @param {Element} tweet - Tweet article element
   * @returns {string|null}
   */
  extractTweetText(tweet) {
    if (!tweet) return null;

    // Try multiple selectors for tweet text
    const selectors = [
      '[data-testid="tweetText"]',
      '[lang] > span',
      'div[dir="auto"][lang]',
    ];

    for (const selector of selectors) {
      const element = tweet.querySelector(selector);
      if (element) {
        const text = getTextContent(element);
        if (text && text.length > 0) {
          return text.substring(0, 500);
        }
      }
    }

    return null;
  }

  /**
   * Extract tweet author from a tweet article
   * @param {Element} tweet - Tweet article element
   * @returns {string|null}
   */
  extractTweetAuthor(tweet) {
    if (!tweet) return null;

    // Try multiple selectors for author
    const selectors = [
      '[data-testid="User-Name"] span:first-child',
      '[data-testid="User-Name"] a span',
      'a[role="link"][href^="/"] span',
    ];

    for (const selector of selectors) {
      const element = tweet.querySelector(selector);
      if (element) {
        const text = getTextContent(element);
        if (text && text.length > 0 && !text.startsWith('@')) {
          return text;
        }
      }
    }

    return null;
  }

  /**
   * Twitter uses Draft.js, typing simulation is required
   */
  requiresTypingSimulation() {
    return true;
  }
}

export default TwitterPlatform;
