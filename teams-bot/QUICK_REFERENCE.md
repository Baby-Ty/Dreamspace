# Dreamspace Teams Bot - Quick Reference

## Common Commands

### Deploy Bot to Azure
```bash
cd teams-bot
npm install
func azure functionapp publish dreamspace-bot-func
```

### Test Health Endpoint
```bash
curl https://dreamspace-bot-func.azurewebsites.net/api/messages
```

### View Live Logs
```bash
func azure functionapp logstream dreamspace-bot-func
```

### Update Environment Variables
```bash
az functionapp config appsettings set \
  -g rg-dreamspace \
  -n dreamspace-bot-func \
  --settings "KEY=value"
```

### View Current Settings
```bash
az functionapp config appsettings list \
  -g rg-dreamspace \
  -n dreamspace-bot-func
```

## Bot Commands (In Teams)

- `checkin` - Start weekly check-in
- `help` - Show help message
- `hi` / `hello` - Show help message

## Project Structure

```
teams-bot/
├── messages/index.js          # Main bot handler
├── services/
│   ├── cosmosService.js       # DB operations
│   └── userService.js         # User validation
├── cards/weeklyCheckin.js     # Adaptive Card template
├── manifest/                  # Teams app package
└── setup-azure-bot.ps1/sh     # Deployment script
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `COSMOS_ENDPOINT` | Cosmos DB endpoint | `https://....documents.azure.com:443/` |
| `COSMOS_KEY` | Cosmos DB key | `long-base64-string` |
| `MicrosoftAppId` | Azure AD App ID | `guid` |
| `MicrosoftAppPassword` | App secret | `random-string` |
| `MicrosoftAppType` | Auth type | `MultiTenant` |

## Cosmos DB Containers

| Container | Partition Key | Purpose |
|-----------|---------------|---------|
| `users` | `/id` | User profiles (existing) |
| `botConversations` | `/userId` | Conversation references |
| `checkins` | `/userId` | Check-in submissions |

## Troubleshooting Quick Fixes

### Bot not responding
```bash
# Check logs
func azure functionapp logstream dreamspace-bot-func

# Verify endpoint
curl https://dreamspace-bot-func.azurewebsites.net/api/messages
```

### "User not found" error
- User must log into Dreamspace web app first
- Check `users` container in Cosmos DB for user's AAD ID

### Card doesn't submit
- Check Function logs for errors
- Verify `checkins` container exists
- Check Cosmos DB credentials in Function settings

### Deployment fails
```bash
# Reinstall dependencies
npm install

# Force redeploy
func azure functionapp publish dreamspace-bot-func --force
```

## Local Development

```bash
# Start local Functions runtime
func start

# In another terminal, expose with ngrok
ngrok http 7071

# Update bot endpoint in Azure Portal to ngrok URL
```

## Updating the Manifest

1. Edit `manifest/manifest.json`
2. Increment version (e.g., "1.0.0" → "1.0.1")
3. Package: `zip dreamspace-teams-bot.zip manifest.json color.png outline.png`
4. Upload to [Teams Developer Portal](https://dev.teams.microsoft.com/apps)

## Getting Bot Credentials

If you lost your App ID or need to reset the secret:

```bash
# Get App ID
az ad app list --display-name "Dreamspace Teams Bot" --query "[0].appId" -o tsv

# Reset secret (generates new one)
az ad app credential reset --id YOUR-APP-ID --append
```

## Monitoring URLs

- **Azure Portal Function App**: `https://portal.azure.com/#@TENANT/resource/subscriptions/SUB/resourceGroups/rg-dreamspace/providers/Microsoft.Web/sites/dreamspace-bot-func`
- **Teams Developer Portal**: `https://dev.teams.microsoft.com/apps`
- **Cosmos DB Data Explorer**: `https://portal.azure.com/#@TENANT/resource/.../dataExplorer`

## Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/messages` | GET | Health check |
| `/api/messages` | POST | Bot Framework handler |

## Support Contacts

- Azure Issues: Check Function App logs and Application Insights
- Teams Issues: Teams Developer Portal support
- User Issues: Verify they've logged into web app

## Useful Links

- [Bot Framework Docs](https://docs.microsoft.com/azure/bot-service/)
- [Teams Platform Docs](https://docs.microsoft.com/microsoftteams/platform/)
- [Adaptive Cards Designer](https://adaptivecards.io/designer)
- [Azure Functions Docs](https://docs.microsoft.com/azure/azure-functions/)

