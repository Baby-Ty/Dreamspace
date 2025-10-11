# New Tenant Deployment Branch

⚠️ **IMPORTANT: This branch contains BREAKING CHANGES and should NOT be merged to `main`**

## Purpose

This branch (`new-tenant-deployment`) is specifically for deploying Dreamspace to a **new Azure tenant** with clean infrastructure and no existing user data.

## Key Differences from Main

### Document ID Format Change
- **Main branch**: Uses Azure AD Object IDs (GUIDs) as Cosmos document IDs
  ```json
  { "id": "19db4ac5-2133-4b29-89af-96d8d9941aaf" }
  ```

- **This branch**: Uses email/UPN as Cosmos document IDs (human-readable)
  ```json
  { 
    "id": "user@domain.com",
    "aadObjectId": "19db4ac5-2133-4b29-89af-96d8d9941aaf"
  }
  ```

### Why This Matters

**This change is BREAKING** for existing deployments:
- Existing users with data stored under GUID-based IDs will NOT be found
- Login with new code will create "new" user profiles
- All existing user data (dreams, goals, connects) will appear lost

## Deployment Strategy

### ✅ Safe: Deploy to New Tenant

This branch is designed for:
- Fresh Azure tenant with no existing users
- New Cosmos DB account with no existing data
- Clean Entra ID app registration
- New Azure Static Web App instance

### ❌ Unsafe: Deploy to Existing Production

**DO NOT**:
- Merge this branch to `main`
- Deploy to existing Azure Static Web App
- Use with existing Cosmos DB that has GUID-based documents

## How to Use This Branch

### Option 1: Separate Azure Static Web App (Recommended)

1. Create NEW Azure Static Web App for the new tenant
2. Configure it to deploy from `new-tenant-deployment` branch:
   ```
   Branch: new-tenant-deployment
   ```
3. Follow `NEW_TENANT_DEPLOYMENT.md` guide
4. Keep existing production on `main` branch unchanged

### Option 2: Fork Repository

1. Fork the repository for the new tenant
2. Set `new-tenant-deployment` as default branch in fork
3. Configure separate Azure Static Web App for fork
4. Original repo stays on `main` for existing production

### Option 3: Separate Remote

1. Add new tenant's GitHub org as remote:
   ```bash
   git remote add new-tenant https://github.com/NEW-ORG/Dreamspace.git
   git push new-tenant new-tenant-deployment:main
   ```
2. New tenant deploys from their `main` (your `new-tenant-deployment`)
3. Keep this repo's `main` for current production

## Configuration Required

Before deploying from this branch, you MUST update:

### 1. Entra ID Configuration
**File**: `src/auth/authConfig.js`

```javascript
// Update with NEW tenant values
clientId: "YOUR_NEW_CLIENT_ID",
authority: "https://login.microsoftonline.com/YOUR_NEW_TENANT_ID"
```

### 2. GitHub Workflow (Optional)
**File**: `.github/workflows/azure-static-web-apps-*.yml`

Update to use separate secret for new tenant:
```yaml
azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_NEW_TENANT }}
```

## Files Added in This Branch

### Documentation
- `NEW_TENANT_DEPLOYMENT.md` - Complete deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `QUICK_REFERENCE.md` - Quick reference guide
- `IMPLEMENTATION_SUMMARY.md` - What's automated vs manual
- `BRANCH_README.md` - This file

### Automation Scripts
- `scripts/provision-new-tenant.ps1` - PowerShell provisioning
- `scripts/provision-new-tenant.sh` - Bash provisioning

### Code Changes
- `src/context/AuthContext.jsx` - Use email/UPN as user ID
- `src/schemas/userData.js` - Add aadObjectId field
- `.gitignore` - Add credential file patterns

## Deployment Checklist

- [ ] Provision new Azure resources (Resource Group, Cosmos, SWA)
- [ ] Create new Entra ID app registration
- [ ] Update `authConfig.js` with new client ID and tenant ID
- [ ] Configure Azure Static Web App to deploy from this branch
- [ ] Set environment variables in new Static Web App
- [ ] Add GitHub secret for new tenant deployment token
- [ ] Verify Cosmos partition key is `/id` not `/userId`
- [ ] Test login and data persistence
- [ ] Verify Cosmos documents use email-based IDs

## Success Criteria

After deployment, verify:

✅ Users can login with new tenant Entra ID  
✅ User data persists across sessions  
✅ Cosmos documents use email format as ID  
✅ `aadObjectId` field is populated  
✅ Role-based access works (Admin/Manager/Coach)  
✅ No impact to existing production deployment  

## Support Resources

- **Primary Guide**: `NEW_TENANT_DEPLOYMENT.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Quick Ref**: `QUICK_REFERENCE.md`
- **Scripts**: `scripts/provision-new-tenant.*`

## Timeline for Migration

This branch serves as:
1. **Immediate**: New tenant deployment (safe)
2. **Future**: Data migration strategy for existing tenants (requires additional work)

### Future: Migrating Existing Production

If you want to eventually migrate existing production to use email-based IDs:

**Required work**:
1. Add dual-lookup logic to check both ID formats
2. Create data migration script to copy GUID documents to email-based IDs
3. Test migration thoroughly in staging environment
4. Plan maintenance window for production migration
5. Backup all data before migration

**Not included in this branch** - requires separate implementation.

## Questions?

- Review troubleshooting section in `NEW_TENANT_DEPLOYMENT.md`
- Check `QUICK_REFERENCE.md` for common tasks
- Open GitHub issue with `[new-tenant]` tag

---

**Branch Created**: October 11, 2025  
**Purpose**: New tenant deployment only  
**Status**: Ready for deployment to new Azure tenant  
**Main Branch**: Unchanged and safe for existing production

