# API Endpoint Setup Guide

## Overview

The `api/sendTeamsMessage` endpoint allows Dream Coaches to send adaptive cards and messages to their team members via Microsoft Teams.

## Files Created

### 1. `api/sendTeamsMessage/function.json`
Azure Function binding configuration for HTTP POST endpoint.

### 2. `api/sendTeamsMessage/index.js` (350+ lines)
Main endpoint logic that:
- Validates coach and recipients
- Retrieves conversation references from Cosmos DB
- Builds appropriate adaptive cards
- Sends messages via Bot Framework
- Returns detailed results

### 3. Updated `api/package.json`
Added `botbuilder` dependency for Bot Framework integration.

## Environment Variables Required

The endpoint needs these variables in your Azure Function App settings:

### Cosmos DB (Already Configured)
```
COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key
```

### Bot Framework (New - From Teams Bot Setup)
```
MicrosoftAppId=your-bot-app-id
MicrosoftAppPassword=your-bot-app-secret
MicrosoftAppType=MultiTenant
```

## Deployment Steps

### Step 1: Install Dependencies

```bash
cd api
npm install
```

This will install the new `botbuilder` package.

### Step 2: Configure Environment Variables

#### Local Development (`api/local.settings.json`)
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_ENDPOINT": "https://your-cosmos.documents.azure.com:443/",
    "COSMOS_KEY": "your-cosmos-key",
    "MicrosoftAppId": "your-bot-app-id",
    "MicrosoftAppPassword": "your-bot-app-secret",
    "MicrosoftAppType": "MultiTenant"
  }
}
```

#### Azure Function App Settings
```bash
# Add bot credentials to your existing Function App
az functionapp config appsettings set \
  -g rg-dreamspace \
  -n your-function-app \
  --settings \
    MicrosoftAppId="your-bot-app-id" \
    MicrosoftAppPassword="your-bot-app-secret" \
    MicrosoftAppType="MultiTenant"
```

**Note:** Get these values from the Teams bot setup script output.

### Step 3: Deploy to Azure

```bash
cd api
func azure functionapp publish your-function-app-name
```

### Step 4: Verify Deployment

Test the endpoint:

```bash
curl -X POST https://your-function-app.azurewebsites.net/api/sendTeamsMessage \
  -H "Content-Type: application/json" \
  -d '{
    "coachId": "test-coach-id",
    "recipientIds": ["test-user-id"],
    "messageType": "checkin_request",
    "messageData": {
      "message": "Test check-in request"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "notInstalled": 0,
  "details": {
    "sentTo": ["test-user-id"],
    "failedTo": [],
    "notInstalledUsers": []
  }
}
```

## API Reference

### Endpoint
```
POST /api/sendTeamsMessage
```

### Request Body

```typescript
{
  coachId: string;           // Azure AD Object ID of the coach
  recipientIds: string[];    // Array of user IDs to send to
  messageType: string;       // 'checkin_request' | 'goal_reminder' | 'celebration' | 'custom_message'
  messageData: {
    message: string;         // Main message text
    goalId?: string;         // Optional: Goal ID for goal reminders
    goalTitle?: string;      // Optional: Goal title
    dueDate?: string;        // Optional: Due date
    progress?: number;       // Optional: Progress percentage
  }
}
```

### Response

```typescript
{
  success: boolean;
  sent: number;              // Count of successfully sent messages
  failed: number;            // Count of failed sends
  notInstalled: number;      // Count of users without bot installed
  details: {
    sentTo: string[];        // User IDs that received the message
    failedTo: Array<{        // Failed sends with error details
      userId: string;
      error: string;
    }>;
    notInstalledUsers: string[]; // User IDs without bot
  }
}
```

## Message Types

### 1. Check-in Request (`checkin_request`)

Sends an adaptive card with input fields for:
- Biggest win this week
- Biggest challenge
- Stayed focused on goals (toggle)
- Need help from coach (toggle)

**Example:**
```json
{
  "coachId": "coach-123",
  "recipientIds": ["user-456"],
  "messageType": "checkin_request",
  "messageData": {
    "message": "Time for your weekly check-in!"
  }
}
```

### 2. Goal Reminder (`goal_reminder`)

Sends a reminder about goals with optional details.

**Example:**
```json
{
  "coachId": "coach-123",
  "recipientIds": ["user-456"],
  "messageType": "goal_reminder",
  "messageData": {
    "message": "Don't forget about your Q4 goals!",
    "goalTitle": "Complete certification",
    "dueDate": "2025-12-31",
    "progress": 75
  }
}
```

### 3. Celebration (`celebration`)

Sends a celebration message for achievements.

**Example:**
```json
{
  "coachId": "coach-123",
  "recipientIds": ["user-456"],
  "messageType": "celebration",
  "messageData": {
    "message": "Congratulations on completing your goal! 🎉"
  }
}
```

### 4. Custom Message (`custom_message`)

Sends a plain text message.

**Example:**
```json
{
  "coachId": "coach-123",
  "recipientIds": ["user-456"],
  "messageType": "custom_message",
  "messageData": {
    "message": "Great work this week! Keep it up!"
  }
}
```

## Error Handling

### Common Errors

#### 1. Missing Bot Credentials
```json
{
  "error": "Bot not configured",
  "details": "MicrosoftAppId and MicrosoftAppPassword environment variables are required"
}
```

**Solution:** Add bot credentials to Function App settings.

#### 2. User Not Found
```json
{
  "error": "Coach not found"
}
```

**Solution:** Ensure the coachId matches a user in the `users` container.

#### 3. No Recipients
```json
{
  "success": true,
  "sent": 0,
  "notInstalled": 2
}
```

**Solution:** Recipients need to install the Dreamspace bot in Teams.

#### 4. Invalid Message Type
```json
{
  "error": "Invalid message type or data",
  "details": "Unknown message type: invalid_type"
}
```

**Solution:** Use one of: `checkin_request`, `goal_reminder`, `celebration`, `custom_message`.

## Testing Locally

### 1. Start Azure Functions

```bash
cd api
func start
```

### 2. Test with curl

```bash
curl -X POST http://localhost:7071/api/sendTeamsMessage \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

**test-payload.json:**
```json
{
  "coachId": "your-coach-id",
  "recipientIds": ["your-user-id"],
  "messageType": "checkin_request",
  "messageData": {
    "message": "Test check-in from local development"
  }
}
```

### 3. Check Logs

Watch the console output for:
- ✅ Coach validated
- 📱 Found conversations
- ✅ Sent to user
- 📊 Results summary

## Integration with Web App

The Dream Coach page button calls this endpoint:

```javascript
const response = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/api/sendTeamsMessage`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      coachId: currentUser.id,
      recipientIds: [member.id],
      messageType: 'checkin_request',
      messageData: {
        message: `Hi ${member.name}! Time for your weekly check-in.`
      }
    })
  }
);
```

## Monitoring

### View Logs in Azure

```bash
# Stream live logs
func azure functionapp logstream your-function-app

# Or in Azure Portal
# Function App → Monitor → Log stream
```

### Key Metrics to Watch

- **Success rate**: `sent / (sent + failed + notInstalled)`
- **Bot installation rate**: `sent / recipientIds.length`
- **Error patterns**: Check `failedTo` array for common issues

### Application Insights Queries

```kusto
// Failed sends
traces
| where message contains "Failed to send"
| project timestamp, message, customDimensions

// Success rate by coach
traces
| where message contains "Results:"
| extend sent = toint(customDimensions.sent)
| extend failed = toint(customDimensions.failed)
| summarize TotalSent=sum(sent), TotalFailed=sum(failed) by bin(timestamp, 1h)
```

## Security Considerations

### 1. Coach Validation
The endpoint validates that the coach exists in the `users` container before sending messages.

### 2. Bot Authentication
Bot Framework handles authentication via the `MicrosoftAppId` and `MicrosoftAppPassword`.

### 3. CORS
CORS is enabled for all origins (`*`). In production, consider restricting to your domain:

```javascript
'Access-Control-Allow-Origin': 'https://dreamspace.tylerstewart.co.za'
```

### 4. Rate Limiting
Consider adding rate limiting to prevent abuse:
- Max 10 messages per coach per minute
- Max 50 messages per coach per day

## Troubleshooting

### Issue: "Bot not configured"

**Check:**
```bash
az functionapp config appsettings list \
  -g rg-dreamspace \
  -n your-function-app \
  --query "[?name=='MicrosoftAppId' || name=='MicrosoftAppPassword']"
```

**Fix:**
```bash
az functionapp config appsettings set \
  -g rg-dreamspace \
  -n your-function-app \
  --settings MicrosoftAppId="your-id" MicrosoftAppPassword="your-secret"
```

### Issue: "No conversations found"

**Cause:** Users haven't interacted with the bot yet.

**Solution:**
1. Users must install the Dreamspace bot in Teams
2. Users must send at least one message to the bot
3. This creates a conversation reference in the `botConversations` container

### Issue: Messages not appearing in Teams

**Check:**
1. Bot endpoint is running: `https://your-bot-func.azurewebsites.net/api/messages`
2. Conversation references exist in Cosmos DB
3. Bot credentials match between Function Apps
4. Teams channel is enabled on Azure Bot

## Next Steps

1. ✅ **Endpoint created** - Complete
2. ⏳ **Deploy to Azure** - Run deployment commands
3. ⏳ **Test with real users** - Have a team member install bot and test
4. ⏳ **Monitor usage** - Watch Application Insights
5. ⏳ **Add more message types** - Extend as needed

## Support

For issues:
1. Check Function App logs
2. Verify bot credentials
3. Test with curl/Postman
4. Review Application Insights
5. Check Cosmos DB for conversation references

