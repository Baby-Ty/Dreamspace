# Teams App Manifest

This directory contains the Teams app manifest and required assets for uploading to the Teams Developer Portal or deploying via Teams Toolkit.

## Required Files

1. **manifest.json** - App manifest configuration (replace placeholders before packaging)
2. **color.png** - 192x192px full-color icon
3. **outline.png** - 32x32px transparent outline icon

## Before Packaging

Replace the following placeholders in `manifest.json`:

- `{{MICROSOFT_APP_ID}}` - Your Azure AD App ID (from setup script output)
- `{{FUNCTION_APP_DOMAIN}}` - Your Function App domain (e.g., `dreamspace-bot-func.azurewebsites.net`)

## Icon Requirements

### color.png (192x192px)
- Full-color version of your app icon
- Used in Teams app store and various UI locations
- Should match your brand colors (#ED1C24 for Dreamspace)

### outline.png (32x32px)
- Transparent PNG with white outline
- Used in Teams UI where small icons are needed
- Should be recognizable at small sizes

## Creating the Package

### Method 1: Manual ZIP
```bash
cd manifest/
# After adding icons and updating manifest.json
zip -r dreamspace-teams-bot.zip manifest.json color.png outline.png
```

### Method 2: Teams Toolkit (VS Code)
1. Install Teams Toolkit extension
2. Open this directory in VS Code
3. Use "Teams: Zip Teams App Package" command

## Uploading to Teams

### For Development/Testing
1. Go to https://dev.teams.microsoft.com/apps
2. Click "Import app"
3. Upload your ZIP file
4. Fill in any required information
5. Click "Install" to test in your Teams tenant

### For Organization Distribution
1. Upload to your organization's Teams app catalog
2. Submit for admin approval if required
3. Users can install from "Built for your org" section

## Manifest Fields Explained

- **id**: Must match your Azure AD App ID
- **packageName**: Unique identifier (reverse domain format)
- **version**: Increment for each update
- **bots.botId**: Must match your Azure AD App ID
- **bots.scopes**: "personal" for 1:1 chats, "team" for channel installations
- **validDomains**: Domains the app can navigate to (include your Function App domain)
- **permissions**: "identity" allows access to user's AAD identity

## Testing Checklist

- [ ] Manifest validation passes (use Teams Developer Portal validator)
- [ ] Icons display correctly in Teams
- [ ] Bot responds to messages in personal scope
- [ ] Bot responds to messages in team scope (if enabled)
- [ ] Commands appear in Teams command menu
- [ ] Adaptive cards render properly
- [ ] Card submissions work correctly

## Troubleshooting

**Bot doesn't respond:**
- Verify the bot endpoint is accessible: `https://YOUR-FUNCTION-APP.azurewebsites.net/api/messages`
- Check Azure Function App logs for errors
- Ensure App ID in manifest matches bot registration

**Icons don't display:**
- Verify PNG files are correct dimensions
- Check file names are exactly `color.png` and `outline.png`
- Ensure files are included in ZIP package

**Can't install app:**
- Check manifest validation in Teams Developer Portal
- Verify all required fields are filled
- Ensure valid domains are correct

