import { MESSAGES } from '../shared/constants.js';
import storage from '../shared/storage.js';
import api from '../shared/api.js';

/**
 * Background service worker for Smart Reply extension
 * Handles message passing and API calls
 */

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('Smart Reply service worker error:', error);
      sendResponse({ success: false, error: error.message });
    });

  // Return true to indicate async response
  return true;
});

/**
 * Handle incoming messages
 * @param {Object} message - Message object
 * @param {Object} sender - Sender info
 * @returns {Promise<Object>} Response
 */
async function handleMessage(message, sender) {
  switch (message.type) {
    case MESSAGES.GENERATE_REPLIES:
      return handleGenerateReplies(message);

    case MESSAGES.GET_SETTINGS:
      return handleGetSettings();

    case MESSAGES.SAVE_SETTINGS:
      return handleSaveSettings(message.settings);

    case MESSAGES.GET_STATS:
      return handleGetStats();

    case MESSAGES.UPDATE_STATS:
      return handleUpdateStats(message);

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * Handle reply generation request
 * @param {Object} message - Message with context and tone
 * @returns {Promise<Object>} Generated replies
 */
async function handleGenerateReplies(message) {
  const { context, tone } = message;

  // Generate replies using API
  const result = await api.generateReplies(context, tone);

  // Update stats if successful
  if (result.success && context.platform) {
    await storage.incrementReplyGenerated(context.platform, tone);
  }

  return result;
}

/**
 * Handle get settings request
 * @returns {Promise<Object>} Settings
 */
async function handleGetSettings() {
  const settings = await storage.getSettings();
  return { success: true, settings };
}

/**
 * Handle save settings request
 * @param {Object} settings - Settings to save
 * @returns {Promise<Object>} Result
 */
async function handleSaveSettings(settings) {
  await storage.saveSettings(settings);
  return { success: true };
}

/**
 * Handle get stats request
 * @returns {Promise<Object>} Statistics
 */
async function handleGetStats() {
  const stats = await storage.getStats();
  return { success: true, stats };
}

/**
 * Handle update stats request
 * @param {Object} message - Message with stat updates
 * @returns {Promise<Object>} Updated stats
 */
async function handleUpdateStats(message) {
  if (message.action === 'incrementInserted') {
    const stats = await storage.incrementReplyInserted();
    return { success: true, stats };
  }

  return { success: false, error: 'Unknown stats action' };
}

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Smart Reply extension installed');

    // Initialize default settings
    const settings = await storage.getSettings();
    console.log('Initialized with settings:', settings);
  } else if (details.reason === 'update') {
    console.log('Smart Reply extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Log when service worker starts
console.log('Smart Reply service worker started');
