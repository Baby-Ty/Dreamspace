# New Tenant Deployment Checklist

Use this checklist to track progress through the deployment process. Check off items as you complete them.

## Pre-Deployment Preparation

- [ ] Review `NEW_TENANT_DEPLOYMENT.md` documentation
- [ ] Gather required information:
  - [ ] Azure Tenant ID
  - [ ] Azure Subscription ID
  - [ ] GitHub repository access
  - [ ] List of initial users and their roles
- [ ] Confirm budget and resource allocation
- [ ] Schedule deployment window (recommend off-hours)

---

## Part 1: Azure Infrastructure (30-45 minutes)

### Resource Group
- [ ] Create resource group `rg-dreamspace-prod-eastus`
- [ ] Verify location is East US
- [ ] Confirm access permissions

### Cosmos DB
- [ ] Create Cosmos DB account
  - [ ] Account name recorded: `______________________`
  - [ ] Free tier enabled (if available)
  - [ ] Location: East US
- [ ] Create database `dreamspace`
  - [ ] Throughput: 400 RU/s
- [ ] Create container `users`
  - [ ] Partition key: `/id` (critical!)
- [ ] Create container `teams`
  - [ ] Partition key: `/managerId`
- [ ] Copy credentials:
  - [ ] Endpoint URL recorded
  - [ ] Primary Key saved securely (password manager)

### Azure Static Web App
- [ ] Create Static Web App
  - [ ] Name: `swa-dreamspace-prod`
  - [ ] Plan: Standard
  - [ ] Location: East US 2
- [ ] Connect to GitHub
  - [ ] Repository: Baby-Ty/Dreamspace
  - [ ] Branch: main
  - [ ] Build preset: React
- [ ] Build configuration
  - [ ] App location: `/`
  - [ ] API location: `api`
  - [ ] Output location: `dist`
- [ ] Copy Static Web App URL: `______________________`
- [ ] Copy deployment token (save securely)

---

## Part 2: Entra ID Configuration (15-20 minutes)

### App Registration
- [ ] Create new app registration
  - [ ] Name: Dreamspace Production
  - [ ] Account type: Single tenant
  - [ ] Redirect URI (SPA): Static Web App URL
- [ ] Copy Application (client) ID: `______________________`
- [ ] Copy Directory (tenant) ID: `______________________`

### Authentication
- [ ] Add redirect URIs:
  - [ ] Production URL
  - [ ] `http://localhost:5173` (dev)
  - [ ] Custom domain (if applicable)
- [ ] Add logout URL: Same as production URL
- [ ] Verify implicit grant flows are disabled

### API Permissions
- [ ] Add Microsoft Graph permissions:
  - [ ] User.Read
  - [ ] profile
  - [ ] openid
  - [ ] email
- [ ] Grant admin consent (requires admin role)
- [ ] Verify "Granted" status shows green checkmarks

### App Roles
- [ ] Create role: DreamSpace.Admin
  - [ ] Display name: DreamSpace Admin
  - [ ] Value: `DreamSpace.Admin`
  - [ ] Allowed members: Users/Groups
  - [ ] Enabled: Yes
- [ ] Create role: DreamSpace.Manager
  - [ ] Display name: DreamSpace Manager
  - [ ] Value: `DreamSpace.Manager`
  - [ ] Enabled: Yes
- [ ] Create role: DreamSpace.Coach
  - [ ] Display name: DreamSpace Coach
  - [ ] Value: `DreamSpace.Coach`
  - [ ] Enabled: Yes

### Role Assignments
- [ ] Go to Enterprise Applications → Dreamspace Production
- [ ] Assign users to roles:
  - [ ] Admin users assigned
  - [ ] Manager users assigned
  - [ ] Coach users assigned
- [ ] Document role assignments in separate file

---

## Part 3: Code Updates (10-15 minutes)

### Update Authentication Config
- [ ] Open `src/auth/authConfig.js`
- [ ] Update `clientId` (line 26):
  - Old: `ebe60b7a-93c9-4b12-8375-4ab3181000e8`
  - New: `______________________` (from Part 2)
- [ ] Update `authority` (line 27):
  - Old: `https://login.microsoftonline.com/common`
  - New: `https://login.microsoftonline.com/YOUR_TENANT_ID`
- [ ] Save file

### Verify Schema Changes
- [ ] Confirm `src/context/AuthContext.jsx` line 91-92 uses:
  ```javascript
  id: profileData.userPrincipalName || profileData.mail || account.username,
  aadObjectId: account.localAccountId,
  ```
- [ ] Confirm `src/schemas/userData.js` line 27 includes:
  ```javascript
  aadObjectId: z.string().optional(),
  ```

### Create Feature Branch
- [ ] Run: `git checkout -b feat/new-tenant-deployment`
- [ ] Stage changes: `git add .`
- [ ] Commit with message:
  ```
  Configure for new tenant with UPN-based Cosmos document IDs
  
  - Update Entra ID client ID and authority for single-tenant
  - Use email/UPN as Cosmos document ID instead of AAD Object ID
  - Add aadObjectId field to preserve Graph API identifier
  - Add deployment documentation
  ```
- [ ] Push: `git push origin feat/new-tenant-deployment`

---

## Part 4: Azure Static Web App Configuration (10 minutes)

### Application Settings
- [ ] Navigate to Static Web App → Configuration
- [ ] Add frontend settings:
  - [ ] `VITE_APP_ENV` = `production`
  - [ ] `VITE_COSMOS_ENDPOINT` = Cosmos endpoint URL
- [ ] Add backend settings:
  - [ ] `COSMOS_ENDPOINT` = Cosmos endpoint URL
  - [ ] `COSMOS_KEY` = Cosmos primary key
- [ ] Click Save
- [ ] Confirm restart when prompted

---

## Part 5: GitHub Configuration (5 minutes)

### Repository Secret
- [ ] Go to GitHub repository → Settings
- [ ] Navigate to Secrets and variables → Actions
- [ ] Create new repository secret:
  - [ ] Name: `AZURE_STATIC_WEB_APPS_API_TOKEN_NEW_TENANT`
  - [ ] Value: Deployment token from Part 1
  - [ ] Click Add secret

### Update Workflow (Optional)
- [ ] If creating separate workflow, copy and rename:
  - [ ] From: `.github/workflows/azure-static-web-apps-gentle-grass-07ac3aa0f.yml`
  - [ ] To: `.github/workflows/azure-static-web-apps-prod.yml`
- [ ] Update secret reference (line 26)
- [ ] Update `VITE_COSMOS_ENDPOINT` (line 38)
- [ ] Commit and push workflow changes

---

## Part 6: Deployment and Testing (15-20 minutes)

### Deploy Application
- [ ] Create pull request on GitHub:
  - [ ] Base: main
  - [ ] Compare: feat/new-tenant-deployment
- [ ] Review changes in PR
- [ ] Merge pull request
- [ ] Monitor GitHub Actions:
  - [ ] Build job started
  - [ ] Build successful
  - [ ] Deploy job successful

### Initial Testing
- [ ] Open Static Web App URL in browser
- [ ] Test authentication:
  - [ ] Click Login
  - [ ] Sign in with Entra ID account
  - [ ] Consent screen appears (first time)
  - [ ] Successfully redirected to app
- [ ] Verify user profile loaded:
  - [ ] Display name correct
  - [ ] Avatar/photo shows
  - [ ] Office location correct
- [ ] Check browser console (F12):
  - [ ] Look for: `☁️ Using Azure Cosmos DB for data persistence`
  - [ ] User ID shows email format (not GUID)
  - [ ] No errors in console

### Feature Testing
- [ ] Test Dream Book:
  - [ ] Create a new dream
  - [ ] Add title, category, description
  - [ ] Save successfully
  - [ ] Refresh page - dream persists
- [ ] Test Weekly Goals:
  - [ ] Add weekly goal
  - [ ] Link to dream
  - [ ] Save successfully
- [ ] Test Career Book:
  - [ ] Add career goal
  - [ ] Add milestone
  - [ ] Save successfully

### Verify Cosmos DB
- [ ] Open Azure Portal → Cosmos DB → Data Explorer
- [ ] Navigate to dreamspace → users → Items
- [ ] Open a user document
- [ ] Verify structure:
  - [ ] `id` is email format (e.g., `user@domain.com`)
  - [ ] `aadObjectId` is GUID
  - [ ] `dreamBook` array present
  - [ ] `weeklyGoals` array present
  - [ ] `lastUpdated` timestamp present

### Role-Based Access Testing
- [ ] Test with Admin user:
  - [ ] Admin Dashboard visible in navigation
  - [ ] People Hub accessible
  - [ ] Dream Coach accessible
- [ ] Test with Manager user:
  - [ ] People Hub visible
  - [ ] Dream Coach visible
  - [ ] Admin Dashboard NOT visible
- [ ] Test with regular user:
  - [ ] Only core features visible
  - [ ] No admin/management features

---

## Part 7: Monitoring Setup (10-15 minutes)

### Application Insights
- [ ] Navigate to Static Web App → Application Insights
- [ ] Verify Application Insights resource created
- [ ] Create availability test:
  - [ ] Test name: Dreamspace Prod Availability
  - [ ] URL: Static Web App URL
  - [ ] Frequency: 5 minutes
  - [ ] Locations: Select 3-5 regions
- [ ] Create alert rule:
  - [ ] Name: SWA High Response Time
  - [ ] Metric: Response time (p95)
  - [ ] Threshold: > 3 seconds
  - [ ] Action: Email admins

### Cosmos DB Monitoring
- [ ] Navigate to Cosmos DB → Insights
- [ ] Enable Azure Monitor if prompted
- [ ] Create alert rules:
  - [ ] **RU Consumption Alert**
    - Metric: Normalized RU Consumption
    - Condition: > 80%
    - Frequency: 5 minutes
  - [ ] **Throttled Requests Alert**
    - Metric: Total Requests
    - Condition: Status Code = 429
    - Threshold: > 0
  - [ ] **Availability Alert**
    - Metric: Availability
    - Condition: < 99.9%
- [ ] Configure action group:
  - [ ] Email notifications
  - [ ] SMS (optional)

### Log Analytics
- [ ] Create Log Analytics workspace (if not exists)
- [ ] Link Static Web App diagnostic settings
- [ ] Link Cosmos DB diagnostic settings
- [ ] Configure retention: 30 days minimum

---

## Part 8: Documentation and Handoff (15-20 minutes)

### Update Documentation
- [ ] Update `README.md`:
  - [ ] Add production URL
  - [ ] Update deployment instructions
- [ ] Document credentials (secure location):
  - [ ] Static Web App URL
  - [ ] Entra App Client ID
  - [ ] Tenant ID
  - [ ] Cosmos DB account name
  - [ ] Resource group name
- [ ] Create operational runbook:
  - [ ] Backup/restore procedures
  - [ ] Incident response contacts
  - [ ] Escalation paths

### User Onboarding
- [ ] Prepare user communication:
  - [ ] Announcement email template
  - [ ] Quick start guide
  - [ ] FAQ document
- [ ] Send announcement to users:
  - [ ] Include app URL
  - [ ] Login instructions
  - [ ] Support contact
- [ ] Schedule training session (optional)

### Backup Verification
- [ ] Verify Cosmos DB backup policy:
  - [ ] Periodic: 30-day retention
  - [ ] Or Continuous: 7-day rolling
- [ ] Document backup location
- [ ] Test restore procedure (optional)

---

## Post-Deployment Monitoring (First 24-48 hours)

### Monitor Metrics
- [ ] Check Application Insights dashboard hourly
- [ ] Monitor for errors or exceptions
- [ ] Track authentication success rate
- [ ] Monitor response times

### Check Cosmos DB
- [ ] Monitor RU consumption
- [ ] Check for throttling (429 errors)
- [ ] Verify data is saving correctly
- [ ] Review partition key distribution

### User Feedback
- [ ] Collect initial user feedback
- [ ] Address any login issues promptly
- [ ] Document common questions/issues
- [ ] Update FAQ as needed

---

## Troubleshooting Reference

### Common Issues

**"Failed to acquire token"**
- [ ] Verify client ID in `authConfig.js`
- [ ] Check redirect URIs in Entra ID
- [ ] Clear browser cache
- [ ] Try incognito mode

**"Database not configured"**
- [ ] Verify `COSMOS_ENDPOINT` and `COSMOS_KEY` in app settings
- [ ] Check container partition key is `/id`
- [ ] Verify Cosmos DB firewall settings

**Roles not working**
- [ ] Verify app roles created in Entra ID
- [ ] Check user role assignments
- [ ] User must log out and back in
- [ ] Check `roles` claim in browser console

**Data not persisting**
- [ ] Check browser console for errors
- [ ] Verify Cosmos connection in app settings
- [ ] Check Cosmos DB firewall
- [ ] Verify partition key matches code

---

## Sign-Off

### Deployment Team
- [ ] Deployment completed by: ______________________ Date: __________
- [ ] Tested by: ______________________ Date: __________
- [ ] Approved by: ______________________ Date: __________

### Production Readiness
- [ ] All infrastructure provisioned
- [ ] All tests passed
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Users notified
- [ ] Support contacts established

### Post-Deployment Review (Schedule 1 week out)
- [ ] Review metrics and alerts
- [ ] Collect user feedback
- [ ] Identify optimization opportunities
- [ ] Document lessons learned

---

**Deployment Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Production URL**: _________________________________________________

**Deployment Date**: _________________________________________________

**Next Review Date**: _________________________________________________

