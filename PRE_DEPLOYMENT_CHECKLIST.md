# Pre-Deployment Checklist - Teams Bot Integration

## ⚠️ DO NOT PUSH YET - Complete These Steps First

This checklist ensures everything is ready for testing before deploying to production.

---

## 🔍 Phase 1: Local Verification (Do This First)

### 1.1 Check All Files Exist

```bash
# Verify bot files
ls teams-bot/messages/index.js
ls teams-bot/services/cosmosService.js
ls teams-bot/services/userService.js
ls teams-bot/cards/weeklyCheckin.js
ls teams-bot/package.json
ls teams-bot/setup-azure-bot.ps1

# Verify API files
ls api/sendTeamsMessage/index.js
ls api/sendTeamsMessage/function.json

# Verify UI changes
grep -n "Send Teams Check-in" src/pages/DreamCoach.jsx
```

**Expected:** All files should exist with no errors.

---

### 1.2 Install Dependencies Locally

```bash
# Install bot dependencies
cd teams-bot
npm install
# Check for errors - should install botbuilder@^4.22.0

# Install API dependencies
cd ../api
npm install
# Check for errors - should install botbuilder@^4.22.0

# Install web app dependencies (if needed)
cd ..
npm install
```

**Expected:** No errors, all packages installed successfully.

---

### 1.3 Check for Linting Errors

```bash
# Check API endpoint
# (Already done - no errors found)

# Check web app
npm run lint src/pages/DreamCoach.jsx
# Or open in VS Code and check for red squiggles

# Check bot code
cd teams-bot
# (Already done - no errors found)
```

**Expected:** Zero linting errors.

---

### 1.4 Verify Environment Variables Template

Check that `api/local.settings.json` has the right structure:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_ENDPOINT": "https://YOUR-COSMOS.documents.azure.com:443/",
    "COSMOS_KEY": "YOUR-KEY",
    "MicrosoftAppId": "",
    "MicrosoftAppPassword": "",
    "MicrosoftAppType": "MultiTenant"
  }
}
```

**Action Required:** 
- ⚠️ **DO NOT commit** `local.settings.json` with real credentials
- ✅ Verify `.gitignore` excludes `local.settings.json`

---

## 🏗️ Phase 2: Azure Infrastructure Setup

### 2.1 Decide on Deployment Strategy

**Option A: Separate Bot Function App (Recommended)**
- ✅ Isolation - bot issues don't affect main app
- ✅ Independent scaling
- ✅ Easier to debug
- ❌ Slightly more complex setup

**Option B: Same Function App**
- ✅ Simpler - one Function App
- ✅ Shared credentials
- ❌ Bot and API share resources
- ❌ Harder to isolate issues

**Recommendation:** Use Option A (separate Function App)

---

### 2.2 Verify Azure Resources Exist

Before deploying, confirm you have:

```bash
# Check resource group exists
az group show -n rg-dreamspace

# Check main Function App exists
az functionapp show -n YOUR-MAIN-FUNCTION-APP -g rg-dreamspace

# Check Cosmos DB exists
az cosmosdb show -n YOUR-COSMOS-ACCOUNT -g rg-dreamspace

# List existing containers
az cosmosdb sql container list \
  --account-name YOUR-COSMOS-ACCOUNT \
  --database-name dreamspace \
  --resource-group rg-dreamspace
```

**Expected Containers:**
- ✅ `users`
- ✅ `items`
- ✅ `teams`
- ⚠️ `botConversations` - Will be created by bot setup script
- ⚠️ `checkins` - Will be created by bot setup script

---

### 2.3 Get Current Cosmos DB Credentials

```bash
# Get endpoint
az cosmosdb show -n YOUR-COSMOS-ACCOUNT -g rg-dreamspace \
  --query documentEndpoint -o tsv

# Get primary key
az cosmosdb keys list -n YOUR-COSMOS-ACCOUNT -g rg-dreamspace \
  --query primaryMasterKey -o tsv
```

**Action:** Save these values - you'll need them for bot setup.

---

## 🤖 Phase 3: Bot Setup (Critical - Do Before API Deployment)

### 3.1 Review Bot Setup Script

```bash
# Review the script first
cat teams-bot/setup-azure-bot.ps1
# or
cat teams-bot/setup-azure-bot.sh
```

**Check:**
- ✅ Resource group name matches yours
- ✅ Location is correct (e.g., eastus)
- ✅ Function App name is unique
- ✅ Bot name is unique

**Customize if needed:**
```powershell
# Edit these variables at the top of the script
$ResourceGroup = "rg-dreamspace"  # Your actual RG name
$Location = "eastus"               # Your preferred region
$BotName = "dreamspace-teams-bot"  # Must be globally unique
$FunctionApp = "dreamspace-bot-func" # Must be globally unique
```

---

### 3.2 Run Bot Setup Script (DRY RUN FIRST)

**Before running, understand what it does:**
1. Creates a new Function App for the bot
2. Creates Azure AD App Registration (multi-tenant)
3. Generates app secret
4. Creates Azure Bot resource
5. Enables Teams channel
6. Creates Cosmos DB containers (`botConversations`, `checkins`)
7. Configures all environment variables

**Dry run check:**
```bash
# Check if names are available
az functionapp show -n dreamspace-bot-func -g rg-dreamspace 2>&1 | grep "not be found"
# Should say "could not be found" - meaning name is available

az bot show -n dreamspace-teams-bot -g rg-dreamspace 2>&1 | grep "not be found"
# Should say "could not be found" - meaning name is available
```

---

### 3.3 **CRITICAL: Save Bot Credentials**

When you run the setup script, it will output:

```
========================================
Setup Complete!
========================================

Bot Configuration:
  Bot Name: dreamspace-teams-bot
  Bot ID (App ID): a1b2c3d4-e5f6-7890-abcd-ef1234567890
  Endpoint: https://dreamspace-bot-func.azurewebsites.net/api/messages
  Function App: dreamspace-bot-func

IMPORTANT: Save these credentials securely!
  App ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
  App Secret: xyz123abc456def789...
```

**⚠️ CRITICAL:**
- **Copy and save** the App ID and App Secret immediately
- **Store in password manager** or secure note
- **You'll need these** for the main API configuration
- **Cannot retrieve** the secret later (must regenerate)

**Action:** Create a secure note NOW with this template:
```
Dreamspace Teams Bot Credentials
================================
Date Created: [DATE]
App ID: [WILL BE GENERATED]
App Secret: [WILL BE GENERATED]
Bot Function App: dreamspace-bot-func
Bot Endpoint: https://dreamspace-bot-func.azurewebsites.net/api/messages
```

---

## 🔌 Phase 4: API Configuration

### 4.1 Add Bot Credentials to Main Function App

**After bot setup completes**, add credentials to your **main** Function App:

```bash
# Replace with your actual values
az functionapp config appsettings set \
  -g rg-dreamspace \
  -n YOUR-MAIN-FUNCTION-APP \
  --settings \
    MicrosoftAppId="YOUR-BOT-APP-ID" \
    MicrosoftAppPassword="YOUR-BOT-APP-SECRET" \
    MicrosoftAppType="MultiTenant"
```

**Verify it was set:**
```bash
az functionapp config appsettings list \
  -g rg-dreamspace \
  -n YOUR-MAIN-FUNCTION-APP \
  --query "[?name=='MicrosoftAppId' || name=='MicrosoftAppPassword']"
```

---

### 4.2 Verify API Package.json

Check that `api/package.json` includes botbuilder:

```bash
cat api/package.json | grep botbuilder
```

**Expected:**
```json
"botbuilder": "^4.22.0"
```

✅ Already added - no action needed.

---

## 🌐 Phase 5: Frontend Configuration

### 5.1 Check Environment Variable

Verify your web app knows where the API is:

**For local development** (`.env.local`):
```
VITE_API_BASE_URL=http://localhost:7071
```

**For production** (Azure Static Web App config):
```
VITE_API_BASE_URL=https://YOUR-MAIN-FUNCTION-APP.azurewebsites.net
```

**Check current value:**
```bash
cat .env.local | grep VITE_API_BASE_URL
# or
cat .env | grep VITE_API_BASE_URL
```

---

### 5.2 Test Build Locally

```bash
# Build the web app
npm run build

# Check for errors
echo $?  # Should be 0
```

**Expected:** Build completes with no errors.

---

## 📝 Phase 6: Teams App Manifest Preparation

### 6.1 Prepare Bot Icons

You need two PNG files in `teams-bot/manifest/`:

**Required:**
- `color.png` - 192x192px full-color app icon
- `outline.png` - 32x32px transparent outline (white)

**Action:**
```bash
# Check if icons exist
ls teams-bot/manifest/*.png

# If not, you need to create them
# Option 1: Use your existing logo
cp public/logo.png teams-bot/manifest/color.png
# Then resize to 192x192px

# Option 2: Use placeholder (for testing only)
# Download from: https://via.placeholder.com/192x192/ED1C24/FFFFFF?text=DS
```

**⚠️ Don't deploy without icons** - Teams will reject the manifest.

---

### 6.2 Review Manifest Template

```bash
cat teams-bot/manifest/manifest.json
```

**Check placeholders:**
- `{{MICROSOFT_APP_ID}}` - Will be replaced with bot App ID
- `{{FUNCTION_APP_DOMAIN}}` - Will be replaced with Function App domain

**Don't edit yet** - you'll do this after bot setup.

---

## 🧪 Phase 7: Testing Strategy

### 7.1 Create Test User Accounts

**You need at least 2 test users:**

1. **Coach User**
   - Has team members assigned
   - Can access Dream Coach page
   - Will test sending messages

2. **Team Member User**
   - Assigned to coach
   - Will receive messages
   - Will test submitting check-ins

**Action:** Identify or create these test users in your Azure AD.

---

### 7.2 Prepare Test Data

**Ensure test users exist in Cosmos DB:**

```bash
# Check if test users exist
# (You'll need to query Cosmos DB)
```

**Required data:**
- Coach user in `users` container
- Team member in `users` container
- Team relationship in `teams` container (coach → team member)

---

## 🚦 Phase 8: Deployment Order (When Ready)

**DO NOT START YET** - This is the order when you're ready:

```
1. Deploy Bot Infrastructure
   ├─ Run setup-azure-bot.ps1
   ├─ Save credentials
   └─ Deploy bot code

2. Configure Main API
   ├─ Add bot credentials
   └─ Deploy API code

3. Deploy Web App
   ├─ Build
   └─ Deploy to Azure

4. Configure Teams Manifest
   ├─ Add bot App ID
   ├─ Add icons
   └─ Create ZIP package

5. Upload to Teams
   └─ Install for test users

6. Test End-to-End
   ├─ Coach sends message
   ├─ Team member receives
   └─ Verify data in Cosmos DB
```

---

## ✅ Pre-Flight Checklist (Complete Before Deploying)

### Code Ready
- [ ] All files created and saved
- [ ] No linting errors
- [ ] Dependencies installed locally
- [ ] Local build succeeds
- [ ] `.gitignore` excludes `local.settings.json`

### Azure Ready
- [ ] Resource group exists
- [ ] Main Function App exists
- [ ] Cosmos DB exists and accessible
- [ ] Cosmos credentials retrieved
- [ ] Bot names are unique (checked availability)

### Credentials Ready
- [ ] Secure note prepared for bot credentials
- [ ] Password manager ready
- [ ] Know where to store App ID and Secret

### Teams Ready
- [ ] Bot icons created (192x192 and 32x32)
- [ ] Icons copied to `teams-bot/manifest/`
- [ ] Manifest reviewed

### Testing Ready
- [ ] Test coach user identified
- [ ] Test team member identified
- [ ] Test users exist in Cosmos DB
- [ ] Team relationship exists

### Documentation Ready
- [ ] Read `TEAMS_INTEGRATION_DEPLOYMENT.md`
- [ ] Read `teams-bot/DEPLOYMENT.md`
- [ ] Understand rollback plan

---

## 🎯 What to Do Right Now

### Immediate Actions (Before Any Deployment)

1. **Check Icons**
   ```bash
   ls teams-bot/manifest/*.png
   ```
   If missing, create them now.

2. **Verify Cosmos Access**
   ```bash
   az cosmosdb show -n YOUR-COSMOS-ACCOUNT -g rg-dreamspace
   ```
   Make sure you have access.

3. **Check Function App Name**
   ```bash
   az functionapp show -n YOUR-MAIN-FUNCTION-APP -g rg-dreamspace
   ```
   Confirm the name you'll use.

4. **Review Git Status**
   ```bash
   git status
   ```
   See what will be committed.

5. **Create Secure Note**
   Open your password manager and create a note for bot credentials.

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T:
1. **Push credentials** - Never commit `local.settings.json` with real values
2. **Skip bot setup** - API won't work without bot credentials
3. **Forget to save** - Bot App Secret cannot be retrieved later
4. **Deploy without icons** - Teams will reject the manifest
5. **Test in production first** - Always test locally first
6. **Deploy all at once** - Deploy in phases (bot → API → web)

### ✅ DO:
1. **Test locally first** - Use `func start` and `npm run dev`
2. **Save credentials immediately** - As soon as bot setup completes
3. **Deploy in order** - Bot → API → Web → Teams
4. **Check logs** - After each deployment
5. **Have rollback plan** - Know how to undo changes

---

## 📞 When You're Ready

Once you've completed all items in the Pre-Flight Checklist above, you can proceed with deployment.

**Next Steps:**
1. Review this checklist again
2. Complete any missing items
3. Run through the deployment in `TEAMS_INTEGRATION_DEPLOYMENT.md`
4. Test thoroughly before announcing to users

---

## 🆘 If Something Goes Wrong

**Stop immediately and:**
1. Check Function App logs
2. Review Application Insights
3. Verify environment variables
4. Check Cosmos DB connectivity
5. Review bot credentials

**Rollback if needed:**
```bash
# Stop bot Function App
az functionapp stop -n dreamspace-bot-func -g rg-dreamspace

# Redeploy previous API version
cd api
git checkout HEAD~1
func azure functionapp publish YOUR-MAIN-FUNCTION-APP
```

---

## Summary

**Before deploying anything:**
1. ✅ Complete Pre-Flight Checklist
2. ✅ Create bot icons
3. ✅ Prepare secure note for credentials
4. ✅ Verify Cosmos DB access
5. ✅ Test build locally

**Then proceed with deployment in this order:**
1. Bot infrastructure
2. Main API
3. Web app
4. Teams manifest
5. Testing

**Don't rush** - take time to verify each step! 🎯

