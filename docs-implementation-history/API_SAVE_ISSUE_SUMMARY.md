# 🚨 API Save Issue - Quick Summary

## Problem
**User data is NOT saving to Cosmos DB on the live site**

## Root Cause
The Azure Function App (`func-dreamspace-prod.azurewebsites.net`) is missing required environment variables:
- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `AZURE_STORAGE_CONNECTION_STRING`

## How We Know This
Looking at `api/saveUserData/index.js` lines 176-186:

```javascript
// Check if Cosmos DB is configured
if (!usersContainer || !itemsContainer) {
  context.res = {
    status: 500,
    body: JSON.stringify({ 
      error: 'Database not configured', 
      details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required' 
    }),
    headers
  };
  return;
}
```

Without these environment variables, the API returns a 500 error with "Database not configured".

## Quick Test

### Option 1: Browser
1. Open this URL: https://func-dreamspace-prod.azurewebsites.net/api/health
2. If you see `"status": "degraded"` → Environment variables are missing ❌
3. If you see `"status": "healthy"` → API is working correctly ✅

### Option 2: Test Page
1. Open `TEST_API_HEALTH.html` in your browser
2. Click "Test Health Endpoint"
3. See color-coded results with recommendations

## Quick Fix (5 minutes)

### Method 1: PowerShell Script (Easiest)
```powershell
.\CONFIGURE_FUNCTION_APP_COSMOSDB.ps1
```
This script will:
- ✅ Auto-detect your resources
- ✅ Retrieve Cosmos DB credentials
- ✅ Configure Function App automatically
- ✅ Verify the setup

### Method 2: Azure Portal (Manual)
1. Go to: Azure Portal → `func-dreamspace-prod` Function App
2. Click: **Settings** → **Configuration** → **Application settings**
3. Add these settings:

   | Name | Value |
   |------|-------|
   | `COSMOS_ENDPOINT` | Get from: Cosmos DB → Keys → URI |
   | `COSMOS_KEY` | Get from: Cosmos DB → Keys → Primary Key |
   | `AZURE_STORAGE_CONNECTION_STRING` | Get from: Storage Account → Access keys |

4. Click **Save** and wait for restart (~30 sec)

## Files Created
1. **FIX_COSMOS_DB_API.md** - Complete fix documentation with step-by-step instructions
2. **CONFIGURE_FUNCTION_APP_COSMOSDB.ps1** - Automated PowerShell script to fix the issue
3. **TEST_API_HEALTH.html** - Interactive test page to check API health
4. **API_SAVE_ISSUE_SUMMARY.md** - This file (quick reference)

## Verification After Fix

### 1. Check Health Endpoint
```
https://func-dreamspace-prod.azurewebsites.net/api/health
```
Should return: `"status": "healthy"`

### 2. Check Live Site
1. Go to: https://dreamspace.tylerstewart.co.za
2. Sign in
3. Open browser console (F12)
4. Try adding a dream
5. Look for: "✅ Data saved to Cosmos DB for user: [your-id]"

### 3. Check Cosmos DB
1. Azure Portal → Cosmos DB → Data Explorer
2. Open: `dreamspace` database → `users` container
3. Find your user document
4. Verify `lastUpdated` timestamp is recent

## Why This Happened
When deploying the Function App, environment variables need to be manually configured in Azure Portal. They don't get deployed from code for security reasons (keys should never be in source control).

## Impact
- ❌ Users cannot save dreams, goals, or any data
- ❌ Data appears to save in browser but doesn't persist
- ❌ No data visible after refresh or re-login
- ✅ Local development works fine (uses localStorage)

## Next Steps
1. Run the PowerShell script **OR** manually configure in Azure Portal
2. Test the health endpoint
3. Verify data saves on the live site
4. Monitor for any other issues

## Related Code Files
- `api/saveUserData/index.js` - The API endpoint that's failing (lines 176-186)
- `src/services/databaseService.js` - Frontend service that calls the API (lines 142-193)
- `api/health/index.js` - Health check endpoint to test configuration

## Support
If you still have issues after configuring the environment variables:
1. Check Azure Function App logs (Portal → Function App → Log Stream)
2. Check browser console for specific error messages
3. Verify Cosmos DB firewall settings
4. See detailed troubleshooting in `FIX_COSMOS_DB_API.md`

---

**Status**: 🔴 **URGENT** - Production issue affecting all users

**Priority**: HIGH - User data not persisting

**ETA to Fix**: 5 minutes (if you have Azure access)




