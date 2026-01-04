# Smart Reply - AI-Powered Social Media Replies

A Chrome extension that generates intelligent, context-aware replies for YouTube, Instagram, LinkedIn, and X (Twitter) in seconds.

## Features

- **Multiple AI Suggestions**: Get 3+ reply options for every comment or post
- **Tone Control**: Choose from Auto, Friendly, Humorous, or Engaging tones
- **Context-Aware**: Leverages video titles, post captions, and descriptions
- **Draggable Popup**: Position anywhere on screen, insert with one click
- **Typing Simulation**: Natural character-by-character insertion for platforms that require it
- **Usage Statistics**: Track your reply generation and usage patterns
- **Cross-Platform**: Works on YouTube, Instagram, LinkedIn, and X (Twitter)

## Installation

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-reply.git
   cd ai-reply
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development Mode

Run the build in watch mode for development:
```bash
npm run dev
```

## Configuration

1. Click the extension icon in Chrome
2. Go to Settings (gear icon)
3. Enter your OpenAI API key
4. Configure your preferred default tone
5. Enable/disable platforms as needed

## How It Works

1. **Navigate** to a supported platform (YouTube, Instagram, LinkedIn, or X)
2. **Find** a comment box or reply input
3. **Click** the sparkle button (✨) that appears near the input
4. **Choose** from the generated AI suggestions
5. **Select** your preferred tone if needed
6. **Insert** the reply with one click

## Project Structure

```
ai-reply/
├── manifest.json          # Chrome extension manifest v3
├── package.json           # Node.js dependencies
├── webpack.config.js      # Build configuration
├── src/
│   ├── background/        # Service worker
│   ├── content/           # Content scripts
│   │   ├── platforms/     # Platform-specific handlers
│   │   ├── ui/            # UI components
│   │   └── utils/         # Utility functions
│   ├── popup/             # Extension popup (stats)
│   ├── options/           # Settings page
│   └── shared/            # Shared utilities
├── assets/
│   └── icons/             # Extension icons
└── dist/                  # Built extension
```

## Supported Platforms

| Platform | Comment Support | Reply Support | Context Extraction |
|----------|----------------|---------------|-------------------|
| YouTube | ✅ | ✅ | Video title, description, channel |
| Instagram | ✅ | ✅ | Post caption, author |
| LinkedIn | ✅ | ✅ | Post content, author |
| X (Twitter) | ✅ | ✅ | Tweet content, author |

## Tone Options

- **Auto**: Matches the context and original commenter's style
- **Friendly**: Warm, positive, and encouraging
- **Humorous**: Witty and playful with appropriate levity
- **Engaging**: Conversation-starting and interactive

## API Requirements

This extension requires an OpenAI API key to generate AI-powered replies.

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Enter it in the extension settings
3. The extension uses GPT-4o-mini by default for cost-effective replies

## Privacy

- Your API key is stored locally in Chrome's secure storage
- No data is sent to any servers except OpenAI's API
- Usage statistics are stored locally only
- No personal information is collected

## Development

### Build Commands

```bash
npm run build    # Production build
npm run dev      # Development watch mode
npm run clean    # Clean dist folder
```

### Adding New Platforms

1. Create a new handler in `src/content/platforms/`
2. Extend the `BasePlatform` class
3. Implement required methods:
   - `getInputSelectors()`
   - `setupObservers()`
   - `extractContext()`
4. Register in `src/content/index.js`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
