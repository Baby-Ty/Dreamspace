# Dreamspace Teams Bot - Deployment Guide

Complete step-by-step guide to deploy the Teams bot to Azure.

## Prerequisites Checklist

- [ ] Azure subscription with appropriate permissions
- [ ] Azure CLI installed (`az --version`)
- [ ] Logged into Azure CLI (`az login`)
- [ ] Node.js 18+ installed
- [ ] Azure Functions Core Tools v4 (`func --version`)
- [ ] Existing Dreamspace Cosmos DB account name

## Step-by-Step Deployment

### Step 1: Provision Azure Resources

Choose your platform and run the setup script:

#### Windows (PowerShell)
```powershell
cd teams-bot
./setup-azure-bot.ps1
```

When prompted, enter your existing Cosmos DB account name (e.g., `dreamspace-cosmos`).

#### Linux/Mac (Bash)
```bash
cd teams-bot
chmod +x setup-azure-bot.sh
./setup-azure-bot.sh
```

When prompted, enter your existing Cosmos DB account name.

#### What This Does
- Creates a new Function App for the bot
- Creates a new Azure AD App Registration (multi-tenant)
- Creates an Azure Bot registration
- Enables the Teams channel
- Creates two new Cosmos DB containers: `botConversations` and `checkins`
- Configures all environment variables

#### Save These Values
The script outputs critical values - **copy and save them securely**:
- **App ID**: (GUID format)
- **App Secret**: (long random string)
- **Function App Name**: (e.g., `dreamspace-bot-func`)
- **Bot Endpoint**: (e.g., `https://dreamspace-bot-func.azurewebsites.net/api/messages`)

---

### Step 2: Deploy Bot Code to Azure

From the `teams-bot/` directory:

```bash
# Install dependencies
npm install

# Login to Azure (if not already logged in)
az login

# Deploy to the Function App
func azure functionapp publish dreamspace-bot-func
```

Replace `dreamspace-bot-func` with your actual Function App name from Step 1.

**Wait for deployment to complete.** You should see:
```
Deployment successful.
Remote build succeeded!
```

---

### Step 3: Verify Bot Endpoint

Test the health check endpoint:

```bash
curl https://YOUR-FUNCTION-APP.azurewebsites.net/api/messages
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Dreamspace Teams Bot",
  "cosmosConfigured": true,
  "timestamp": "2025-10-24T..."
}
```

If `cosmosConfigured` is `false`, check your Function App environment variables.

---

### Step 4: Prepare Teams App Manifest

#### 4.1 Create Bot Icons

You need two PNG images:
- **color.png**: 192x192px full-color app icon
- **outline.png**: 32x32px transparent outline (white on transparent)

Copy your Dreamspace logo to `teams-bot/manifest/` as these files.

**Quick icon creation:**
- Use your existing `public/logo.png` as a starting point
- Resize to 192x192px for `color.png`
- Create a 32x32px white outline version for `outline.png`

#### 4.2 Update Manifest

Edit `teams-bot/manifest/manifest.json`:

Replace these placeholders:
- `{{MICROSOFT_APP_ID}}` → Your App ID from Step 1
- `{{FUNCTION_APP_DOMAIN}}` → Your Function App domain (e.g., `dreamspace-bot-func.azurewebsites.net`)

**Example:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  ...
  "validDomains": ["dreamspace-bot-func.azurewebsites.net"]
}
```

#### 4.3 Create App Package

```bash
cd manifest/
zip dreamspace-teams-bot.zip manifest.json color.png outline.png
```

Or on Windows:
```powershell
Compress-Archive -Path manifest.json,color.png,outline.png -DestinationPath dreamspace-teams-bot.zip
```

---

### Step 5: Upload to Teams Developer Portal

#### 5.1 Access Developer Portal
Go to [https://dev.teams.microsoft.com/apps](https://dev.teams.microsoft.com/apps)

#### 5.2 Import App
1. Click **"Import app"** button
2. Select your `dreamspace-teams-bot.zip` file
3. Wait for validation to complete

#### 5.3 Review App Details
The portal will show your app configuration. Verify:
- App name: "Dreamspace"
- Bot ID matches your App ID
- Commands appear: `checkin`, `help`

#### 5.4 Publish
1. Click **"Publish"** in the left menu
2. Select **"Publish to org"** (for your organization)
3. Or **"Download"** for manual distribution

---

### Step 6: Install and Test in Teams

#### 6.1 Install Bot
1. In Microsoft Teams, go to **Apps**
2. Search for "Dreamspace" (or go to "Built for your org")
3. Click **Add** to install the bot

#### 6.2 Test Welcome Flow
1. Open the bot chat
2. You should see the welcome message
3. Bot explains you need to log into web app first

#### 6.3 Create User Profile
1. Open Dreamspace web app in browser
2. Log in with your Azure AD account
3. This creates your user profile in Cosmos DB

#### 6.4 Test Check-in Flow
1. Return to Teams bot
2. Type: `checkin`
3. Bot should display the Adaptive Card
4. Fill out the form and click **Submit**
5. Verify confirmation message appears

#### 6.5 Verify in Cosmos DB
1. Go to Azure Portal → Your Cosmos DB account
2. Open **Data Explorer**
3. Navigate to `dreamspace` database → `checkins` container
4. You should see your check-in document

---

## Verification Checklist

After deployment, verify each component:

- [ ] Function App is running (no errors in logs)
- [ ] Health endpoint returns `cosmosConfigured: true`
- [ ] Bot responds in Teams (welcome message appears)
- [ ] User validation works (rejects users not in Cosmos DB)
- [ ] Check-in card displays correctly
- [ ] Card submission saves to Cosmos DB
- [ ] Conversation references are saved to `botConversations`

---

## Troubleshooting Deployment Issues

### Function App Deployment Fails

**Error:** `Cannot find module 'botbuilder'`
```bash
# Solution: Ensure package.json is correct, then redeploy
cd teams-bot
npm install
func azure functionapp publish YOUR-FUNCTION-APP
```

**Error:** `App already exists`
```bash
# Solution: The bot already exists, just redeploy code
func azure functionapp publish YOUR-FUNCTION-APP --force
```

---

### Bot Doesn't Respond in Teams

**Check 1: Verify bot endpoint**
```bash
curl https://YOUR-FUNCTION-APP.azurewebsites.net/api/messages
```

**Check 2: View Function App logs**
```bash
func azure functionapp logstream YOUR-FUNCTION-APP
```

**Check 3: Verify Bot Configuration**
1. Go to Azure Portal → Azure Bot resource
2. Navigate to **Configuration** → **Settings**
3. Verify **Messaging endpoint** matches your Function App URL
4. Should be: `https://YOUR-FUNCTION-APP.azurewebsites.net/api/messages`

---

### User Validation Fails

**Error:** "User Not Found" even after logging into web app

**Check Cosmos DB:**
1. Open Data Explorer
2. Go to `users` container
3. Search for your user by email or AAD ID
4. Verify the `id` field matches your AAD Object ID

**Find your AAD Object ID:**
```bash
az ad signed-in-user show --query id -o tsv
```

---

### Adaptive Card Doesn't Render

**Check 1: Validate card JSON**
- Go to https://adaptivecards.io/designer
- Paste your card JSON from `cards/weeklyCheckin.js`
- Fix any validation errors

**Check 2: Teams version**
- Ensure you're using latest Teams desktop or web client
- Card uses version 1.5, which requires recent Teams

---

### Card Submission Fails

**Check Function logs:**
```bash
func azure functionapp logstream YOUR-FUNCTION-APP
```

**Common causes:**
- Cosmos DB credentials incorrect
- Container `checkins` doesn't exist
- Partition key mismatch

**Verify containers exist:**
```bash
az cosmosdb sql container show \
  --account-name YOUR-COSMOS-ACCOUNT \
  --database-name dreamspace \
  --resource-group rg-dreamspace \
  --name checkins
```

---

## Updating the Bot

### Update Bot Code
```bash
cd teams-bot
# Make your code changes
func azure functionapp publish YOUR-FUNCTION-APP
```

### Update Teams Manifest
1. Edit `manifest/manifest.json`
2. **Increment version number** (e.g., "1.0.0" → "1.0.1")
3. Recreate ZIP package
4. Upload to Teams Developer Portal (will update existing app)

### Update Environment Variables
```bash
az functionapp config appsettings set \
  -g rg-dreamspace \
  -n YOUR-FUNCTION-APP \
  --settings "NEW_SETTING=value"
```

---

## Rollback Procedure

If deployment causes issues:

### 1. Rollback Function Code
```bash
# View deployment history
az functionapp deployment list \
  -g rg-dreamspace \
  -n YOUR-FUNCTION-APP \
  --query "[].{id:id, status:status, timestamp:end_time}" -o table

# Redeploy previous version
az functionapp deployment source config-zip \
  -g rg-dreamspace \
  -n YOUR-FUNCTION-APP \
  --src previous-deployment.zip
```

### 2. Rollback Teams Manifest
1. Go to Teams Developer Portal
2. Navigate to your app
3. Go to **Versions** tab
4. Select previous version
5. Click **Restore**

---

## Production Checklist

Before promoting to production:

- [ ] Test with multiple users
- [ ] Verify error handling (network failures, invalid input)
- [ ] Enable Application Insights on Function App
- [ ] Set up alerts for bot failures
- [ ] Document bot commands for users
- [ ] Create support process for "User Not Found" issues
- [ ] Test both personal and team scopes
- [ ] Verify data is correctly saved to Cosmos DB
- [ ] Test card submission with various inputs
- [ ] Ensure welcome message is appropriate for all users
- [ ] Validate multi-tenant access works (if applicable)

---

## Monitoring and Maintenance

### View Live Logs
```bash
func azure functionapp logstream YOUR-FUNCTION-APP
```

### Check Application Insights
1. Go to Azure Portal → Function App
2. Navigate to **Application Insights**
3. View **Live Metrics**, **Failures**, **Performance**

### Monitor Cosmos DB
1. Go to Cosmos DB account
2. Check **Metrics** for RU/s consumption
3. Monitor container sizes

### Common Maintenance Tasks
- Review logs weekly for errors
- Monitor RU/s usage and scale if needed
- Update bot dependencies monthly (`npm update`)
- Review and archive old check-ins quarterly

---

## Next Steps

After successful deployment:

1. **User Communication**: Notify users about the new bot
2. **Training**: Create user guides and screenshots
3. **Phase 2 Planning**: Plan proactive messaging features
4. **Feedback**: Collect user feedback for improvements
5. **Analytics**: Track check-in completion rates

---

## Support Resources

- [Bot Framework Documentation](https://docs.microsoft.com/azure/bot-service/)
- [Teams App Documentation](https://docs.microsoft.com/microsoftteams/platform/)
- [Adaptive Cards Documentation](https://adaptivecards.io/)
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)

