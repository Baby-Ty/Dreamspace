# Azure Static Web App - Quick Reference

## 🚀 Deploy in 5 Minutes

### 1. Update Variables (30 seconds)

Edit `DEPLOY_WEBAPP_AZURE.ps1`:
```powershell
$TenantId = "YOUR_TENANT_ID"
$SubscriptionId = "YOUR_SUBSCRIPTION_ID"
$GitHubRepo = "username/Dreamspace"
```

### 2. Run Script (3 minutes)

```powershell
.\DEPLOY_WEBAPP_AZURE.ps1
```

### 3. Add GitHub Secret (1 minute)

Copy deployment token from output, then:
- GitHub repo → Settings → Secrets → Actions
- New secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`
- Paste token → Save

### 4. Push & Deploy (1 minute)

```bash
git add .
git commit -m "Configure Azure deployment"
git push origin main
```

Done! ✅

---

## 📋 Required Configuration

### Azure Resources
- ✅ Cosmos DB (already created)
- ⚠️ Static Web App (created by script)

### GitHub Secrets
| Name | Value | Required |
|------|-------|----------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | From deployment script | ✅ Yes |
| `VITE_COSMOS_ENDPOINT` | `https://xxx.documents.azure.com:443/` | Optional |

### Azure AD Redirect URI
Add to app registration:
- `https://your-app.azurestaticapps.net`

---

## 🔍 Verification Commands

```powershell
# Check Static Web App status
az staticwebapp show --name swa-dreamspace-prod --resource-group rg_Dreams2025Dev

# View application settings
az staticwebapp appsettings list --name swa-dreamspace-prod --resource-group rg_Dreams2025Dev

# Get deployment token
az staticwebapp secrets list --name swa-dreamspace-prod --resource-group rg_Dreams2025Dev

# View logs (in Portal)
# Azure Portal → Static Web App → Logs
```

---

## 🌐 Important URLs

### Application
- **Production**: `https://[your-app].azurestaticapps.net`
- **Health Check**: `https://[your-app].azurestaticapps.net/api/health`

### Azure Portal
- **Static Web App**: Portal → Resource Groups → rg_Dreams2025Dev → swa-dreamspace-prod
- **Cosmos DB**: Portal → Resource Groups → rg_Dreams2025Dev → [cosmos-account-name]
- **Azure AD**: Portal → Microsoft Entra ID → App registrations

### GitHub
- **Actions**: `https://github.com/[username]/Dreamspace/actions`
- **Secrets**: `https://github.com/[username]/Dreamspace/settings/secrets/actions`

---

## ⚙️ Application Settings Reference

### Backend (API Functions)
Set in: Azure Portal → Static Web App → Configuration

```env
COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_KEY=your-primary-master-key
```

### Frontend (Build-time)
Set in: GitHub Secrets or local `.env`

```env
VITE_APP_ENV=production
VITE_COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
```

---

## 🛠️ Common Tasks

### View Deployment Logs
```powershell
# GitHub Actions logs
gh run list --limit 5
gh run view [run-id]

# Or in browser
https://github.com/[username]/Dreamspace/actions
```

### Manual Deploy
```powershell
# Build locally
npm run build

# Deploy
az staticwebapp deploy `
  --name swa-dreamspace-prod `
  --resource-group rg_Dreams2025Dev `
  --source ./dist
```

### Update Environment Variables
```powershell
# Add/update settings
az staticwebapp appsettings set `
  --name swa-dreamspace-prod `
  --resource-group rg_Dreams2025Dev `
  --setting-names "KEY=value"

# Delete setting
az staticwebapp appsettings delete `
  --name swa-dreamspace-prod `
  --resource-group rg_Dreams2025Dev `
  --setting-names "KEY"
```

### Regenerate Deployment Token
```powershell
az staticwebapp secrets list `
  --name swa-dreamspace-prod `
  --resource-group rg_Dreams2025Dev `
  --query "properties.apiKey" `
  --output tsv
```

### Delete Static Web App
```powershell
az staticwebapp delete `
  --name swa-dreamspace-prod `
  --resource-group rg_Dreams2025Dev `
  --yes
```

---

## 🐛 Quick Troubleshooting

### App not loading
- ✅ Check Static Web App is running in Portal
- ✅ Verify GitHub Actions deployment succeeded
- ✅ Check browser console for errors

### API errors (500)
- ✅ Verify `COSMOS_ENDPOINT` and `COSMOS_KEY` in app settings
- ✅ Check Cosmos DB is accessible
- ✅ View Function logs in Portal

### Login fails
- ✅ Add redirect URI in Azure AD app registration
- ✅ Verify `clientId` in authConfig.js
- ✅ Clear browser cache

### Deployment fails
- ✅ Check GitHub Actions logs
- ✅ Verify deployment token is correct
- ✅ Ensure `npm run build` works locally

---

## 📊 Cost Monitor

### Check Current Costs
```powershell
# Resource group costs
az consumption usage list `
  --resource-group rg_Dreams2025Dev `
  --start-date 2025-10-01 `
  --end-date 2025-10-31
```

### Set Budget Alert
1. Portal → Cost Management + Billing
2. Budgets → Add
3. Set budget: $50/month
4. Alert at: 80% ($40)

---

## 🔄 CI/CD Pipeline

### Workflow Triggers
- ✅ Push to `main` branch
- ✅ Pull request to `main`
- ✅ Manual workflow dispatch

### Pipeline Steps
1. Checkout code
2. Setup Node.js 18
3. Install dependencies
4. Run linter
5. Run tests
6. Build frontend
7. Deploy to Azure

### Typical Deploy Time
- Build: 2-3 minutes
- Deploy: 1-2 minutes
- **Total: 3-5 minutes**

---

## 📞 Support

### Azure Support
- Portal → Help + support → New support request
- Or call: Azure Support number for your region

### Internal Documentation
- `docs-deployment/STATIC_WEB_APP_SETUP.md` - Full setup guide
- `docs-deployment/AZURE_DEPLOYMENT.md` - General deployment
- `docs-new-tenant-deployment/NEW_TENANT_DEPLOYMENT.md` - New tenant

### External Resources
- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)
- [GitHub Actions Docs](https://docs.github.com/actions)

---

## ✅ Deployment Checklist

Before going live:

- [ ] Cosmos DB created and accessible
- [ ] Static Web App deployed successfully
- [ ] GitHub secret configured
- [ ] Azure AD redirect URI updated
- [ ] Environment variables set
- [ ] First deployment succeeded
- [ ] Health endpoint returns 200
- [ ] Can log in successfully
- [ ] Data persists across page refresh
- [ ] No console errors
- [ ] Monitoring/alerts configured

---

**Quick Links:**
- [Full Setup Guide](./STATIC_WEB_APP_SETUP.md)
- [Troubleshooting](./STATIC_WEB_APP_SETUP.md#troubleshooting)
- [Cost Breakdown](./STATIC_WEB_APP_SETUP.md#cost-breakdown)

