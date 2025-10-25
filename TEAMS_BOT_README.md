# Teams Bot Integration

The Dreamspace application now includes a Microsoft Teams bot for weekly check-ins via Adaptive Cards.

## Location

All Teams bot code and configuration is in the `teams-bot/` directory.

## What It Does

The Teams bot allows users to:
- Receive weekly check-in prompts directly in Teams
- Submit wins, challenges, and request help via Adaptive Cards
- Store check-in data in Cosmos DB alongside other Dreamspace data

## Architecture

- **Separate deployment**: The bot runs in its own Azure Function App
- **Shared database**: Uses the same Cosmos DB as the main Dreamspace app
- **User validation**: Only users who have logged into the web app can use the bot
- **Multi-tenant**: Supports users from any Azure AD organization

## Key Features

### Phase 1 (Current)
✅ Bot endpoint with health check  
✅ User validation against Cosmos DB  
✅ Weekly check-in Adaptive Card  
✅ Check-in data storage  
✅ Conversation reference tracking  
✅ Both personal and team scopes  

### Phase 2 (Planned)
⏳ Proactive weekly reminders  
⏳ Teams SSO for auto-provisioning  
⏳ Coach notifications  
⏳ Team analytics dashboard  

## Quick Start

### Prerequisites
- Azure subscription
- Existing Dreamspace Cosmos DB account
- Azure CLI installed

### Deploy

```bash
# 1. Provision Azure resources
cd teams-bot
./setup-azure-bot.ps1  # Windows
# or
./setup-azure-bot.sh   # Linux/Mac

# 2. Deploy bot code
npm install
func azure functionapp publish dreamspace-bot-func

# 3. Create Teams app package
cd manifest/
# Add icons (color.png, outline.png)
# Update manifest.json with your App ID
zip dreamspace-teams-bot.zip manifest.json color.png outline.png

# 4. Upload to Teams Developer Portal
# https://dev.teams.microsoft.com/apps
```

## Documentation

Comprehensive documentation is available in the `teams-bot/` directory:

- **[README.md](teams-bot/README.md)** - Complete bot documentation
- **[DEPLOYMENT.md](teams-bot/DEPLOYMENT.md)** - Step-by-step deployment guide
- **[QUICK_REFERENCE.md](teams-bot/QUICK_REFERENCE.md)** - Common commands and troubleshooting
- **[manifest/README.md](teams-bot/manifest/README.md)** - Teams manifest configuration

## Data Storage

The bot creates two new Cosmos DB containers in the existing `dreamspace` database:

| Container | Partition Key | Purpose |
|-----------|---------------|---------|
| `botConversations` | `/userId` | Stores conversation references for proactive messaging |
| `checkins` | `/userId` | Stores weekly check-in submissions |

Check-in data includes:
- User's biggest win
- Biggest challenge
- Whether they stayed focused on goals
- Whether they need help
- Timestamp and week ID (ISO 8601 format)

## Integration with Main App

### Current Integration
- Bot validates users against the `users` container (same as web app)
- Check-in data stored in `checkins` container
- Uses same Cosmos DB account and credentials

### Future Integration (Phase 2)
- Display check-in history in web app
- Send Teams notifications when coach comments
- Coach can see check-in summaries in People Hub
- Analytics dashboard showing check-in completion rates

## Development Workflow

### Local Development
```bash
cd teams-bot
npm install
func start
# Use ngrok to expose local endpoint for Teams testing
```

### Making Changes
```bash
# Update code
cd teams-bot
# Make your changes

# Redeploy
func azure functionapp publish dreamspace-bot-func
```

### Updating Manifest
- Edit `teams-bot/manifest/manifest.json`
- Increment version number
- Recreate ZIP package
- Upload to Teams Developer Portal

## User Flow

1. **First Time Setup**:
   - User installs Dreamspace bot from Teams
   - Bot sends welcome message
   - User logs into Dreamspace web app (creates profile)

2. **Using the Bot**:
   - User types `checkin` in Teams
   - Bot validates user exists in Cosmos DB
   - Bot sends Adaptive Card
   - User fills form and submits
   - Bot saves to `checkins` container
   - Bot sends confirmation

3. **If User Not Found**:
   - Bot explains user must log into web app first
   - Provides guidance on creating profile

## Security

- **Multi-tenant Azure AD**: Bot supports users from any organization
- **User validation**: All interactions validate user exists in Dreamspace
- **Secure credentials**: All secrets stored in Function App settings (encrypted)
- **HTTPS only**: Bot endpoint requires HTTPS (enforced by Bot Framework)

## Cost

Additional Azure costs for the bot:
- **Function App**: ~$5-10/month (Consumption plan)
- **Storage Account**: ~$1-2/month
- **Azure Bot**: Free for standard channels
- **Cosmos DB**: ~$10/month (2 new containers at 400 RU/s)

**Total: ~$15-25/month additional**

## Monitoring

- **Function App logs**: `func azure functionapp logstream dreamspace-bot-func`
- **Health endpoint**: `https://dreamspace-bot-func.azurewebsites.net/api/messages`
- **Application Insights**: Enabled on Function App
- **Cosmos DB metrics**: Monitor RU/s usage in Azure Portal

## Troubleshooting

Common issues and solutions are documented in:
- `teams-bot/README.md` - Comprehensive troubleshooting section
- `teams-bot/DEPLOYMENT.md` - Deployment-specific issues
- `teams-bot/QUICK_REFERENCE.md` - Quick fixes

## Support

For issues or questions:
1. Check documentation in `teams-bot/` directory
2. Review Function App logs in Azure Portal
3. Check Bot Framework documentation
4. Review Teams platform documentation

## Contributing

When making changes to the bot:
1. Test locally first using Azure Functions Core Tools
2. Use ngrok for Teams integration testing
3. Deploy to a test Function App before production
4. Update documentation if adding new features
5. Increment manifest version when updating Teams app

## Related Files

In the main app that relate to the bot:
- `src/pages/labs/AdaptiveCards.jsx` - UI mockups of the cards
- `api/` - Reference for existing Azure Functions patterns
- `docs-deployment/` - General Azure deployment guides

## License

Same license as the main Dreamspace application.

