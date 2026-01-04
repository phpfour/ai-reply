import { UI_CONFIG } from '../../shared/constants.js';

/**
 * Typing simulation utilities for natural text insertion
 */

/**
 * Get a random delay between min and max
 * @param {number} min - Minimum delay
 * @param {number} max - Maximum delay
 * @returns {number}
 */
function getRandomDelay(min = UI_CONFIG.TYPING_MIN_DELAY, max = UI_CONFIG.TYPING_MAX_DELAY) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Dispatch keyboard events for a character
 * @param {Element} element - Target element
 * @param {string} char - Character to type
 */
function dispatchKeyEvents(element, char) {
  const keyCode = char.charCodeAt(0);

  const keydownEvent = new KeyboardEvent('keydown', {
    key: char,
    code: `Key${char.toUpperCase()}`,
    keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true,
  });

  const keypressEvent = new KeyboardEvent('keypress', {
    key: char,
    code: `Key${char.toUpperCase()}`,
    keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true,
  });

  const inputEvent = new InputEvent('input', {
    data: char,
    inputType: 'insertText',
    bubbles: true,
    cancelable: true,
  });

  const keyupEvent = new KeyboardEvent('keyup', {
    key: char,
    code: `Key${char.toUpperCase()}`,
    keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true,
  });

  element.dispatchEvent(keydownEvent);
  element.dispatchEvent(keypressEvent);
  element.dispatchEvent(inputEvent);
  element.dispatchEvent(keyupEvent);
}

/**
 * Type text into an input or textarea element with natural simulation
 * @param {HTMLInputElement|HTMLTextAreaElement} element - Target element
 * @param {string} text - Text to type
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
export async function typeIntoInput(element, text, options = {}) {
  const { simulate = true, speed = 50 } = options;

  // Focus the element
  element.focus();

  if (!simulate) {
    // Direct insertion (fast mode)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      element.constructor.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, text);
    } else {
      element.value = text;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  // Character-by-character typing simulation
  const minDelay = Math.max(10, speed - 20);
  const maxDelay = speed + 30;

  for (const char of text) {
    const currentValue = element.value;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      element.constructor.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, currentValue + char);
    } else {
      element.value = currentValue + char;
    }

    dispatchKeyEvents(element, char);

    await sleep(getRandomDelay(minDelay, maxDelay));
  }

  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Type text into a contenteditable element with natural simulation
 * @param {Element} element - Target contenteditable element
 * @param {string} text - Text to type
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
export async function typeIntoContentEditable(element, text, options = {}) {
  const { simulate = true, speed = 50 } = options;

  // Focus the element
  element.focus();

  // Clear existing content if needed
  const selection = window.getSelection();
  const range = document.createRange();

  if (!simulate) {
    // Direct insertion (fast mode)
    element.textContent = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));

    // Move cursor to end
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    return;
  }

  // Character-by-character typing simulation
  const minDelay = Math.max(10, speed - 20);
  const maxDelay = speed + 30;

  // Position cursor at end
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);

  for (const char of text) {
    // Insert character at cursor position
    const textNode = document.createTextNode(char);
    const currentRange = selection.getRangeAt(0);
    currentRange.insertNode(textNode);
    currentRange.setStartAfter(textNode);
    currentRange.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(currentRange);

    dispatchKeyEvents(element, char);

    await sleep(getRandomDelay(minDelay, maxDelay));
  }

  element.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Insert text using document.execCommand (fallback for some platforms)
 * @param {Element} element - Target element
 * @param {string} text - Text to insert
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
export async function insertViaExecCommand(element, text, options = {}) {
  const { simulate = true, speed = 50 } = options;

  element.focus();

  if (!simulate) {
    document.execCommand('insertText', false, text);
    return;
  }

  const minDelay = Math.max(10, speed - 20);
  const maxDelay = speed + 30;

  for (const char of text) {
    document.execCommand('insertText', false, char);
    dispatchKeyEvents(element, char);
    await sleep(getRandomDelay(minDelay, maxDelay));
  }
}

/**
 * Universal text insertion that works across different input types
 * @param {Element} element - Target element
 * @param {string} text - Text to insert
 * @param {Object} options - Options
 * @returns {Promise<boolean>} Success status
 */
export async function insertText(element, text, options = {}) {
  try {
    if (!element || !text) {
      return false;
    }

    const tagName = element.tagName.toLowerCase();
    const isContentEditable = element.isContentEditable || element.getAttribute('contenteditable') === 'true';

    if (tagName === 'input' || tagName === 'textarea') {
      await typeIntoInput(element, text, options);
    } else if (isContentEditable) {
      await typeIntoContentEditable(element, text, options);
    } else {
      // Try execCommand as fallback
      await insertViaExecCommand(element, text, options);
    }

    return true;
  } catch (error) {
    console.error('Smart Reply: Error inserting text:', error);
    return false;
  }
}

/**
 * Clear the content of an input element
 * @param {Element} element - Target element
 */
export function clearInput(element) {
  if (!element) return;

  const tagName = element.tagName.toLowerCase();
  const isContentEditable = element.isContentEditable || element.getAttribute('contenteditable') === 'true';

  if (tagName === 'input' || tagName === 'textarea') {
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (isContentEditable) {
    element.textContent = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
