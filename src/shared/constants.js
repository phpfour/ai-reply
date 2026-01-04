// Platform identifiers
export const PLATFORMS = {
  YOUTUBE: 'youtube',
  INSTAGRAM: 'instagram',
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter',
};

// Tone options for reply generation
export const TONES = {
  AUTO: 'auto',
  FRIENDLY: 'friendly',
  HUMOROUS: 'humorous',
  ENGAGING: 'engaging',
};

export const TONE_LABELS = {
  [TONES.AUTO]: 'Auto',
  [TONES.FRIENDLY]: 'Friendly',
  [TONES.HUMOROUS]: 'Humorous',
  [TONES.ENGAGING]: 'Engaging',
};

export const TONE_DESCRIPTIONS = {
  [TONES.AUTO]: 'Matches the context and original style',
  [TONES.FRIENDLY]: 'Warm, positive, and encouraging',
  [TONES.HUMOROUS]: 'Witty and playful with appropriate levity',
  [TONES.ENGAGING]: 'Conversation-starting and interactive',
};

// Storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'smartReplySettings',
  STATS: 'smartReplyStats',
  API_KEY: 'smartReplyApiKey',
};

// Default settings
export const DEFAULT_SETTINGS = {
  defaultTone: TONES.AUTO,
  enabledPlatforms: {
    [PLATFORMS.YOUTUBE]: true,
    [PLATFORMS.INSTAGRAM]: true,
    [PLATFORMS.LINKEDIN]: true,
    [PLATFORMS.TWITTER]: true,
  },
  typingSimulation: true,
  typingSpeed: 50, // ms per character
};

// Default statistics
export const DEFAULT_STATS = {
  totalRepliesGenerated: 0,
  repliesByPlatform: {
    [PLATFORMS.YOUTUBE]: 0,
    [PLATFORMS.INSTAGRAM]: 0,
    [PLATFORMS.LINKEDIN]: 0,
    [PLATFORMS.TWITTER]: 0,
  },
  repliesByTone: {
    [TONES.AUTO]: 0,
    [TONES.FRIENDLY]: 0,
    [TONES.HUMOROUS]: 0,
    [TONES.ENGAGING]: 0,
  },
  repliesInserted: 0,
  lastUsed: null,
};

// API configuration
export const API_CONFIG = {
  DEFAULT_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
  DEFAULT_MODEL: 'gpt-4o-mini',
  MAX_TOKENS: 500,
  SUGGESTIONS_COUNT: 3,
};

// UI configuration
export const UI_CONFIG = {
  BUTTON_CLASS: 'smart-reply-trigger',
  POPUP_CLASS: 'smart-reply-popup',
  POPUP_ID: 'smart-reply-popup-container',
  TYPING_MIN_DELAY: 30,
  TYPING_MAX_DELAY: 80,
};

// Messages for communication between content script and background
export const MESSAGES = {
  GENERATE_REPLIES: 'generateReplies',
  GET_SETTINGS: 'getSettings',
  SAVE_SETTINGS: 'saveSettings',
  UPDATE_STATS: 'updateStats',
  GET_STATS: 'getStats',
};
