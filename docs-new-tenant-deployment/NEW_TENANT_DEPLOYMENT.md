# New Tenant Deployment Guide

This guide walks through deploying Dreamspace to a fresh Azure tenant with human-readable Cosmos DB document IDs.

## Overview

- **Tenant Type**: Single tenant (your organization only)
- **Region**: East US
- **Cosmos ID Strategy**: Email/UPN (e.g., `user@domain.com`) instead of Azure AD Object IDs
- **Hosting**: Azure Static Web Apps Standard with built-in API functions

## Prerequisites

- Azure subscription with appropriate permissions
- GitHub account with access to the Dreamspace repository
- Azure CLI installed (optional, for automated provisioning)
- PowerShell (for Windows users)

---

## Part 1: Azure Infrastructure Provisioning

### Option A: Azure Portal (Recommended for First-Time Setup)

#### Step 1.1: Create Resource Group

1. Navigate to [Azure Portal](https://portal.azure.com)
2. Click **Create a resource** → Search for "Resource Group"
3. Click **Create**
4. Fill in details:
   - **Subscription**: Your subscription
   - **Resource group**: `rg-dreamspace-prod-eastus`
   - **Region**: `(US) East US`
5. Click **Review + create** → **Create**

#### Step 1.2: Create Cosmos DB Account

1. In Azure Portal, click **Create a resource**
2. Search for "Azure Cosmos DB" → Select **Azure Cosmos DB**
3. Select **Create** under **Azure Cosmos DB for NoSQL**
4. Configure:
   - **Subscription**: Your subscription
   - **Resource Group**: `rg-dreamspace-prod-eastus`
   - **Account Name**: `cosmos-dreamspace-prod` (add unique suffix if taken, e.g., `cosmos-dreamspace-prod-2025`)
   - **Location**: `East US`
   - **Capacity mode**: `Provisioned throughput`
   - **Apply Free Tier Discount**: `Apply` (if available)
   - **Limit total account throughput**: Check this box, set to `400 RU/s`
5. Click **Review + create** → **Create**
6. Wait for deployment (2-5 minutes)

#### Step 1.3: Create Database and Container

1. Go to your new Cosmos DB account
2. In the left menu, click **Data Explorer**
3. Click **New Database**:
   - **Database id**: `dreamspace`
   - **Provision throughput**: Uncheck (we'll set it on the container)
   - Click **OK**
4. Select the `dreamspace` database → Click **New Container**:
   - **Database id**: Use existing `dreamspace`
   - **Container id**: `users`
   - **Partition key**: `/id` (important: use `/id` not `/userId`)
   - **Provision dedicated throughput**: Check this box
   - **Throughput**: `400` RU/s (Manual)
   - Click **OK**
5. (Optional) Create `teams` container:
   - **Container id**: `teams`
   - **Partition key**: `/managerId`
   - **Throughput**: Share with database (or 400 RU/s if separate)

#### Step 1.4: Get Cosmos DB Connection Details

1. In your Cosmos DB account, click **Keys** in the left menu
2. Copy and save these values (you'll need them later):
   - **URI**: e.g., `https://cosmos-dreamspace-prod-2025.documents.azure.com:443/`
   - **PRIMARY KEY**: Long string (keep secure!)

#### Step 1.5: Create Azure Static Web App

1. In Azure Portal, click **Create a resource**
2. Search for "Static Web App" → Select **Static Web Apps**
3. Click **Create**
4. Configure **Basics**:
   - **Subscription**: Your subscription
   - **Resource Group**: `rg-dreamspace-prod-eastus`
   - **Name**: `swa-dreamspace-prod`
   - **Plan type**: `Standard` (required for app settings and custom domains)
   - **Region for Azure Functions API**: `East US 2`
   - **Source**: `GitHub`
5. Click **Sign in with GitHub** → Authorize Azure
6. Configure **Deployment details**:
   - **Organization**: Your GitHub username or organization
   - **Repository**: `Dreamspace`
   - **Branch**: `main`
7. Configure **Build Details**:
   - **Build Presets**: `React`
   - **App location**: `/`
   - **Api location**: `api`
   - **Output location**: `dist`
8. Click **Review + create** → **Create**
9. Wait for deployment (2-3 minutes)
10. After deployment, click **Go to resource**
11. Copy the **URL** (e.g., `https://black-rock-xyz.azurestaticapps.net`)

---

### Option B: Azure CLI (For Automated Setup)

```bash
# Login to Azure (specify your tenant)
az login --tenant YOUR_TENANT_ID

# Set variables
RESOURCE_GROUP="rg-dreamspace-prod-eastus"
LOCATION="eastus"
COSMOS_ACCOUNT="cosmos-dreamspace-prod-$(date +%s)"
SWA_NAME="swa-dreamspace-prod"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Cosmos DB account
az cosmosdb create \
  --name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --locations regionName=$LOCATION \
  --enable-free-tier true \
  --default-consistency-level Session

# Create database
az cosmosdb sql database create \
  --account-name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --name dreamspace \
  --throughput 400

# Create users container with /id partition key
az cosmosdb sql container create \
  --account-name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --database-name dreamspace \
  --name users \
  --partition-key-path "/id"

# Get Cosmos connection details
az cosmosdb keys list \
  --name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --type connection-strings

# Create Static Web App (requires GitHub PAT)
# Note: You'll need to set up GitHub integration manually or provide a token
az staticwebapp create \
  --name $SWA_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --source https://github.com/Baby-Ty/Dreamspace \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "dist" \
  --sku Standard
```

---

## Part 2: Configure Microsoft Entra ID

### Step 2.1: Create App Registration

1. In Azure Portal, navigate to **Microsoft Entra ID**
2. Click **App registrations** → **New registration**
3. Configure:
   - **Name**: `Dreamspace Production`
   - **Supported account types**: 
     - Select **Accounts in this organizational directory only (Single tenant)**
   - **Redirect URI**: 
     - Platform: `Single-page application (SPA)`
     - URI: `https://YOUR-SWA-URL.azurestaticapps.net` (from Step 1.5)
4. Click **Register**
5. **Copy the Application (client) ID** - you'll need this for code changes

### Step 2.2: Configure Authentication

1. In your app registration, click **Authentication**
2. Under **Single-page application**, add additional redirect URIs:
   - `http://localhost:5173` (for local development)
   - Add any custom domain URLs
3. Under **Logout URL**, add:
   - `https://YOUR-SWA-URL.azurestaticapps.net`
4. Under **Implicit grant and hybrid flows**, ensure nothing is checked (not needed for SPA)
5. Click **Save**

### Step 2.3: Configure API Permissions

1. Click **API permissions**
2. You should see `User.Read` already added
3. Click **Add a permission** → **Microsoft Graph** → **Delegated permissions**
4. Add these permissions:
   - `User.Read` (if not present)
   - `profile`
   - `openid`
   - `email`
5. Click **Grant admin consent for [Your Org]** (requires admin)
6. Wait for "Granted" status to appear

### Step 2.4: Create App Roles

1. Click **App roles** → **Create app role**
2. Create **Admin Role**:
   - **Display name**: `DreamSpace Admin`
   - **Allowed member types**: `Users/Groups`
   - **Value**: `DreamSpace.Admin`
   - **Description**: `Full access to all DreamSpace features including admin dashboard`
   - **Enable this app role**: Check
   - Click **Apply**
3. Create **Manager Role**:
   - **Display name**: `DreamSpace Manager`
   - **Allowed member types**: `Users/Groups`
   - **Value**: `DreamSpace.Manager`
   - **Description**: `Access to coaching and people management features`
   - Click **Apply**
4. Create **Coach Role**:
   - **Display name**: `DreamSpace Coach`
   - **Allowed member types**: `Users/Groups`
   - **Value**: `DreamSpace.Coach`
   - **Description**: `Access to team coaching features`
   - Click **Apply**

### Step 2.5: Assign Users to Roles

1. In Azure Portal, go to **Microsoft Entra ID** → **Enterprise applications**
2. Find and click on **Dreamspace Production**
3. Click **Users and groups** → **Add user/group**
4. Select users and assign appropriate roles
5. Click **Assign**

---

## Part 3: Update Application Code

### Step 3.1: Update Authentication Configuration

**File**: `src/auth/authConfig.js`

Replace line 26:
```javascript
clientId: "ebe60b7a-93c9-4b12-8375-4ab3181000e8", // OLD demo tenant client ID
```

With your new client ID:
```javascript
clientId: "YOUR_NEW_CLIENT_ID_FROM_STEP_2.1",
```

Replace line 27:
```javascript
authority: "https://login.microsoftonline.com/common", // Multi-tenant
```

With your tenant-specific authority:
```javascript
authority: "https://login.microsoftonline.com/YOUR_TENANT_ID", // Single tenant
```

To find your Tenant ID:
- Azure Portal → Microsoft Entra ID → Overview → **Tenant ID**

### Step 3.2: Verify Code Changes for Readable IDs

The following changes have already been made to use email/UPN as document IDs:

**File**: `src/context/AuthContext.jsx` (line 91-92)
```javascript
id: profileData.userPrincipalName || profileData.mail || account.username,
aadObjectId: account.localAccountId,
```

**File**: `src/schemas/userData.js` (line 27)
```javascript
aadObjectId: z.string().optional(),
```

These changes ensure:
- Document `id` in Cosmos = user's email (e.g., `john.smith@company.com`)
- Azure AD Object ID is preserved in `aadObjectId` field
- Cosmos queries use readable IDs: `container.item(email, email).read()`

### Step 3.3: Commit and Push Changes

```bash
cd "C:\SupportStack\All CLients\Dreams\Dreamspace"

# Create feature branch
git checkout -b feat/new-tenant-deployment

# Stage changes
git add src/auth/authConfig.js
git add src/context/AuthContext.jsx
git add src/schemas/userData.js
git add NEW_TENANT_DEPLOYMENT.md

# Commit
git commit -m "Configure for new tenant with UPN-based Cosmos document IDs

- Update Entra ID client ID and authority for single-tenant
- Use email/UPN as Cosmos document ID instead of AAD Object ID
- Add aadObjectId field to preserve Graph API identifier
- Add deployment documentation"

# Push to GitHub
git push origin feat/new-tenant-deployment
```

---

## Part 4: Configure Azure Static Web App

### Step 4.1: Add Application Settings

1. In Azure Portal, go to your Static Web App (`swa-dreamspace-prod`)
2. Click **Configuration** in the left menu
3. Click **Application settings** tab
4. Add **Frontend settings** (used at build time):

| Name | Value |
|------|-------|
| `VITE_APP_ENV` | `production` |
| `VITE_COSMOS_ENDPOINT` | `https://cosmos-dreamspace-prod-SUFFIX.documents.azure.com:443/` |

5. Add **Backend settings** (Function App runtime):

| Name | Value |
|------|-------|
| `COSMOS_ENDPOINT` | `https://cosmos-dreamspace-prod-SUFFIX.documents.azure.com:443/` |
| `COSMOS_KEY` | `[PRIMARY KEY from Step 1.4]` |

6. Click **Save**
7. Click **OK** when prompted about restarting

### Step 4.2: Get Deployment Token

1. In your Static Web App, click **Overview**
2. Click **Manage deployment token**
3. Copy the token (starts with `deploymentToken`)
4. Keep this secure - treat it like a password

---

## Part 5: Configure GitHub

### Step 5.1: Add GitHub Secret

1. Go to your GitHub repository: https://github.com/Baby-Ty/Dreamspace
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN_NEW_TENANT`
   - **Value**: [Deployment token from Step 4.2]
5. Click **Add secret**

### Step 5.2: Update GitHub Actions Workflow

**File**: `.github/workflows/azure-static-web-apps-gentle-grass-07ac3aa0f.yml`

Option 1: Rename workflow file for new tenant:
```bash
cd ".github/workflows"
mv azure-static-web-apps-gentle-grass-07ac3aa0f.yml azure-static-web-apps-prod.yml
```

Option 2: Keep existing file, update secret reference (line 26):
```yaml
azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_NEW_TENANT }}
```

Update environment variable (line 38):
```yaml
VITE_COSMOS_ENDPOINT: https://cosmos-dreamspace-prod-SUFFIX.documents.azure.com:443/
```

Commit workflow changes:
```bash
git add .github/workflows/
git commit -m "Update workflow for new tenant deployment"
git push origin feat/new-tenant-deployment
```

---

## Part 6: Deploy and Test

### Step 6.1: Merge and Deploy

1. Go to GitHub repository → **Pull requests**
2. Click **New pull request**
3. Base: `main` ← Compare: `feat/new-tenant-deployment`
4. Click **Create pull request**
5. Review changes, then click **Merge pull request**
6. GitHub Actions will automatically deploy to Azure

### Step 6.2: Monitor Deployment

1. GitHub → **Actions** tab
2. Click the running workflow
3. Watch build and deploy steps
4. Wait for "Build and Deploy Job" to complete (5-10 minutes)

### Step 6.3: Test Application

1. Visit your Static Web App URL: `https://YOUR-SWA-URL.azurestaticapps.net`
2. Click **Login** → Sign in with your Entra ID account
3. After login, open browser console (F12)
4. Look for log messages:
   - `☁️ Using Azure Cosmos DB for data persistence`
   - User ID should show email address, not GUID
5. Create test data:
   - Add a dream in Dream Book
   - Add a weekly goal
   - Update career goals
6. Refresh the page - data should persist
7. Check role-based access:
   - Admin users see Admin Dashboard
   - Managers see People Hub
   - Coaches see Dream Coach

### Step 6.4: Verify Cosmos DB Documents

1. Azure Portal → Your Cosmos DB account
2. Click **Data Explorer**
3. Expand `dreamspace` → `users`
4. Click **Items**
5. Select a document
6. Verify structure:

```json
{
  "id": "john.smith@yourcompany.com",
  "userId": "john.smith@yourcompany.com",
  "aadObjectId": "19db4ac5-2133-4b29-89af-96d8d9941aaf",
  "name": "John Smith",
  "email": "john.smith@yourcompany.com",
  "dreamBook": [...],
  "weeklyGoals": [...],
  "score": 0,
  "lastUpdated": "2025-10-11T..."
}
```

✅ **Success**: Document ID is human-readable email, not a GUID!

---

## Part 7: Post-Deployment Setup

### Step 7.1: Configure Monitoring

1. Static Web App → **Application Insights** (auto-created)
2. Create alert rules:
   - **Availability**: Set up URL ping test
   - **Response time**: Alert if p95 > 3 seconds
   - **Failed requests**: Alert if > 10 failures/5min

3. Cosmos DB → **Insights**
4. Create alerts:
   - **RU consumption**: Alert if > 80% of provisioned
   - **Throttled requests (429)**: Alert if any occur
   - **Availability**: Alert if < 99.9%

### Step 7.2: Configure Backup

1. Cosmos DB → **Backup & Restore**
2. Backup mode:
   - **Periodic**: Default (30-day retention, every 4 hours)
   - **Continuous**: 7-day rolling backup (costs extra)
3. Verify backup is enabled

### Step 7.3: User Onboarding

1. Add users to Entra ID (if not already present)
2. Assign app roles in Enterprise Applications
3. Send announcement email with:
   - New app URL
   - Login instructions
   - Brief feature overview
4. Provide support contact

---

## Troubleshooting

### Issue: "Failed to acquire token" error

**Solution**:
- Verify `clientId` and `authority` in `authConfig.js`
- Check redirect URIs in Entra ID app registration
- Clear browser cache and cookies
- Try incognito/private window

### Issue: "Database not configured" error

**Solution**:
- Check `COSMOS_ENDPOINT` and `COSMOS_KEY` are set in Static Web App settings
- Verify Cosmos DB account is in same resource group
- Check Cosmos DB firewall (should allow all by default)

### Issue: Data not persisting

**Solution**:
- Open browser console, look for Cosmos DB errors
- Verify container partition key is `/id` (not `/userId`)
- Check user ID is email format in console logs
- Test with localStorage fallback (dev mode)

### Issue: Roles not working

**Solution**:
- Verify app roles created in Entra ID
- Assign users to roles in Enterprise Applications
- Check `roles` claim in ID token (browser console)
- User must log out and back in after role assignment

### Issue: GitHub Actions deployment fails

**Solution**:
- Check GitHub secret is named correctly in workflow file
- Verify deployment token is valid (regenerate if needed)
- Check build logs for specific errors
- Ensure `package.json` and dependencies are correct

---

## Cost Breakdown

### Monthly Costs (East US, assuming no free tier)

| Service | Plan | Cost |
|---------|------|------|
| Azure Static Web Apps | Standard | $9/month |
| Cosmos DB | 400 RU/s provisioned | $24/month |
| Application Insights | Basic (5GB) | Free (pay for overage) |
| Entra ID | Free tier | $0 |
| **Total** | | **~$33/month** |

### With Free Tier (First 12 months)

- Cosmos DB: 400 RU/s + 5GB free
- Result: **~$9/month** (Static Web Apps only)

### Cost Optimization Tips

1. Use autoscale for Cosmos if traffic varies
2. Monitor and adjust RU/s based on actual usage
3. Enable TTL on transient data containers
4. Use shared throughput at database level
5. Consider serverless Cosmos for low traffic

---

## Security Checklist

- [ ] Single-tenant Entra ID configured
- [ ] App roles created and assigned
- [ ] Cosmos DB keys stored as app settings (not in code)
- [ ] Redirect URIs restricted to known domains
- [ ] HTTPS enforced on all endpoints
- [ ] CORS configured correctly
- [ ] Application Insights monitoring enabled
- [ ] Alerts configured for failures and anomalies
- [ ] Backup policy verified
- [ ] Access reviews scheduled for app role assignments

---

## Next Steps

1. **Custom Domain** (optional):
   - Static Web App → Custom domains → Add
   - Verify DNS records
   - SSL automatically provisioned

2. **Multi-region** (optional):
   - Cosmos DB → Replicate data globally
   - Add read regions for better performance

3. **CI/CD Enhancements**:
   - Add staging environment
   - Implement deployment slots
   - Add smoke tests to workflow

4. **Advanced Monitoring**:
   - Set up Log Analytics workspace
   - Create custom dashboards
   - Implement distributed tracing

---

## Support and Resources

- **Azure Documentation**: https://docs.microsoft.com/azure
- **Cosmos DB Best Practices**: https://docs.microsoft.com/azure/cosmos-db/
- **Static Web Apps Docs**: https://docs.microsoft.com/azure/static-web-apps/
- **Entra ID App Roles**: See `ENTRA_ROLES_SETUP.md` in repo

For issues or questions, contact your Azure administrator or open a GitHub issue.

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Static Web App URL**: _________________

**Cosmos DB Account**: _________________

**Entra ID App Client ID**: _________________

