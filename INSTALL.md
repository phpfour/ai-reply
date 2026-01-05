# Installing Smart Reply (Developer Mode)

Install and use Smart Reply before it's available on the Chrome Web Store.

## Prerequisites

- **Google Chrome** browser (or Chromium-based browser like Edge, Brave)
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)

## Installation Steps

### 1. Download the Extension

**Option A: Clone with Git**
```bash
git clone https://github.com/your-username/ai-reply.git
cd ai-reply
```

**Option B: Download ZIP**
- Download the repository as ZIP
- Extract to a folder

### 2. Build the Extension

```bash
# Install dependencies
npm install

# Build the extension
npm run build
```

This creates a `dist` folder with the compiled extension.

### 3. Load in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `dist` folder from the project

![Load Extension](https://developer.chrome.com/static/docs/extensions/get-started/tutorial/hello-world/image/load-unpacked-extensio-fc2e8fe498892.png)

### 4. Configure the Extension

1. Click the **puzzle piece** icon in Chrome toolbar
2. Find **Smart Reply** and click the **pin** icon to keep it visible
3. Click the **Smart Reply** icon → **Settings** (or right-click → Options)
4. Enter your **OpenAI API Key**
5. (Optional) Configure personalization settings
6. Click **Save Settings**

## Usage

### Generating Replies

1. Go to any supported platform:
   - LinkedIn
   - X (Twitter)
   - YouTube
   - Instagram

2. Click on a comment/reply box

3. Look for the **✨ sparkle button** next to the input field

4. Click it to open the Smart Reply popup

5. Select your preferred **tone** (Auto, Friendly, Humorous, Engaging)

6. Click **Generate**

7. Choose from 3 AI-generated suggestions

8. Click a suggestion to insert it, or copy it manually

### Settings Overview

| Setting | Description |
|---------|-------------|
| **API Key** | Your OpenAI API key (required) |
| **AI Model** | Choose GPT-5, GPT-4, o1, etc. |
| **Default Tone** | Pre-selected tone for replies |
| **Max Context Length** | How much post content to analyze (500-8000 chars) |
| **Max Completion Tokens** | Token limit for AI response (1000-16000) |
| **Personalization** | Your name, occupation, bio for personalized replies |
| **Custom Instructions** | Special rules for the AI to follow |

## Updating the Extension

When there are updates:

```bash
# Pull latest changes (if using git)
git pull

# Rebuild
npm run build
```

Then go to `chrome://extensions` and click the **reload** icon on Smart Reply.

## Troubleshooting

### "API key not configured"
→ Go to Settings and enter your OpenAI API key

### Button doesn't appear
→ Try refreshing the page, or check if the platform is enabled in settings

### Empty or generic replies
1. Go to Settings → Debug Log
2. Click Refresh to see the last API request
3. Check if post content is being captured
4. Try increasing "Max Context Length"
5. Try increasing "Max Completion Tokens" (especially for GPT-5 models)

### "Empty response from API"
→ Increase "Max Completion Tokens" in settings (GPT-5 models need 4000+)

### Extension not working after Chrome update
→ Go to `chrome://extensions`, click reload on Smart Reply

## Uninstalling

1. Go to `chrome://extensions`
2. Find Smart Reply
3. Click **Remove**

## Development Mode

For active development with auto-reload:

```bash
npm run dev
```

This watches for file changes and rebuilds automatically.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-username/ai-reply/issues)
- **Email**: your-email@example.com

---

## Quick Reference

| Action | How To |
|--------|--------|
| Open settings | Click extension icon → Settings |
| Generate reply | Click ✨ button in comment box |
| Change tone | Select from dropdown in popup |
| View debug logs | Settings → Debug Log → Refresh |
| Reload extension | `chrome://extensions` → reload icon |
