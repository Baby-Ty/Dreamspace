# 🔧 Fix: User Data Not Saving to Cosmos DB

## Problem
User data is not saving to Cosmos DB on the live site. The API is returning an error because the Azure Function App is missing required environment variables.

## Root Cause
The `saveUserData` API endpoint checks for `COSMOS_ENDPOINT` and `COSMOS_KEY` environment variables. If these are not set in the Azure Function App configuration, it returns:

```json
{
  "error": "Database not configured",
  "details": "COSMOS_ENDPOINT and COSMOS_KEY environment variables are required"
}
```

## Quick Diagnosis

### 1. Test the Health Endpoint

Open this URL in your browser:
```
https://func-dreamspace-prod.azurewebsites.net/api/health
```

**Expected Output if Working:**
```json
{
  "status": "healthy",
  "checks": {
    "cosmosdb": {
      "status": "healthy"
    }
  }
}
```

**If Broken, You'll See:**
```json
{
  "status": "degraded",
  "checks": {
    "cosmosdb": {
      "status": "degraded",
      "message": "Cosmos DB credentials not configured"
    }
  }
}
```

### 2. Check Browser Console

On your live site (`dreamspace.tylerstewart.co.za`), open the browser console (F12) and look for:
- ❌ Red errors from `saveUserData` API calls
- ❌ "Database not configured" messages
- ❌ HTTP 500 errors

## Solution: Configure Azure Function App

You need to add the Cosmos DB connection details to your Azure Function App configuration.

### Option A: Using Azure Portal (Recommended)

1. **Open Azure Portal** → Navigate to your Function App: `func-dreamspace-prod`

2. **Go to Configuration**:
   - Left menu → **Settings** → **Configuration**
   - Click **Application settings** tab

3. **Add Required Variables**:

   Click **+ New application setting** for each:

   | Name | Value | Where to Get It |
   |------|-------|-----------------|
   | `COSMOS_ENDPOINT` | `https://your-account.documents.azure.com:443/` | Azure Portal → Cosmos DB Account → Keys → URI |
   | `COSMOS_KEY` | `your-primary-key-here` | Azure Portal → Cosmos DB Account → Keys → Primary Key |
   | `AZURE_STORAGE_CONNECTION_STRING` | `DefaultEndpointsProtocol=https;AccountName=...` | Azure Portal → Storage Account → Access keys → Connection string |

4. **Save Changes**:
   - Click **OK** after adding each setting
   - Click **Save** at the top
   - Click **Continue** to confirm restart

5. **Wait for Restart**:
   - The Function App will restart (takes ~30-60 seconds)
   - Wait for "Configuration settings saved successfully" message

### Option B: Using PowerShell Script

Save this as `CONFIGURE_FUNCTION_APP_COSMOSDB.ps1` and run it:

```powershell
# Configuration
$functionAppName = "func-dreamspace-prod"
$resourceGroupName = "YOUR_RESOURCE_GROUP_NAME"  # e.g., "rg-dreamspace-prod"
$cosmosAccountName = "YOUR_COSMOS_ACCOUNT_NAME"   # e.g., "cosmos-dreamspace-prod"
$storageAccountName = "YOUR_STORAGE_ACCOUNT_NAME" # e.g., "stdreamspaceprod"

Write-Host "🔧 Configuring Function App: $functionAppName" -ForegroundColor Cyan

# Login to Azure (if not already logged in)
Write-Host "🔐 Checking Azure login..." -ForegroundColor Yellow
az account show 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in. Opening browser for authentication..." -ForegroundColor Yellow
    az login
}

# Get Cosmos DB endpoint and key
Write-Host "📦 Getting Cosmos DB credentials..." -ForegroundColor Yellow
$cosmosEndpoint = az cosmosdb show --name $cosmosAccountName --resource-group $resourceGroupName --query "documentEndpoint" -o tsv
$cosmosKey = az cosmosdb keys list --name $cosmosAccountName --resource-group $resourceGroupName --query "primaryMasterKey" -o tsv

if (-not $cosmosEndpoint -or -not $cosmosKey) {
    Write-Host "❌ Failed to retrieve Cosmos DB credentials. Check your Cosmos DB account name and resource group." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Cosmos DB Endpoint: $cosmosEndpoint" -ForegroundColor Green

# Get Storage connection string
Write-Host "📦 Getting Storage Account connection string..." -ForegroundColor Yellow
$storageConnectionString = az storage account show-connection-string --name $storageAccountName --resource-group $resourceGroupName --query "connectionString" -o tsv

if (-not $storageConnectionString) {
    Write-Host "❌ Failed to retrieve Storage connection string. Check your Storage account name and resource group." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Storage connection string retrieved" -ForegroundColor Green

# Set environment variables in Function App
Write-Host "⚙️  Setting environment variables in Function App..." -ForegroundColor Yellow

az functionapp config appsettings set --name $functionAppName --resource-group $resourceGroupName --settings `
    "COSMOS_ENDPOINT=$cosmosEndpoint" `
    "COSMOS_KEY=$cosmosKey" `
    "AZURE_STORAGE_CONNECTION_STRING=$storageConnectionString"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Environment variables configured successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 Function App is restarting..." -ForegroundColor Yellow
    Write-Host "⏳ Wait 30-60 seconds before testing..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🧪 Test the health endpoint:" -ForegroundColor Cyan
    Write-Host "   https://$functionAppName.azurewebsites.net/api/health" -ForegroundColor White
} else {
    Write-Host "❌ Failed to configure environment variables" -ForegroundColor Red
    exit 1
}
```

**To run:**
1. Update the variable values at the top of the script
2. Open PowerShell as Administrator
3. Run: `.\CONFIGURE_FUNCTION_APP_COSMOSDB.ps1`

### Option C: Using Azure CLI (Manual)

If you know your resource names, run these commands:

```bash
# Set variables
FUNCTION_APP="func-dreamspace-prod"
RESOURCE_GROUP="your-resource-group"
COSMOS_ACCOUNT="your-cosmos-account"
STORAGE_ACCOUNT="your-storage-account"

# Get Cosmos DB credentials
COSMOS_ENDPOINT=$(az cosmosdb show --name $COSMOS_ACCOUNT --resource-group $RESOURCE_GROUP --query "documentEndpoint" -o tsv)
COSMOS_KEY=$(az cosmosdb keys list --name $COSMOS_ACCOUNT --resource-group $RESOURCE_GROUP --query "primaryMasterKey" -o tsv)
STORAGE_CONN=$(az storage account show-connection-string --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --query "connectionString" -o tsv)

# Set in Function App
az functionapp config appsettings set --name $FUNCTION_APP --resource-group $RESOURCE_GROUP --settings \
    "COSMOS_ENDPOINT=$COSMOS_ENDPOINT" \
    "COSMOS_KEY=$COSMOS_KEY" \
    "AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONN"
```

## Verification Steps

After configuring the environment variables:

### 1. Wait for Restart
Wait 30-60 seconds for the Function App to restart

### 2. Test Health Endpoint
```
https://func-dreamspace-prod.azurewebsites.net/api/health
```

Should return:
```json
{
  "status": "healthy",
  "checks": {
    "cosmosdb": {
      "status": "healthy",
      "responseTime": 50
    }
  }
}
```

### 3. Test on Live Site

1. Go to: `https://dreamspace.tylerstewart.co.za`
2. Sign in with your Microsoft account
3. Open browser console (F12)
4. Try to add a dream or make any change
5. Look for console logs:
   - ✅ Should see: "✅ Data saved to Cosmos DB for user: [your-id]"
   - ❌ Should NOT see: "Database not configured" errors

### 4. Verify Data in Cosmos DB

1. Go to Azure Portal → Your Cosmos DB Account
2. Click **Data Explorer**
3. Expand `dreamspace` database → `users` container
4. Look for your user document
5. Verify it has recent `lastUpdated` timestamp

## Additional Troubleshooting

### If health check still shows "degraded":

1. **Check Cosmos DB Account Name**:
   - Verify the Cosmos DB account exists
   - Verify you're using the correct resource group

2. **Check Cosmos DB Keys**:
   - Go to Cosmos DB → Keys in Azure Portal
   - Copy the **Primary Key** (not Secondary)
   - Copy the full **URI** (including `https://` and port `:443/`)

3. **Check Network Access**:
   - Go to Cosmos DB → Networking
   - Ensure "Allow access from Azure Portal" is enabled
   - Consider enabling "Allow access from Azure datacenters" temporarily

4. **Check Function App Logs**:
   - Go to Function App → Log Stream
   - Look for errors related to Cosmos DB connection

### If data still not saving:

1. **Check CORS Settings**:
   - Function App → API → CORS
   - Add your domain: `https://dreamspace.tylerstewart.co.za`
   - Add wildcard if needed: `*` (for testing only)

2. **Check Function App is Running**:
   - Function App → Overview
   - Verify status is "Running"
   - Try stopping and starting if needed

3. **Check Deployment**:
   - Ensure latest API code is deployed
   - Check Function App → Functions → List all functions
   - Verify `saveUserData` exists

## Files Modified in This Fix

- Created: `FIX_COSMOS_DB_API.md` (this file)
- Created: `CONFIGURE_FUNCTION_APP_COSMOSDB.ps1` (PowerShell script)
- Created: `TEST_API_HEALTH.html` (test page)

## Related Documentation

- `ENVIRONMENT_VARIABLES.md` - Complete environment variable reference
- `docs-deployment/AZURE_DEPLOYMENT.md` - Azure deployment guide
- `api/saveUserData/index.js` - API endpoint source code (lines 176-186 show the check)

## Summary

✅ **Quick Fix**: Add `COSMOS_ENDPOINT` and `COSMOS_KEY` to your Function App configuration in Azure Portal

⏱️ **Time Required**: 5 minutes

🔧 **Difficulty**: Easy - no code changes needed

---

**Need Help?**
If you're still having issues, check:
1. Function App logs in Azure Portal
2. Browser console on the live site
3. Cosmos DB firewall settings




