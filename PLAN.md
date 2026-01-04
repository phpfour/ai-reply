# Smart Reply Chrome Extension - Implementation Plan

## Overview
A Chrome extension that generates AI-powered smart replies for YouTube, Instagram, LinkedIn, and X (Twitter). The extension injects a button near comment/reply boxes, opens a draggable popup with AI-generated suggestions, and inserts the selected reply with natural typing simulation.

---

## Architecture

```
ai-reply/
├── manifest.json              # Chrome extension manifest v3
├── package.json               # Build dependencies
├── webpack.config.js          # Build configuration
├── src/
│   ├── background/
│   │   └── service-worker.js  # Background service worker
│   ├── content/
│   │   ├── index.js           # Main content script entry
│   │   ├── platforms/         # Platform-specific handlers
│   │   │   ├── youtube.js
│   │   │   ├── instagram.js
│   │   │   ├── linkedin.js
│   │   │   ├── twitter.js
│   │   │   └── base.js        # Base platform class
│   │   ├── ui/
│   │   │   ├── popup.js       # Draggable popup component
│   │   │   ├── button.js      # Trigger button component
│   │   │   └── styles.css     # Injected styles
│   │   └── utils/
│   │       ├── typing.js      # Natural typing simulation
│   │       └── dom.js         # DOM utilities
│   ├── popup/                 # Extension popup (stats dashboard)
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── options/               # Options page
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   └── shared/
│       ├── api.js             # API communication
│       ├── storage.js         # Chrome storage wrapper
│       └── constants.js       # Shared constants
├── assets/
│   └── icons/                 # Extension icons
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
└── dist/                      # Built extension
```

---

## Implementation Phases

### Phase 1: Project Setup & Core Infrastructure
**Tasks:**
1. Create `manifest.json` (Manifest V3)
2. Set up build tooling (webpack for bundling)
3. Create base folder structure
4. Implement Chrome storage wrapper for settings/stats
5. Create constants and shared utilities

### Phase 2: Platform Detection & Button Injection
**Tasks:**
1. Create base platform handler class with common interface
2. Implement YouTube handler:
   - Detect comment boxes (main comments + replies)
   - Extract video title, description, channel name
   - Inject ✨ button near comment box
3. Implement Instagram handler:
   - Detect comment/reply inputs
   - Extract post caption, username
   - Handle dynamic DOM (React-based)
4. Implement LinkedIn handler:
   - Detect comment boxes on posts
   - Extract post content, author info
   - Handle their specific DOM structure
5. Implement X (Twitter) handler:
   - Detect reply composer
   - Extract tweet text, author
   - Handle dynamic loading

### Phase 3: AI Reply Generation UI
**Tasks:**
1. Create draggable popup component:
   - Show/hide on button click
   - Drag functionality with position memory
   - Close on outside click or Escape key
2. Implement tone selector (Auto, Friendly, Humorous, Engaging)
3. Display multiple AI suggestions (3-4 options)
4. Add copy/insert buttons for each suggestion
5. Loading states and error handling

### Phase 4: AI Integration & Reply Generation
**Tasks:**
1. Create API service for AI communication
2. Build context extraction for each platform
3. Implement prompt engineering for different tones
4. Handle API rate limiting and errors
5. Cache recent suggestions for performance

### Phase 5: Reply Insertion & Typing Simulation
**Tasks:**
1. Implement natural typing simulation utility
2. Platform-specific insertion logic:
   - YouTube: Direct value insertion
   - Instagram: Simulated typing (required for React)
   - LinkedIn: Handle contenteditable
   - X: Handle their specific input system
3. Focus management after insertion

### Phase 6: Extension Popup & Statistics Dashboard
**Tasks:**
1. Design popup UI with usage stats
2. Track metrics:
   - Total replies generated
   - Replies by platform
   - Most used tones
   - Usage over time
3. Display upgrade options placeholder

### Phase 7: Options Page & Settings
**Tasks:**
1. Create options page UI
2. Settings:
   - Default tone preference
   - Enable/disable per platform
   - API key configuration (if needed)
   - Keyboard shortcuts

### Phase 8: Polish & Testing
**Tasks:**
1. Add proper error handling throughout
2. Handle edge cases (deleted comments, navigation)
3. Test on all platforms thoroughly
4. Add loading animations and transitions
5. Ensure consistent styling across platforms

---

## Technical Decisions

### Manifest V3
Using Chrome's latest manifest version for future compatibility and security.

### Content Script Strategy
- Use `MutationObserver` to detect dynamically loaded comment boxes
- Inject UI elements as shadow DOM to avoid style conflicts
- Re-scan on URL changes (SPA navigation)

### AI Backend Options
For the initial build, we'll use a configurable API endpoint. Users can:
1. Use a hosted API service (default)
2. Configure their own OpenAI/Claude API key

### Typing Simulation
Some platforms (Instagram, X) require simulated key events rather than direct value assignment. We'll implement character-by-character insertion with randomized delays (30-80ms) to appear natural.

### Storage
Using `chrome.storage.sync` for settings (synced across devices) and `chrome.storage.local` for usage statistics.

---

## Key UI/UX Details

### Button Placement
- YouTube: Right side of comment box, inline with formatting buttons
- Instagram: Near the "Post" button
- LinkedIn: Near the comment submit button
- X: Near the reply button

### Popup Behavior
- Appears near the clicked button
- Draggable with position saved per platform
- Closes on: outside click, Escape key, or successful insertion
- Stays open on: tone change, regenerate

### Tone Descriptions
- **Auto**: Matches the context and original commenter's style
- **Friendly**: Warm, positive, encouraging tone
- **Humorous**: Witty, playful responses with appropriate levity
- **Engaging**: Conversation-starting, question-asking, interactive

---

## Files to Create (in order)

1. `manifest.json`
2. `package.json`
3. `webpack.config.js`
4. `src/shared/constants.js`
5. `src/shared/storage.js`
6. `src/shared/api.js`
7. `src/content/utils/dom.js`
8. `src/content/utils/typing.js`
9. `src/content/platforms/base.js`
10. `src/content/platforms/youtube.js`
11. `src/content/platforms/instagram.js`
12. `src/content/platforms/linkedin.js`
13. `src/content/platforms/twitter.js`
14. `src/content/ui/styles.css`
15. `src/content/ui/button.js`
16. `src/content/ui/popup.js`
17. `src/content/index.js`
18. `src/background/service-worker.js`
19. `src/popup/popup.html`
20. `src/popup/popup.css`
21. `src/popup/popup.js`
22. `src/options/options.html`
23. `src/options/options.css`
24. `src/options/options.js`
25. Asset icons (placeholder PNGs)

---

## Estimated Complexity

| Phase | Complexity | Dependencies |
|-------|------------|--------------|
| Phase 1 | Low | None |
| Phase 2 | High | Phase 1 |
| Phase 3 | Medium | Phase 2 |
| Phase 4 | Medium | Phase 1 |
| Phase 5 | High | Phase 2, 3, 4 |
| Phase 6 | Low | Phase 1 |
| Phase 7 | Low | Phase 1 |
| Phase 8 | Medium | All |

---

## Ready to Build?

Once approved, I will implement this plan phase by phase, creating all necessary files and ensuring the extension works across all target platforms.
