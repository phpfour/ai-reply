# Publishing Smart Reply to Chrome Web Store

## Prerequisites

1. **Google Developer Account**
   - Go to: https://chrome.google.com/webstore/devconsole
   - Pay the one-time $5 registration fee
   - Complete account verification

2. **OpenAI API** (for testing)
   - Get an API key from https://platform.openai.com

## Step 1: Prepare Assets

### Required Images

| Asset | Size | Format | Notes |
|-------|------|--------|-------|
| Store Icon | 128x128 px | PNG | High-res version of extension icon |
| Screenshot 1-5 | 1280x800 or 640x400 | PNG/JPG | Show key features |
| Small Promo Tile | 440x280 | PNG | For store listing |

### Create Icons from SVG

Use the SVG in `assets/icon.svg` to create PNG versions:

```bash
# Using ImageMagick (install: brew install imagemagick)
convert -background none -resize 128x128 assets/icon.svg assets/icons/icon128.png
convert -background none -resize 48x48 assets/icon.svg assets/icons/icon48.png
convert -background none -resize 16x16 assets/icon.svg assets/icons/icon16.png

# Or use an online tool like:
# - https://svgtopng.com/
# - https://cloudconvert.com/svg-to-png
```

### Screenshot Tips
- Show the popup on a real LinkedIn/Twitter post
- Highlight the tone selector
- Show the settings page
- Use a clean, professional browser window
- Remove any personal information from screenshots

## Step 2: Build the Package

```bash
# Build and create ZIP
npm run package

# This creates: smart-reply-extension.zip
```

## Step 3: Test Before Publishing

1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` folder
4. Test on all platforms:
   - [ ] LinkedIn posts
   - [ ] Twitter/X tweets
   - [ ] YouTube comments
   - [ ] Instagram posts
5. Verify settings save/load correctly
6. Test with different AI models

## Step 4: Submit to Chrome Web Store

1. **Go to Developer Dashboard**
   https://chrome.google.com/webstore/devconsole

2. **Click "New Item"**

3. **Upload ZIP**
   Upload `smart-reply-extension.zip`

4. **Fill Store Listing**
   - Copy content from `STORE_LISTING.md`
   - Upload screenshots and icons
   - Select category: **Productivity**
   - Select language: **English**

5. **Privacy Tab**
   - Host your privacy policy (use `PRIVACY_POLICY.md`)
   - Options:
     - GitHub Pages: Create a repo and host the markdown
     - Your own website
     - Privacy policy hosting services
   - Declare permissions usage
   - Answer data handling questions

6. **Pricing & Distribution**
   - Select **Free**
   - Choose countries (usually "All regions")
   - Select visibility (Public)

7. **Submit for Review**
   - Review typically takes 1-3 business days
   - You'll receive email updates

## Step 5: Post-Publish

### Update Process
1. Increment version in `manifest.json`
2. Run `npm run package`
3. Upload new ZIP in Developer Dashboard
4. Submit for review

### Monitor
- Check reviews and ratings
- Respond to user feedback
- Monitor for reported issues

## Common Rejection Reasons

1. **Missing Privacy Policy**
   - Must be accessible via public URL
   - Must explain data collection

2. **Excessive Permissions**
   - Only request necessary permissions
   - Explain each permission in the description

3. **Broken Functionality**
   - Test thoroughly before submitting
   - Ensure all platforms work

4. **Policy Violations**
   - No misleading descriptions
   - No impersonation
   - No spam functionality

## Files Checklist

```
smart-reply-extension/
├── dist/                    # Built extension (uploaded as ZIP)
├── assets/
│   ├── icon.svg            # Source icon
│   ├── icons/
│   │   ├── icon16.png      # ✓ Required
│   │   ├── icon48.png      # ✓ Required
│   │   └── icon128.png     # ✓ Required
│   ├── screenshot-1.png    # For store listing
│   ├── screenshot-2.png
│   ├── promo-small.png     # 440x280
│   └── promo-large.png     # 920x680 (optional)
├── PRIVACY_POLICY.md       # ✓ Created
├── STORE_LISTING.md        # ✓ Created
└── manifest.json           # ✓ Version info
```

## Useful Links

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Publishing Documentation](https://developer.chrome.com/docs/webstore/publish/)
- [Best Practices](https://developer.chrome.com/docs/webstore/best_practices/)
- [Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
