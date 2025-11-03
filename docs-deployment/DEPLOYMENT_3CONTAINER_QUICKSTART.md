# 3-Container Database Migration - Quick Deployment Guide

## ✅ Implementation Status: COMPLETE

All code has been implemented and is ready for deployment.

## Pre-Deployment Checklist

- [x] Infrastructure scripts updated
- [x] Azure Functions created (4 new, 2 updated)
- [x] Client services implemented
- [x] Schemas updated
- [x] Documentation complete
- [x] No linting errors
- [ ] Cosmos DB items container created
- [ ] Azure Functions deployed
- [ ] Static Web App deployed

## Deployment Order

### Step 1: Create Items Container (5 minutes)

Choose ONE method:

#### Option A: Use Setup Script (Recommended)
```powershell
cd scripts
.\setup-people-hub-cosmos.ps1 -ResourceGroupName "your-rg-name" -CosmosAccountName "your-cosmos-account"
```

#### Option B: Manual Azure Portal
1. Go to Azure Portal → Your Cosmos DB Account
2. Click "Data Explorer"
3. Select database: `dreamspace`
4. Click "New Container"
5. Settings:
   - Container ID: `items`
   - Partition key: `/userId`
   - Throughput: Database shared (or 400 RU/s)
6. Click OK

#### Option C: Azure CLI
```bash
az cosmosdb sql container create \
    --account-name YOUR_COSMOS_ACCOUNT \
    --resource-group YOUR_RESOURCE_GROUP \
    --database-name dreamspace \
    --name items \
    --partition-key-path "/userId"
```

### Step 2: Deploy Azure Functions (10-15 minutes)

Your Azure Functions are deployed via GitHub Actions. Simply push to main:

```bash
# Make sure all files are committed
git add .
git commit -m "feat: Implement 3-container database architecture"
git push origin main
```

Monitor deployment:
1. Go to GitHub → Your Repo → Actions tab
2. Watch the deployment workflow
3. Wait for green checkmark

### Step 3: Deploy Static Web App (5-10 minutes)

The Static Web App deploys automatically with the Functions:

```bash
# Already deployed with Step 2 push
# Just verify in Azure Portal
```

Monitor deployment:
1. Azure Portal → Your Static Web App
2. Check "Deployment History"
3. Verify latest deployment is "Succeeded"

### Step 4: Verify Deployment (5 minutes)

#### Test New User (Should use V2)
1. Visit your app URL
2. Sign in with a NEW user account
3. Create a dream
4. Open browser DevTools → Console
5. Look for: `📦 Data migrated to 3-container format`

#### Test Existing User (Should migrate to V2)
1. Sign in with EXISTING user
2. Should load existing data (V1)
3. Make ANY change (add dream, complete goal, etc.)
4. Check console for: `📦 Data migrated to 3-container format`
5. Refresh page
6. Check console for: `📦 User is on 3-container structure (v2)`

#### Verify in Cosmos DB
1. Azure Portal → Cosmos DB → Data Explorer
2. Open `dreamspace` → `items`
3. Should see new documents appearing
4. Each document has: `id`, `userId`, `type`, and type-specific data

## Post-Deployment Monitoring

### Day 1
- Monitor Azure Functions logs for errors
- Check Cosmos DB RU consumption (should decrease)
- Verify no user-reported issues
- Watch for any 500 errors

### Week 1
- Track migration progress (users moving to V2)
- Monitor average RU per operation
- Verify data integrity
- Performance metrics

### Month 1
- Analyze RU savings (target: 70% reduction)
- User feedback
- Consider Phase 7 optimizations

## Troubleshooting

### Issue: Items container not found
**Solution**: Re-run Step 1 to create the container

### Issue: Azure Functions not deployed
**Solution**: 
1. Check GitHub Actions for errors
2. Verify Function App settings have COSMOS_ENDPOINT and COSMOS_KEY
3. Redeploy manually if needed

### Issue: Users not migrating to V2
**Solution**: Check browser console for errors. Verify:
- Azure Functions are responding
- CORS is configured correctly
- Items container exists

### Issue: Data not loading
**Solution**: 
1. Check if it's V1 or V2 user
2. Verify getUserData endpoint works
3. Check Cosmos DB for user document
4. Fallback to localStorage should activate

## Rollback Procedure

If critical issues occur:

### Quick Rollback (5 minutes)
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

### Full Rollback (10 minutes)
1. Azure Portal → Function App → Deployment Slots
2. Swap to previous slot
3. Static Web App will auto-deploy old code
4. Data remains safe in both V1 and V2 formats

### Emergency Stop (1 minute)
If needed, you can temporarily disable the new endpoints:
1. Azure Portal → Function App → Functions
2. Disable: saveItem, getItems, deleteItem, batchSaveItems
3. Old endpoints (saveUserData, getUserData) still support V1

## Success Criteria

✅ Deployment is successful when:
- Items container exists in Cosmos DB
- All Azure Functions show "Healthy" status
- New users create items in items container
- Existing users load data successfully
- No 500 errors in logs
- RU consumption is stable or decreasing

## Getting Help

If you encounter issues:
1. Check logs: Azure Portal → Function App → Logs
2. Check console: Browser DevTools → Console
3. Review: `docs-implementation-history/3_CONTAINER_DB_MIGRATION.md`
4. Verify: All environment variables are set

## Quick Commands Reference

```powershell
# Create items container
.\scripts\setup-people-hub-cosmos.ps1 -ResourceGroupName "rg-name" -CosmosAccountName "cosmos-name"

# Deploy everything
git add .
git commit -m "feat: 3-container architecture"
git push origin main

# Check Function App status
az functionapp show --name YOUR_FUNCTION_APP --resource-group YOUR_RG

# Check Static Web App status
az staticwebapp show --name YOUR_STATIC_APP --resource-group YOUR_RG

# View Function logs
az functionapp log tail --name YOUR_FUNCTION_APP --resource-group YOUR_RG
```

## Expected Timeline

| Step | Duration | Cumulative |
|------|----------|------------|
| Create Container | 5 min | 5 min |
| Deploy Functions | 15 min | 20 min |
| Deploy Web App | 10 min | 30 min |
| Verify | 5 min | 35 min |
| **Total** | **~35 minutes** | |

## What Happens Next?

After deployment:
1. **New users**: Immediately use V2 format
2. **Existing users**: Migrate on first save
3. **Data**: Both formats coexist safely
4. **Performance**: Gradual improvement as users migrate
5. **Monitoring**: Track migration progress over time

## No User Impact

✅ Users will not notice any changes:
- Same UI
- Same features
- Same functionality
- Faster performance (behind the scenes)

The migration is completely transparent!

---

**Ready to deploy?** Start with Step 1: Create the items container!


