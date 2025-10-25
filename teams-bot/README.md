# Dreamspace Teams Bot

A Microsoft Teams bot that integrates with the Dreamspace application to enable weekly check-ins via Adaptive Cards. Users can track their wins, challenges, and request help directly from Teams.

## Architecture Overview

- **Azure Function App**: Hosts the bot endpoint (Node.js 18)
- **Bot Framework v4**: Handles Teams messaging and card interactions
- **Cosmos DB**: Stores user data, conversation references, and check-ins
- **Multi-tenant Azure AD**: Supports users from any organization

### Components

```
teams-bot/
├── messages/              # Bot Framework handler (POST /api/messages)
├── cards/                 # Adaptive Card templates
├── services/              # Cosmos DB and user services
├── manifest/              # Teams app manifest and icons
└── setup scripts          # Azure resource provisioning
```

## Prerequisites

1. **Azure Subscription** with permissions to create:
   - Resource Groups
   - Function Apps
   - Storage Accounts
   - Azure Bot registrations
   - Azure AD App Registrations

2. **Existing Dreamspace Deployment**:
   - Cosmos DB account with `dreamspace` database
   - Existing containers: `users`, `items`, `teams`
   - Web app where users create their profiles

3. **Tools**:
   - Azure CLI (`az`) installed and logged in
   - Node.js 18+ (for local development)
   - Azure Functions Core Tools v4 (for local testing)
   - ngrok (for local Teams bot testing)

## Quick Start

### 1. Provision Azure Resources

Run the setup script (PowerShell on Windows, Bash on Linux/Mac):

**PowerShell:**
```powershell
cd teams-bot
./setup-azure-bot.ps1 -CosmosAccountName "your-cosmos-account-name"
```

**Bash:**
```bash
cd teams-bot
chmod +x setup-azure-bot.sh
./setup-azure-bot.sh rg-dreamspace eastus dreamspace-teams-bot dreamspace-bot-func your-cosmos-account-name
```

The script will:
- Create a Function App for the bot
- Create an Azure AD App Registration (multi-tenant)
- Create an Azure Bot registration
- Enable the Teams channel
- Create Cosmos DB containers (`botConversations`, `checkins`)
- Configure all necessary environment variables

**Save the output:** The script displays your App ID and App Secret - you'll need these!

### 2. Deploy Bot Code

```bash
# Install dependencies
npm install

# Deploy to Azure
func azure functionapp publish dreamspace-bot-func
```

### 3. Test the Bot Endpoint

```bash
curl https://dreamspace-bot-func.azurewebsites.net/api/messages
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Dreamspace Teams Bot",
  "cosmosConfigured": true,
  "timestamp": "2025-10-24T10:00:00.000Z"
}
```

### 4. Prepare Teams Manifest

1. Navigate to `manifest/` directory
2. Copy your logo as `color.png` (192x192px) and `outline.png` (32x32px)
3. Edit `manifest.json`:
   - Replace `{{MICROSOFT_APP_ID}}` with your App ID from setup script
   - Replace `{{FUNCTION_APP_DOMAIN}}` with `dreamspace-bot-func.azurewebsites.net`

4. Create package:
```bash
cd manifest/
zip dreamspace-teams-bot.zip manifest.json color.png outline.png
```

### 5. Upload to Teams

1. Go to [Teams Developer Portal](https://dev.teams.microsoft.com/apps)
2. Click "Import app"
3. Upload `dreamspace-teams-bot.zip`
4. Click "Install" to add to your Teams

### 6. Test in Teams

1. Open the Dreamspace bot in Teams
2. Bot sends welcome message
3. First, log into Dreamspace web app (to create user profile)
4. Return to Teams bot and type: `checkin`
5. Fill out the Adaptive Card and submit
6. Verify check-in is saved in Cosmos DB `checkins` container

## Local Development

### Setup

1. Copy environment variables:
```bash
cp local.settings.json local.settings.json.backup
```

2. Edit `local.settings.json` with your credentials:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_ENDPOINT": "https://YOUR-COSMOS.documents.azure.com:443/",
    "COSMOS_KEY": "your-cosmos-key",
    "MicrosoftAppId": "your-app-id",
    "MicrosoftAppPassword": "your-app-secret",
    "MicrosoftAppType": "MultiTenant"
  }
}
```

3. Install dependencies:
```bash
npm install
```

### Run Locally

```bash
# Start Azure Functions runtime
func start
```

The bot endpoint will be available at: `http://localhost:7071/api/messages`

### Test with Teams

Teams requires HTTPS endpoints. Use ngrok to expose your local server:

```bash
# In a new terminal
ngrok http 7071
```

Update your bot's messaging endpoint in Azure Portal:
1. Go to your Azure Bot resource
2. Navigate to "Configuration"
3. Update "Messaging endpoint" to: `https://YOUR-NGROK-URL.ngrok.io/api/messages`
4. Save changes

Now you can test the bot in Teams with your local code!

## Bot Commands

- **checkin** - Shows the weekly check-in Adaptive Card
- **help** - Displays available commands and help text
- **hi/hello** - Also shows help message

## Data Flow

### 1. User Authentication
```
User → Teams Bot → Extract aadObjectId → Query Cosmos DB users container
→ If found: Allow interaction
→ If not found: Show "Please log into web app first" message
```

### 2. Check-in Submission
```
User types "checkin" → Bot validates user → Sends Adaptive Card
→ User fills form → Submits card → Bot saves to checkins container
→ Confirmation message sent
```

### 3. Conversation Reference Storage
```
Any user interaction → Extract conversation reference
→ Save to botConversations container → Enable future proactive messaging
```

## Cosmos DB Schema

### Container: `botConversations`
**Partition Key:** `/userId`

```json
{
  "id": "userId-conversationId",
  "userId": "aad-object-id",
  "conversationReference": { /* Bot Framework conversation ref */ },
  "channelId": "msteams",
  "serviceUrl": "https://smba.trafficmanager.net/...",
  "scope": "personal",
  "updatedAt": "2025-10-24T10:00:00Z"
}
```

### Container: `checkins`
**Partition Key:** `/userId`

```json
{
  "id": "userId-timestamp",
  "userId": "aad-object-id",
  "type": "weekly_checkin",
  "win": "Completed 3 major features",
  "challenge": "Time management",
  "focused": true,
  "needHelp": false,
  "timestamp": "2025-10-24T10:00:00Z",
  "weekId": "2025-W43"
}
```

## Troubleshooting

### Bot Doesn't Respond

**Check the endpoint:**
```bash
curl https://YOUR-FUNCTION-APP.azurewebsites.net/api/messages
```

**Check Function App logs:**
```bash
func azure functionapp logstream dreamspace-bot-func
```

**Common issues:**
- Environment variables not set correctly
- Cosmos DB credentials incorrect
- Bot endpoint URL doesn't match in Azure Bot configuration

### "User Not Found" Error

This means the user hasn't logged into the Dreamspace web app yet.

**Solution:**
1. User must log into https://dreamspace.tylerstewart.co.za
2. This creates their user profile in Cosmos DB `users` container
3. Return to Teams bot and try again

### Adaptive Card Doesn't Render

**Check:**
- Card JSON schema is valid (use https://adaptivecards.io/designer)
- Card version (1.5) is supported by Teams
- No JavaScript errors in Teams developer console (F12)

### Card Submission Fails

**Check Function App logs for errors:**
```bash
az functionapp log tail -n dreamspace-bot-func -g rg-dreamspace
```

**Common causes:**
- Cosmos DB write permissions
- Invalid data format
- Network connectivity to Cosmos DB

## Security Considerations

1. **Multi-tenant Auth**: Bot supports users from any Azure AD tenant
2. **User Validation**: All requests validate user exists in Dreamspace
3. **Secure Storage**: Credentials stored in Function App settings (encrypted at rest)
4. **HTTPS Only**: Bot endpoint requires HTTPS (enforced by Bot Framework)

## Phase 2 Features (Future)

- [ ] **Proactive Messaging**: Timer-triggered function sends weekly check-in reminders
- [ ] **Teams SSO**: Add OAuth for auto-provisioning new users
- [ ] **Rich Notifications**: Alert users when coach comments on their goals
- [ ] **Team Analytics**: Dashboard showing team check-in completion rates
- [ ] **Message Extensions**: Search and share goals in Teams conversations
- [ ] **Meeting Integration**: Trigger check-ins during 1:1 meetings

## Cost Estimate (Azure)

- **Function App (Consumption)**: ~$5-10/month for moderate usage
- **Storage Account**: ~$1-2/month
- **Azure Bot**: Free for Standard channels
- **Cosmos DB**: Depends on existing account; ~$10/month for 2 new containers at 400 RU/s

Total additional cost: **~$15-25/month**

## Support

For issues or questions:
1. Check this README and troubleshooting section
2. Review Function App logs in Azure Portal
3. Check Bot Framework documentation: https://docs.microsoft.com/azure/bot-service/
4. Review Teams bot samples: https://github.com/microsoft/BotBuilder-Samples

## License

Same license as the main Dreamspace application.

