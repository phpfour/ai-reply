# Privacy Policy for Smart Reply Extension

**Last Updated:** January 2025

## Overview

Smart Reply ("the Extension") is a browser extension that helps users generate AI-powered replies on social media platforms. This privacy policy explains how we handle your data.

## Data Collection

### Data We Collect
The Extension collects and stores the following data **locally on your device**:

1. **API Key**: Your OpenAI API key (stored in Chrome's sync storage)
2. **User Preferences**: Settings like preferred tone, typing speed, enabled platforms
3. **User Profile** (optional): Nickname, occupation, bio, and custom instructions you provide
4. **Usage Statistics**: Anonymous counts of replies generated (stored locally)
5. **Debug Logs**: Recent API requests/responses for troubleshooting (stored locally, last 10 only)

### Data We Do NOT Collect
- We do **not** collect or transmit your personal data to our servers
- We do **not** store your social media credentials
- We do **not** track your browsing history
- We do **not** sell or share any data with third parties

## Data Processing

### How Your Data Is Used
1. **Post Content**: When you click to generate replies, the Extension reads the visible post/comment content and sends it to OpenAI's API to generate suggestions. This data is sent directly to OpenAI and is subject to [OpenAI's Privacy Policy](https://openai.com/privacy/).

2. **API Key**: Your OpenAI API key is used solely to authenticate requests to OpenAI's API. It is stored locally using Chrome's secure storage and never transmitted to any other service.

3. **Personalization Data**: If you provide your name, occupation, or bio, this information is included in prompts sent to OpenAI to personalize replies.

## Third-Party Services

The Extension uses **OpenAI's API** to generate reply suggestions. When you use the Extension:
- Post content you're replying to is sent to OpenAI
- Your personalization settings (if configured) are sent to OpenAI
- OpenAI processes this data according to their [Terms of Use](https://openai.com/terms/) and [Privacy Policy](https://openai.com/privacy/)

## Data Storage

All data is stored locally on your device using Chrome's storage APIs:
- `chrome.storage.sync`: Settings and API key (synced across your Chrome browsers)
- `chrome.storage.local`: Usage statistics and debug logs (local only)

## Data Retention

- Settings persist until you uninstall the Extension or reset them
- Debug logs are limited to the 10 most recent entries
- All data is deleted when you uninstall the Extension

## Your Rights

You can:
- **View** your stored data in the Extension's settings page
- **Delete** your data by using "Reset to Defaults" or uninstalling the Extension
- **Clear** debug logs using the "Clear" button in settings

## Permissions Explained

The Extension requires these permissions:

| Permission | Why It's Needed |
|------------|-----------------|
| `storage` | Save your settings and API key locally |
| `activeTab` | Read post content on the current tab when you click the reply button |
| Host permissions (YouTube, Instagram, LinkedIn, Twitter) | Inject the reply button UI on these platforms |

## Security

- Your API key is stored using Chrome's encrypted storage
- All communication with OpenAI uses HTTPS encryption
- The Extension does not have a backend server - all processing happens locally or via OpenAI

## Children's Privacy

The Extension is not intended for use by children under 13 years of age.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last Updated" date above.

## Contact

If you have questions about this privacy policy, please open an issue on our GitHub repository or contact us at [your-email@example.com].

---

By using Smart Reply, you agree to this privacy policy and OpenAI's terms of service.
