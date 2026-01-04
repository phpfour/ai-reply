import { UI_CONFIG } from '../../shared/constants.js';

/**
 * Trigger button component for Smart Reply
 */

/**
 * Create a trigger button element
 * @param {Object} options - Button options
 * @returns {HTMLButtonElement}
 */
export function createTriggerButton(options = {}) {
  const { onClick, className = '' } = options;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = `${UI_CONFIG.BUTTON_CLASS} ${className}`.trim();
  button.title = 'Generate smart reply';
  button.setAttribute('aria-label', 'Generate smart reply');

  button.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  `;

  if (onClick) {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(e, button);
    });
  }

  return button;
}

/**
 * Set button to active state
 * @param {HTMLButtonElement} button - Button element
 */
export function setButtonActive(button) {
  button.classList.add('active');
}

/**
 * Set button to inactive state
 * @param {HTMLButtonElement} button - Button element
 */
export function setButtonInactive(button) {
  button.classList.remove('active');
}

/**
 * Set button to loading state
 * @param {HTMLButtonElement} button - Button element
 */
export function setButtonLoading(button) {
  button.disabled = true;
  button.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spinning">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  `;
  button.style.animation = 'spin 1s linear infinite';
}

/**
 * Reset button to default state
 * @param {HTMLButtonElement} button - Button element
 */
export function resetButton(button) {
  button.disabled = false;
  button.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  `;
  button.style.animation = '';
}

export default {
  createTriggerButton,
  setButtonActive,
  setButtonInactive,
  setButtonLoading,
  resetButton,
};
