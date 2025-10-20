# Azure Static Web Apps Deployment Guide

## Overview

This guide walks you through deploying the Dreamspace application to Azure Static Web Apps. This setup includes:
- ✅ React + Vite frontend (SPA)
- ✅ Azure Functions API backend
- ✅ Cosmos DB integration
- ✅ Microsoft Entra ID authentication
- ✅ Automated GitHub Actions deployment

## Prerequisites

Before starting, ensure you have:
- [x] Azure subscription with appropriate permissions
- [x] Cosmos DB already created and configured
- [x] Azure CLI installed ([download](https://aka.ms/installazurecliwindows))
- [x] GitHub account with access to your repository
- [x] Git installed locally
- [x] Node.js 18+ and npm installed

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Azure Static Web App (Standard Tier)                  │
│                                                         │
│  ┌─────────────────┐       ┌────────────────────────┐ │
│  │  Frontend (SPA) │       │  API (Functions)       │ │
│  │  - React/Vite   │──────▶│  - 18 HTTP functions   │ │
│  │  - MSAL Auth    │       │  - Cosmos DB client    │ │
│  └─────────────────┘       └────────────────────────┘ │
│                                      │                  │
└──────────────────────────────────────┼──────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────┐
                        │  Azure Cosmos DB         │
                        │  - Database: dreamspace  │
                        │  - Container: users      │
                        │  - Container: teams      │
                        └──────────────────────────┘
```

## Quick Start (Recommended)

### Step 1: Update Configuration

Open `DEPLOY_WEBAPP_AZURE.ps1` and update these values:

```powershell
$TenantId = "YOUR_TENANT_ID_HERE"           # Your Azure AD Tenant ID
$SubscriptionId = "YOUR_SUBSCRIPTION_ID_HERE"  # Your Azure Subscription ID
$GitHubRepo = "YOUR_GITHUB_USERNAME/Dreamspace"  # Your GitHub repo
```

**Where to find these values:**
- **Tenant ID**: Azure Portal → Microsoft Entra ID → Overview → Tenant ID
- **Subscription ID**: Azure Portal → Subscriptions → Copy the ID
- **GitHub Repo**: Format is `username/repository-name`

### Step 2: Run Deployment Script

```powershell
# Open PowerShell as Administrator
cd "C:\SupportStack\All CLients\Dreams\Dreamspace"

# Run the deployment script
.\DEPLOY_WEBAPP_AZURE.ps1
```

The script will:
1. ✅ Validate prerequisites (Azure CLI, extensions)
2. ✅ Log you into Azure
3. ✅ Verify your Cosmos DB exists
4. ✅ Create the Static Web App
5. ✅ Configure environment variables
6. ✅ Retrieve deployment token
7. ✅ Display next steps

**Expected time:** 3-5 minutes

### Step 3: Configure GitHub Secret

After the script completes, it will display a **deployment token**. Copy this token.

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Set:
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - **Value**: [paste the deployment token]
5. Click **Add secret**

**Optional:** If you need Cosmos DB endpoint in frontend:
- **Name**: `VITE_COSMOS_ENDPOINT`
- **Value**: `https://your-cosmos-account.documents.azure.com:443/`

### Step 4: Update Azure AD Redirect URI

1. Azure Portal → **Microsoft Entra ID** → **App registrations**
2. Find your app (Client ID: `ebe60b7a-93c9-4b12-8375-4ab3181000e8`)
3. Click **Authentication**
4. Under **Single-page application**, add your Static Web App URL:
   - Example: `https://happy-tree-abc123.azurestaticapps.net`
5. Also add to **Logout URL**
6. Click **Save**

### Step 5: Deploy Your Code

Now push your code to GitHub to trigger deployment:

```bash
git add .
git commit -m "Configure Azure Static Web App deployment"
git push origin main
```

### Step 6: Monitor Deployment

1. Go to GitHub → **Actions** tab
2. Watch the workflow run (takes 3-5 minutes)
3. Once complete, visit your Static Web App URL
4. Test the health endpoint: `https://your-app.azurestaticapps.net/api/health`

---

## Manual Steps (Alternative)

If you prefer Azure Portal over PowerShell:

### 1. Create Static Web App

1. Azure Portal → **Create a resource**
2. Search for "Static Web App" → Click **Create**
3. Configure:
   - **Subscription**: Your subscription
   - **Resource Group**: `rg_Dreams2025Dev` (same as Cosmos DB)
   - **Name**: `swa-dreamspace-prod` (must be globally unique)
   - **Plan type**: **Standard** (required for API functions)
   - **Region for Functions**: `East US 2`
   - **Deployment source**: `GitHub`
4. Sign in to GitHub and authorize Azure
5. Select:
   - **Organization**: Your GitHub username
   - **Repository**: Dreamspace
   - **Branch**: main
6. Build Details:
   - **Build Presets**: `React`
   - **App location**: `/`
   - **Api location**: `api`
   - **Output location**: `dist`
7. Click **Review + create** → **Create**

### 2. Configure Application Settings

1. Go to your Static Web App
2. Click **Configuration** → **Application settings**
3. Add these settings:

| Name | Value | Notes |
|------|-------|-------|
| `COSMOS_ENDPOINT` | `https://your-cosmos.documents.azure.com:443/` | Required for API |
| `COSMOS_KEY` | `[your-primary-key]` | Required for API |
| `VITE_APP_ENV` | `production` | Frontend environment |
| `VITE_COSMOS_ENDPOINT` | `https://your-cosmos.documents.azure.com:443/` | Optional for frontend |

4. Click **Save**

### 3. Get Deployment Token

1. In your Static Web App, click **Overview**
2. Click **Manage deployment token**
3. Copy the token
4. Add to GitHub Secrets (see Step 3 in Quick Start)

---

## Configuration Files

### GitHub Actions Workflow

Location: `.github/workflows/azure-static-web-apps-deployment.yml`

This workflow automatically:
- Runs on every push to `main`
- Installs dependencies
- Runs linter and tests
- Builds the frontend
- Deploys to Azure Static Web Apps
- Deploys API functions

**No changes needed** - it's ready to use once you add the GitHub secret.

### Static Web App Configuration

Location: `staticwebapp.config.json`

This file configures:
- Routing rules (SPA fallback to index.html)
- API route handling
- CORS headers
- MIME types

**Already configured** - no changes needed.

### API Functions Configuration

Location: `api/host.json`

Configures Azure Functions runtime:
- Version 2.0
- Application Insights integration
- Extension bundles

**Already configured** - no changes needed.

---

## Environment Variables

### Frontend (Build-time)

These are set in GitHub Actions or your local `.env` file:

```env
VITE_APP_ENV=production
VITE_COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
```

### Backend (Runtime)

These are set in Static Web App application settings:

```env
COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_KEY=your-primary-master-key
```

**Important:** Never commit `COSMOS_KEY` to source control!

---

## Verification Checklist

After deployment, verify everything works:

- [ ] Visit Static Web App URL - loads without errors
- [ ] API health check returns 200: `/api/health`
- [ ] Can log in with Azure AD
- [ ] User data persists after page refresh
- [ ] Console shows: `☁️ Using Azure Cosmos DB for data persistence`
- [ ] No 401/403/500 errors in browser console
- [ ] All pages load correctly (Dashboard, Dream Book, etc.)
- [ ] Role-based features work (if applicable)

---

## Troubleshooting

### Issue: "Failed to create Static Web App"

**Possible causes:**
- Name already taken (must be globally unique)
- Insufficient permissions
- Resource provider not registered

**Solutions:**
1. Try a different name: `swa-dreamspace-prod-2025`
2. Check permissions: Owner or Contributor role needed
3. Register provider: `az provider register --namespace Microsoft.Web`

### Issue: "Database not configured" error

**Possible causes:**
- Missing Cosmos DB credentials
- Incorrect application settings

**Solutions:**
1. Verify `COSMOS_ENDPOINT` and `COSMOS_KEY` in application settings
2. Check Cosmos DB account is accessible
3. Verify firewall settings allow Azure services

### Issue: GitHub Actions deployment fails

**Possible causes:**
- Missing or incorrect GitHub secret
- Build errors
- Deployment token expired

**Solutions:**
1. Verify secret name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
2. Check build logs in Actions tab
3. Regenerate deployment token if needed

### Issue: Login redirects fail

**Possible causes:**
- Redirect URI not configured in Azure AD
- Wrong client ID or tenant ID

**Solutions:**
1. Add Static Web App URL to Azure AD redirect URIs
2. Verify `clientId` in `src/auth/authConfig.js`
3. Clear browser cache and cookies

### Issue: API functions return 500 errors

**Possible causes:**
- Missing Cosmos DB credentials
- Container not found
- Incorrect partition key

**Solutions:**
1. Check application settings for `COSMOS_ENDPOINT` and `COSMOS_KEY`
2. Verify containers exist: `users` with partition key `/id`
3. Check function logs in Azure Portal

### Issue: Static files not loading (404 errors)

**Possible causes:**
- Incorrect build output location
- Missing `staticwebapp.config.json`

**Solutions:**
1. Verify build outputs to `/dist` folder
2. Check workflow has `app_location: "/dist"`
3. Ensure `staticwebapp.config.json` is in root

---

## Cost Breakdown

### Monthly Costs (East US)

| Service | Plan | Cost |
|---------|------|------|
| Azure Static Web Apps | Standard | $9/month |
| Azure Functions | Included in SWA | $0 |
| Cosmos DB | 400 RU/s provisioned | $24/month |
| Application Insights | First 5GB | Free |
| **Total** | | **~$33/month** |

### With Free Tier (First 12 months)

If you have free tier credits:
- Cosmos DB: 400 RU/s free (first account)
- Result: **~$9/month** (only Static Web Apps)

### Cost Optimization Tips

1. **Use Cosmos DB serverless** for low traffic: Pay per request instead of provisioned throughput
2. **Enable autoscale** on Cosmos DB: Scale down during off-hours
3. **Monitor usage** via Azure Cost Management
4. **Set up budget alerts** to avoid surprises

---

## Security Best Practices

### ✅ Implemented

- [x] HTTPS-only enforcement
- [x] Azure AD authentication
- [x] Secrets stored in Azure (not in code)
- [x] CORS configuration
- [x] Partition keys for data isolation

### 🔒 Recommended Additional Steps

1. **Enable Application Insights** for monitoring and alerts
2. **Configure custom domains** with Azure-managed SSL certificates
3. **Set up Azure Key Vault** for secret management
4. **Enable Cosmos DB backup** (automatic with periodic mode)
5. **Implement rate limiting** on API endpoints
6. **Review and rotate** Cosmos DB keys regularly
7. **Enable Azure AD Conditional Access** for enhanced security

---

## Next Steps

After successful deployment:

### 1. Custom Domain (Optional)

1. Static Web App → **Custom domains**
2. Click **Add**
3. Enter your domain (e.g., `dreamspace.yourcompany.com`)
4. Follow DNS verification steps
5. SSL certificate auto-provisioned

### 2. Monitoring Setup

1. Static Web App → **Application Insights** (auto-created)
2. Set up availability tests
3. Configure alerts:
   - Response time > 3 seconds
   - Failed requests > 10 per 5 minutes
   - Availability < 99%

### 3. Staging Environment

Create a second Static Web App for staging:
1. Name it `swa-dreamspace-staging`
2. Connect to `develop` branch
3. Test changes before production

### 4. CI/CD Enhancements

Enhance the GitHub Actions workflow:
- Add smoke tests after deployment
- Implement blue-green deployments
- Add rollback automation
- Integrate with Slack/Teams for notifications

---

## Support and Resources

### Documentation

- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Functions Docs](https://docs.microsoft.com/azure/azure-functions/)
- [Cosmos DB Best Practices](https://docs.microsoft.com/azure/cosmos-db/best-practice-nosql)

### Internal Documentation

- `docs-deployment/AZURE_DEPLOYMENT.md` - General Azure deployment
- `docs-new-tenant-deployment/NEW_TENANT_DEPLOYMENT.md` - New tenant setup
- `docs-deployment/PRE_DEPLOYMENT_CHECKLIST.md` - Pre-deployment checks

### Get Help

1. Check Azure Portal → Static Web App → **Logs**
2. Review GitHub Actions workflow logs
3. Check Cosmos DB metrics in Azure Portal
4. Contact your Azure administrator

---

## Summary

**You've successfully set up:**

✅ Azure Static Web App for frontend hosting  
✅ Azure Functions API with Cosmos DB integration  
✅ Automated GitHub Actions deployment pipeline  
✅ Production-ready configuration with security best practices  

**Your app is now:**

- 🌐 Accessible at: `https://your-app.azurestaticapps.net`
- 🚀 Auto-deploying on every git push to main
- 🔒 Secured with Azure AD authentication
- 💾 Persisting data to Cosmos DB
- 📊 Monitored with Application Insights

**Congratulations! 🎉**

---

**Last Updated:** 2025-10-20  
**Version:** 1.0  
**Maintained by:** DevOps Team

