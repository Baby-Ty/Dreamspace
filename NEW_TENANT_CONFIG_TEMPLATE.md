# New Tenant Configuration Template

⚠️ **Before deploying this branch, you MUST update these configuration values**

This file tracks the tenant-specific values that need to be configured for the new deployment.

## Configuration Checklist

### 1. Azure Tenant Information

```
Azure Tenant ID: ________________________________
Azure Subscription ID: ________________________________
```

### 2. Entra ID App Registration

After creating the app registration, record:

```
Application (Client) ID: ________________________________
Authority URL: https://login.microsoftonline.com/[TENANT_ID]
```

**Update in code:**
- File: `src/auth/authConfig.js`
- Line 26: `clientId: "YOUR_CLIENT_ID_HERE"`
- Line 27: `authority: "https://login.microsoftonline.com/YOUR_TENANT_ID"`

### 3. Azure Cosmos DB

```
Account Name: ________________________________
Endpoint URL: https://[ACCOUNT_NAME].documents.azure.com:443/
Primary Key: ________________________________ (keep secure!)
Database: dreamspace
Container: users (partition key: /id)
```

### 4. Azure Static Web App

```
Static Web App Name: ________________________________
URL: https://[SWA_NAME].azurestaticapps.net
Deployment Token: ________________________________ (keep secure!)
```

**GitHub Configuration:**
- Branch to deploy: `new-tenant-deployment`
- Secret name: `AZURE_STATIC_WEB_APPS_API_TOKEN_NEW_TENANT`

### 5. Environment Variables

**Static Web App Configuration → Application settings:**

Frontend settings (build-time):
```
VITE_APP_ENV=production
VITE_COSMOS_ENDPOINT=https://[COSMOS_ACCOUNT].documents.azure.com:443/
```

Backend settings (runtime):
```
COSMOS_ENDPOINT=https://[COSMOS_ACCOUNT].documents.azure.com:443/
COSMOS_KEY=[PRIMARY_KEY_FROM_COSMOS]
```

### 6. App Roles Created

- [ ] DreamSpace.Admin
- [ ] DreamSpace.Manager
- [ ] DreamSpace.Coach

### 7. Initial Users and Role Assignments

| User Email | Role | Status |
|------------|------|--------|
| ________________________________ | Admin | [ ] Assigned |
| ________________________________ | Manager | [ ] Assigned |
| ________________________________ | Coach | [ ] Assigned |
| ________________________________ | Employee | [ ] Assigned |

---

## Pre-Deployment Verification

Before triggering deployment, verify:

- [ ] New resource group created: `rg-dreamspace-prod-eastus`
- [ ] Cosmos DB account created with `/id` partition key
- [ ] Static Web App created and connected to GitHub
- [ ] Entra ID app registration created for single-tenant
- [ ] App roles defined and users assigned
- [ ] `src/auth/authConfig.js` updated with new client ID and tenant ID
- [ ] Environment variables configured in Static Web App
- [ ] GitHub secret added: `AZURE_STATIC_WEB_APPS_API_TOKEN_NEW_TENANT`
- [ ] Branch `new-tenant-deployment` exists and is up to date
- [ ] Main branch is protected and unchanged

## Deployment Command

### Option 1: Azure Static Web App Auto-Deploy
Configure SWA to watch the `new-tenant-deployment` branch. Any push will trigger deployment.

### Option 2: Manual Workflow Trigger
If workflow is configured for manual trigger:
```bash
# Push changes to trigger deployment
git push origin new-tenant-deployment
```

Monitor deployment:
- GitHub: https://github.com/Baby-Ty/Dreamspace/actions
- Azure Portal: Static Web App → GitHub Actions

---

## Post-Deployment Verification

After deployment completes:

- [ ] Visit Static Web App URL
- [ ] Login with new tenant account
- [ ] Create test dream and save
- [ ] Refresh page - data persists
- [ ] Check Cosmos Data Explorer:
  - [ ] Document ID is email format
  - [ ] `aadObjectId` field exists
  - [ ] Data structure correct
- [ ] Test role-based access:
  - [ ] Admin sees Admin Dashboard
  - [ ] Manager sees People Hub
  - [ ] Coach sees Dream Coach
- [ ] Application Insights is collecting data
- [ ] No errors in browser console

---

## Rollback Procedure

If deployment fails:

1. Keep main branch active (existing production unaffected)
2. Review deployment logs in GitHub Actions
3. Check Application Insights for runtime errors
4. Verify environment variables in Static Web App
5. Check Cosmos DB connection and partition key
6. If needed, revert changes and redeploy:
   ```bash
   git revert HEAD
   git push origin new-tenant-deployment
   ```

---

## Important Notes

### DO NOT:
- ❌ Merge `new-tenant-deployment` branch to `main`
- ❌ Deploy this branch to existing production
- ❌ Use existing Cosmos DB with GUID-based documents
- ❌ Share Cosmos primary key in code or public repos

### DO:
- ✅ Keep this branch separate from main
- ✅ Use separate Azure resources for new tenant
- ✅ Verify partition key is `/id` before deployment
- ✅ Store credentials securely (Azure Key Vault recommended)
- ✅ Test thoroughly before announcing to users

---

## Support Contacts

| Role | Name | Contact |
|------|------|---------|
| Azure Admin | _____________ | _____________ |
| GitHub Admin | _____________ | _____________ |
| Technical Lead | _____________ | _____________ |

---

**Last Updated**: _________________

**Updated By**: _________________

**Deployment Date**: _________________

**Deployment Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

