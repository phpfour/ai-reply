/**
 * DOM utility functions for content scripts
 */

/**
 * Wait for an element to appear in the DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in ms
 * @param {Element} parent - Parent element to search in
 * @returns {Promise<Element>}
 */
export function waitForElement(selector, timeout = 5000, parent = document) {
  return new Promise((resolve, reject) => {
    const element = parent.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const el = parent.querySelector(selector);
      if (el) {
        obs.disconnect();
        resolve(el);
      }
    });

    observer.observe(parent, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element: ${selector}`));
    }, timeout);
  });
}

/**
 * Create a MutationObserver that calls a callback when matching elements are added
 * @param {string} selector - CSS selector to match
 * @param {Function} callback - Function to call with matched elements
 * @param {Element} parent - Parent element to observe
 * @returns {MutationObserver}
 */
export function observeElements(selector, callback, parent = document.body) {
  // Process existing elements
  const existing = parent.querySelectorAll(selector);
  existing.forEach(el => callback(el));

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the added node matches
          if (node.matches && node.matches(selector)) {
            callback(node);
          }
          // Check children of added node
          const children = node.querySelectorAll?.(selector);
          if (children) {
            children.forEach(el => callback(el));
          }
        }
      }
    }
  });

  observer.observe(parent, {
    childList: true,
    subtree: true,
  });

  return observer;
}

/**
 * Check if an element is visible in the viewport
 * @param {Element} element - Element to check
 * @returns {boolean}
 */
export function isElementVisible(element) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0'
  );
}

/**
 * Get the closest scrollable parent of an element
 * @param {Element} element - Element to start from
 * @returns {Element}
 */
export function getScrollParent(element) {
  let parent = element.parentElement;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflow = style.overflow + style.overflowY + style.overflowX;

    if (/(auto|scroll)/.test(overflow)) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return document.documentElement;
}

/**
 * Calculate the best position for a popup relative to a trigger element
 * @param {Element} trigger - Trigger element
 * @param {Object} popupSize - { width, height } of the popup
 * @param {number} offset - Offset from the trigger
 * @returns {Object} { top, left }
 */
export function calculatePopupPosition(trigger, popupSize, offset = 8) {
  const rect = trigger.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = rect.bottom + offset;
  let left = rect.left;

  // Adjust if popup would go off the right edge
  if (left + popupSize.width > viewportWidth - 16) {
    left = viewportWidth - popupSize.width - 16;
  }

  // Adjust if popup would go off the left edge
  if (left < 16) {
    left = 16;
  }

  // Adjust if popup would go off the bottom edge
  if (top + popupSize.height > viewportHeight - 16) {
    // Try positioning above the trigger
    const topAbove = rect.top - popupSize.height - offset;
    if (topAbove > 16) {
      top = topAbove;
    } else {
      // Center vertically if no good position
      top = Math.max(16, (viewportHeight - popupSize.height) / 2);
    }
  }

  return { top, left };
}

/**
 * Create an element from HTML string
 * @param {string} html - HTML string
 * @returns {Element}
 */
export function createElementFromHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in ms
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Get text content from an element, handling various cases
 * @param {Element} element - Element to get text from
 * @returns {string}
 */
export function getTextContent(element) {
  if (!element) return '';

  // Try innerText first for better formatting
  if (element.innerText) {
    return element.innerText.trim();
  }

  // Fall back to textContent
  return (element.textContent || '').trim();
}

/**
 * Find the closest parent matching a selector
 * @param {Element} element - Starting element
 * @param {string} selector - CSS selector
 * @returns {Element|null}
 */
export function findClosest(element, selector) {
  if (!element) return null;
  return element.closest(selector);
}
