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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
      <path d="M5 2L5.94 4.06L8 5L5.94 5.94L5 8L4.06 5.94L2 5L4.06 4.06L5 2Z" opacity="0.7"/>
      <path d="M19 16L19.94 18.06L22 19L19.94 19.94L19 22L18.06 19.94L16 19L18.06 18.06L19 16Z" opacity="0.7"/>
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
      <path d="M5 2L5.94 4.06L8 5L5.94 5.94L5 8L4.06 5.94L2 5L4.06 4.06L5 2Z" opacity="0.7"/>
      <path d="M19 16L19.94 18.06L22 19L19.94 19.94L19 22L18.06 19.94L16 19L18.06 18.06L19 16Z" opacity="0.7"/>
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
