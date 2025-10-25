# Dreamspace Teams Bot - Setup Checklist

Use this checklist to track your bot deployment progress.

## Prerequisites

- [ ] Azure subscription with Owner or Contributor role
- [ ] Azure CLI installed and working (`az --version`)
- [ ] Logged into Azure CLI (`az login`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Azure Functions Core Tools v4 installed (`func --version`)
- [ ] Existing Dreamspace Cosmos DB account name noted down
- [ ] Cosmos DB resource group name noted down

## Phase 1: Azure Resource Provisioning

- [ ] Navigated to `teams-bot/` directory
- [ ] Ran setup script (`setup-azure-bot.ps1` or `setup-azure-bot.sh`)
- [ ] Entered Cosmos DB account name when prompted
- [ ] Saved **App ID** from script output
- [ ] Saved **App Secret** from script output
- [ ] Saved **Function App name** from script output
- [ ] Verified resource group exists in Azure Portal
- [ ] Verified Function App was created
- [ ] Verified Azure Bot was created
- [ ] Verified Teams channel is enabled on bot

## Phase 2: Code Deployment

- [ ] Ran `npm install` in `teams-bot/` directory
- [ ] Ran `func azure functionapp publish <YOUR-FUNCTION-APP>`
- [ ] Deployment completed successfully
- [ ] No deployment errors in output

## Phase 3: Verification

- [ ] Tested health endpoint: `curl https://<YOUR-FUNCTION-APP>.azurewebsites.net/api/messages`
- [ ] Health check returned `cosmosConfigured: true`
- [ ] Health check returned `status: "healthy"`
- [ ] Checked Function App logs for any errors
- [ ] Verified Cosmos DB containers exist:
  - [ ] `botConversations` container exists
  - [ ] `checkins` container exists

## Phase 4: Teams Manifest Preparation

- [ ] Copied Dreamspace logo as `color.png` (192x192px) to `manifest/`
- [ ] Created `outline.png` (32x32px transparent outline) in `manifest/`
- [ ] Opened `manifest/manifest.json` for editing
- [ ] Replaced `{{MICROSOFT_APP_ID}}` with actual App ID
- [ ] Replaced `{{FUNCTION_APP_DOMAIN}}` with actual Function App domain
- [ ] Created ZIP package with manifest and icons
- [ ] ZIP contains exactly 3 files: `manifest.json`, `color.png`, `outline.png`

## Phase 5: Teams Developer Portal

- [ ] Navigated to https://dev.teams.microsoft.com/apps
- [ ] Clicked "Import app"
- [ ] Uploaded ZIP file
- [ ] Manifest validation passed (no errors)
- [ ] App details page loaded successfully
- [ ] Bot configuration shows correct App ID
- [ ] Commands listed: `checkin` and `help`
- [ ] Clicked "Publish to org" (or downloaded for testing)

## Phase 6: Teams Installation

- [ ] Opened Microsoft Teams
- [ ] Searched for "Dreamspace" in Apps
- [ ] Found bot under "Built for your org" (or uploaded manually)
- [ ] Clicked "Add" to install
- [ ] Bot chat window opened
- [ ] Received welcome message from bot

## Phase 7: User Profile Setup

- [ ] Opened Dreamspace web app (https://dreamspace.tylerstewart.co.za)
- [ ] Logged in with Azure AD account
- [ ] Profile loaded successfully
- [ ] Verified user exists in Cosmos DB `users` container (optional)

## Phase 8: Bot Testing

### Basic Commands
- [ ] Typed `help` in bot - received help message
- [ ] Typed `hi` in bot - received help message
- [ ] Typed `hello` in bot - received help message

### Check-in Flow
- [ ] Typed `checkin` in bot
- [ ] Received Adaptive Card (not an error)
- [ ] Card displays properly in Teams
- [ ] All input fields visible:
  - [ ] Win field
  - [ ] Challenge field
  - [ ] Focused toggle
  - [ ] Need help toggle
  - [ ] Submit button
- [ ] Filled out form with test data
- [ ] Clicked "Submit"
- [ ] Received confirmation message
- [ ] Confirmation included submitted data

### Data Verification
- [ ] Opened Azure Portal → Cosmos DB
- [ ] Navigated to `checkins` container
- [ ] Found check-in document with my user ID
- [ ] Document contains correct data:
  - [ ] `userId` matches my AAD Object ID
  - [ ] `type` is "weekly_checkin"
  - [ ] `win` matches what I entered
  - [ ] `challenge` matches what I entered
  - [ ] `focused` is boolean
  - [ ] `needHelp` is boolean
  - [ ] `timestamp` is recent
  - [ ] `weekId` is in format YYYY-Www

### Conversation Reference
- [ ] Checked `botConversations` container
- [ ] Found document with my user ID
- [ ] Document has valid conversation reference

## Phase 9: Error Handling Tests

- [ ] Tested bot with user who hasn't logged into web app
- [ ] Received "User Not Found" message (expected behavior)
- [ ] Message explained need to log into web app
- [ ] Tested typing invalid command
- [ ] Received helpful error message

## Phase 10: Team Scope Testing (Optional)

- [ ] Created/joined a test team in Teams
- [ ] Added Dreamspace bot to team
- [ ] Bot sent welcome message in channel (or 1:1)
- [ ] Typed `checkin` in team context
- [ ] Received and submitted card
- [ ] Verified check-in saved to Cosmos DB

## Phase 11: Documentation Review

- [ ] Read `teams-bot/README.md` for comprehensive overview
- [ ] Reviewed `teams-bot/DEPLOYMENT.md` for deployment details
- [ ] Bookmarked `teams-bot/QUICK_REFERENCE.md` for common commands
- [ ] Reviewed `teams-bot/IMPLEMENTATION_SUMMARY.md` for technical details

## Phase 12: Monitoring Setup

- [ ] Enabled Application Insights on Function App (if not already)
- [ ] Bookmarked Function App URL in Azure Portal
- [ ] Tested log streaming: `func azure functionapp logstream <YOUR-FUNCTION-APP>`
- [ ] Set up alerts for Function App failures (optional)
- [ ] Set up alerts for Cosmos DB high RU/s (optional)

## Phase 13: User Communication

- [ ] Drafted announcement about new bot
- [ ] Included instructions on how to find and install
- [ ] Explained need to log into web app first
- [ ] Created user guide with screenshots (optional)
- [ ] Sent announcement to team/organization

## Phase 14: Production Readiness

- [ ] Tested with at least 3 different users
- [ ] All users able to complete check-in successfully
- [ ] No errors in Function App logs
- [ ] Cosmos DB performing well (RU/s not maxed)
- [ ] Response times acceptable (< 2 seconds)
- [ ] Bot responses are user-friendly
- [ ] Error messages are clear and helpful

## Rollback Plan (if needed)

If something goes wrong:

- [ ] Saved previous deployment package (if updating)
- [ ] Know how to disable bot in Azure Portal
- [ ] Can redeploy previous version via `func azure functionapp publish`
- [ ] Can unpublish Teams app in Developer Portal
- [ ] Can delete Cosmos DB containers if needed (backup first!)

## Optional Enhancements

- [ ] Set up CI/CD pipeline for bot deployments
- [ ] Create integration tests
- [ ] Add custom Application Insights dashboards
- [ ] Configure auto-scaling for Function App
- [ ] Set up geo-replication for Cosmos DB (if needed)
- [ ] Create PowerBI dashboard for check-in analytics

## Support Resources

Keep these URLs handy:

- [ ] Bookmarked: Azure Portal Function App
- [ ] Bookmarked: Azure Portal Cosmos DB
- [ ] Bookmarked: Teams Developer Portal
- [ ] Bookmarked: Bot Framework documentation
- [ ] Bookmarked: Adaptive Cards documentation
- [ ] Saved: App ID and Secret in secure location (password manager)

## Success Criteria

Your bot is successfully deployed when:

✅ Health endpoint returns healthy status  
✅ Users can install bot from Teams  
✅ Bot validates users against web app  
✅ Check-in cards display and submit correctly  
✅ Data saves to Cosmos DB with correct schema  
✅ No errors in Function App logs  
✅ Response times are acceptable  
✅ Users receive clear, helpful messages  

---

## Notes Section

Use this space for your specific values and notes:

**Resource Group:** _____________________

**Function App Name:** _____________________

**App ID:** _____________________

**Bot Endpoint:** _____________________

**Cosmos Account:** _____________________

**Deployment Date:** _____________________

**Issues Encountered:**

- 
- 
- 

**Customizations Made:**

- 
- 
- 

---

**Deployment completed by:** _____________________ **Date:** _____________________

