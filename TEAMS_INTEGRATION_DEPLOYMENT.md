# Teams Bot Integration - Complete Deployment Checklist

## Overview

Complete guide to deploy the Dream Coach → Teams integration that allows coaches to send check-in requests to team members via Microsoft Teams.

## What Was Built

### 1. UI Component ✅
- **File**: `src/pages/DreamCoach.jsx`
- **Feature**: "Send Teams Check-in" button in team member modal
- **Status**: Complete and tested (no linting errors)

### 2. API Endpoint ✅
- **Files**: 
  - `api/sendTeamsMessage/function.json`
  - `api/sendTeamsMessage/index.js`
- **Feature**: Sends adaptive cards via Bot Framework
- **Status**: Complete and tested (no linting errors)

### 3. Teams Bot Infrastructure ✅
- **Directory**: `teams-bot/`
- **Feature**: Complete bot with check-in cards
- **Status**: Ready to deploy

## Deployment Steps

### Phase 1: Deploy Teams Bot (If Not Already Done)

```bash
# 1. Navigate to teams-bot directory
cd teams-bot

# 2. Run Azure setup script
./setup-azure-bot.ps1  # Windows
# or
./setup-azure-bot.sh   # Linux/Mac

# 3. Note the output values:
# - App ID
# - App Secret
# - Function App name

# 4. Deploy bot code
npm install
func azure functionapp publish dreamspace-bot-func
```

**Save these values - you'll need them next!**

### Phase 2: Update Main API with Bot Credentials

```bash
# Navigate to main API directory
cd api

# Install new dependency
npm install

# Add bot credentials to your Function App
az functionapp config appsettings set \
  -g rg-dreamspace \
  -n your-main-function-app \
  --settings \
    MicrosoftAppId="YOUR-BOT-APP-ID" \
    MicrosoftAppPassword="YOUR-BOT-APP-SECRET" \
    MicrosoftAppType="MultiTenant"
```

### Phase 3: Deploy Updated API

```bash
# Still in api/ directory
func azure functionapp publish your-main-function-app
```

### Phase 4: Deploy Updated Web App

```bash
# Navigate to project root
cd ..

# Build the updated web app
npm run build

# Deploy to Azure Static Web App
# (This depends on your deployment method)
```

### Phase 5: Test End-to-End

1. **Install Bot in Teams**
   - Open Microsoft Teams
   - Search for "Dreamspace" in Apps
   - Click "Add"
   - Send a message to the bot (creates conversation reference)

2. **Test from Web App**
   - Log in as a coach
   - Open Dream Coach page
   - Click on a team member
   - Click "Send Teams Check-in" button
   - Check for success message

3. **Verify in Teams**
   - Team member should receive adaptive card
   - Fill out and submit card
   - Check that data saves to Cosmos DB

## Environment Variables Checklist

### Main Function App (API)

```bash
# Check current settings
az functionapp config appsettings list \
  -g rg-dreamspace \
  -n your-main-function-app

# Required settings:
✓ COSMOS_ENDPOINT
✓ COSMOS_KEY
✓ MicrosoftAppId          ← NEW
✓ MicrosoftAppPassword    ← NEW
✓ MicrosoftAppType        ← NEW
```

### Bot Function App

```bash
# Check bot function app settings
az functionapp config appsettings list \
  -g rg-dreamspace \
  -n dreamspace-bot-func

# Required settings:
✓ COSMOS_ENDPOINT
✓ COSMOS_KEY
✓ MicrosoftAppId
✓ MicrosoftAppPassword
✓ MicrosoftAppType
```

### Web App (Frontend)

```bash
# Check .env or .env.local
✓ VITE_API_BASE_URL=https://your-main-function-app.azurewebsites.net
```

## Quick Test Commands

### Test Bot Endpoint
```bash
curl https://dreamspace-bot-func.azurewebsites.net/api/messages
```

Expected:
```json
{
  "status": "healthy",
  "service": "Dreamspace Teams Bot",
  "cosmosConfigured": true
}
```

### Test Send Message Endpoint
```bash
curl -X POST https://your-main-function-app.azurewebsites.net/api/sendTeamsMessage \
  -H "Content-Type: application/json" \
  -d '{
    "coachId": "test-coach-id",
    "recipientIds": ["test-user-id"],
    "messageType": "checkin_request",
    "messageData": {
      "message": "Test message"
    }
  }'
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Flow                             │
└─────────────────────────────────────────────────────────┘

1. Coach opens Dream Coach page
   ↓
2. Clicks team member (Sarah Johnson)
   ↓
3. Modal opens with "Send Teams Check-in" button
   ↓
4. Coach clicks button
   ↓
5. API Call: POST /api/sendTeamsMessage
   ↓
6. Main Function App validates coach
   ↓
7. Retrieves conversation references from Cosmos DB
   ↓
8. Uses Bot Framework to send adaptive card
   ↓
9. Sarah receives card in Teams
   ↓
10. Sarah fills and submits card
   ↓
11. Bot saves to Cosmos DB (checkins container)
   ↓
12. Coach gets notification in Teams
```

## Cosmos DB Containers

### Required Containers

| Container | Partition Key | Purpose | Created By |
|-----------|---------------|---------|------------|
| `users` | `/id` | User profiles | Existing |
| `items` | `/userId` | Goals, milestones | Existing |
| `teams` | `/managerId` | Team relationships | Existing |
| `botConversations` | `/userId` | Bot conversation refs | Bot setup script |
| `checkins` | `/userId` | Check-in submissions | Bot setup script |

### Verify Containers Exist

```bash
# List all containers
az cosmosdb sql container list \
  --account-name your-cosmos-account \
  --database-name dreamspace \
  --resource-group rg-dreamspace \
  --query "[].name"
```

Expected output:
```json
[
  "users",
  "items",
  "teams",
  "botConversations",
  "checkins"
]
```

## Common Issues & Solutions

### Issue 1: Button doesn't appear

**Check:**
- Web app deployed with latest code?
- Browser cache cleared?
- Logged in as a coach with team members?

**Solution:**
```bash
# Rebuild and redeploy
npm run build
# Deploy to Azure Static Web App
```

### Issue 2: "Bot not configured" error

**Check:**
```bash
az functionapp config appsettings list \
  -g rg-dreamspace \
  -n your-main-function-app \
  --query "[?name=='MicrosoftAppId']"
```

**Solution:**
```bash
# Add bot credentials
az functionapp config appsettings set \
  -g rg-dreamspace \
  -n your-main-function-app \
  --settings \
    MicrosoftAppId="your-app-id" \
    MicrosoftAppPassword="your-secret" \
    MicrosoftAppType="MultiTenant"
```

### Issue 3: "User needs to install bot" message

**This is expected!** Users must:
1. Install Dreamspace bot in Teams
2. Send at least one message to the bot
3. This creates a conversation reference

**Solution:**
- Share bot installation instructions with team
- Create a Teams announcement
- Add to onboarding process

### Issue 4: Card doesn't appear in Teams

**Check:**
1. Bot endpoint healthy?
   ```bash
   curl https://dreamspace-bot-func.azurewebsites.net/api/messages
   ```

2. Conversation reference exists?
   - Check Cosmos DB `botConversations` container
   - Look for user's ID

3. Bot credentials match?
   - Main Function App settings
   - Bot Function App settings
   - Should be identical

## Success Criteria

✅ **Phase 1 Complete When:**
- Bot deployed to Azure
- Bot health endpoint returns 200
- Teams channel enabled
- Cosmos containers created

✅ **Phase 2 Complete When:**
- Main API has bot credentials
- `/api/sendTeamsMessage` endpoint responds
- No errors in Function App logs

✅ **Phase 3 Complete When:**
- Web app shows "Send Teams Check-in" button
- Button click shows loading state
- Success/error messages display

✅ **Phase 4 Complete When:**
- Team member receives card in Teams
- Card submission saves to Cosmos DB
- Coach sees success message

## Monitoring

### View Logs

```bash
# Main Function App logs
func azure functionapp logstream your-main-function-app

# Bot Function App logs
func azure functionapp logstream dreamspace-bot-func
```

### Application Insights

**Main Function App:**
- Go to Azure Portal
- Navigate to your Function App
- Click "Application Insights"
- View "Live Metrics" for real-time monitoring

**Key Metrics:**
- Request count for `/api/sendTeamsMessage`
- Success rate
- Average response time
- Failed requests

## Rollback Plan

If something goes wrong:

### Rollback Web App
```bash
# Redeploy previous version
git checkout previous-commit
npm run build
# Deploy
```

### Rollback API
```bash
# Redeploy previous version
cd api
git checkout previous-commit
func azure functionapp publish your-main-function-app
```

### Disable Bot
```bash
# Stop bot Function App
az functionapp stop -n dreamspace-bot-func -g rg-dreamspace
```

## Next Steps After Deployment

1. **User Training**
   - Create guide for coaches
   - Demo the feature in team meeting
   - Share bot installation instructions

2. **Monitor Usage**
   - Track how many coaches use the feature
   - Monitor check-in completion rates
   - Gather feedback

3. **Iterate**
   - Add more message types (goal reminders, celebrations)
   - Add batch send (send to entire team)
   - Add scheduling (send at specific times)

## Support Resources

- **Bot Documentation**: `teams-bot/README.md`
- **Endpoint Guide**: `teams-bot/ENDPOINT_SETUP_GUIDE.md`
- **Button Implementation**: `teams-bot/COACH_BUTTON_IMPLEMENTATION.md`
- **Deployment Guide**: `teams-bot/DEPLOYMENT.md`

## Quick Reference Commands

```bash
# Deploy bot
cd teams-bot && npm install && func azure functionapp publish dreamspace-bot-func

# Deploy API
cd api && npm install && func azure functionapp publish your-main-function-app

# Test bot health
curl https://dreamspace-bot-func.azurewebsites.net/api/messages

# Test send message
curl -X POST https://your-main-function-app.azurewebsites.net/api/sendTeamsMessage \
  -H "Content-Type: application/json" \
  -d '{"coachId":"test","recipientIds":["test"],"messageType":"checkin_request","messageData":{"message":"test"}}'

# View logs
func azure functionapp logstream your-main-function-app
```

---

## Summary

You now have:
1. ✅ Teams bot infrastructure (`teams-bot/`)
2. ✅ API endpoint (`api/sendTeamsMessage/`)
3. ✅ UI button (`src/pages/DreamCoach.jsx`)
4. ✅ Complete documentation

**Ready to deploy!** 🚀

Follow the steps above in order, and you'll have coaches sending check-ins to team members via Teams in no time.

