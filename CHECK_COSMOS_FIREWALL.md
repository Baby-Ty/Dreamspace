# Check Cosmos DB Firewall Settings

If your environment variables are set correctly but the API still returns 500 errors, the issue might be the Cosmos DB firewall blocking connections.

## Steps to Fix

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Cosmos DB account: `cosmos-dreamspace-prod-20251013`
3. In the left menu, click **Networking** (under Settings)
4. Check the firewall settings:

### Option 1: Allow All Azure Services (Recommended for Static Web Apps)
- Select **Selected networks**
- Check ✅ **Allow access from Azure Portal**
- Check ✅ **Allow access from within Azure datacenters**
- Click **Save**

### Option 2: Allow All Networks (For Testing Only)
- Select **All networks**
- Click **Save**
- ⚠️ **Warning**: This is less secure, use only for testing
- Switch back to "Selected networks" after confirming it works

## After Changing Settings

1. Wait 1-2 minutes for changes to apply
2. Restart your Static Web App
3. Clear browser cache
4. Try loading your app again

## Verify Connectivity

You can test if the API can reach Cosmos DB by:
1. Going to your Static Web App
2. Click **Functions** in the left menu (if available)
3. Click on **health** function
4. Click **Get Function Url** and open it in browser
5. Should return: `{"status":"healthy"}`

If it still fails, check the Function logs for detailed error messages.

