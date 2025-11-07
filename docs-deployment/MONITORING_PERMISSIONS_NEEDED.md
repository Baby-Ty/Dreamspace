# Application Insights Setup - Permissions Required

## Current Issue

The monitoring setup script requires permissions to create and configure Azure resources that are currently not available.

## Required Permissions

To run the `SETUP_MONITORING.ps1` script, the user needs **one of these roles**:

### Option 1: Contributor Role on Resource Group (Recommended)
```powershell
az role assignment create `
  --assignee "Tyler.Stewart@netsurit.com" `
  --role "Contributor" `
  --resource-group "dreamspace-rg"
```

### Option 2: Owner Role on Resource Group
```powershell
az role assignment create `
  --assignee "Tyler.Stewart@netsurit.com" `
  --role "Owner" `
  --resource-group "dreamspace-rg"
```

### Option 3: Custom Role with Specific Permissions
Minimum required permissions:
- `Microsoft.Insights/components/*` (Application Insights)
- `Microsoft.Web/sites/config/write` (Function App settings)
- `Microsoft.Insights/actionGroups/*` (Alert notifications)
- `Microsoft.Insights/metricAlerts/*` (Alert rules)

## Alternative: Manual Setup by Admin

If granting permissions is not possible, an admin can manually create Application Insights:

### Step 1: Create Application Insights
**Azure Portal:**
1. Navigate to: https://portal.azure.com
2. Click "Create a resource" → Search "Application Insights"
3. Configure:
   - **Subscription**: [Your subscription]
   - **Resource Group**: `dreamspace-rg`
   - **Name**: `func-dreamspace-prod-insights`
   - **Region**: Same as Function App (e.g., East US)
   - **Application Type**: Web
4. Click **Review + Create** → **Create**

### Step 2: Get Connection String
1. Go to the new Application Insights resource
2. Click **Properties** (in left menu)
3. Copy the **Connection String** (looks like: `InstrumentationKey=xxx;IngestionEndpoint=https://...`)

### Step 3: Configure Function App
**Azure Portal:**
1. Navigate to Function App: `func-dreamspace-prod`
2. Go to **Configuration** → **Application settings**
3. Click **+ New application setting**
4. Add:
   - **Name**: `APPLICATIONINSIGHTS_CONNECTION_STRING`
   - **Value**: [paste connection string from step 2]
5. Click **OK** → **Save**

### Step 4: Configure Frontend (Static Web App)
**Azure Portal:**
1. Navigate to your Static Web App (or Web App)
2. Go to **Configuration** → **Application settings**
3. Click **+ New application setting**
4. Add:
   - **Name**: `VITE_APPINSIGHTS_CONNECTION_STRING`
   - **Value**: [paste connection string from step 2]
5. Click **OK** → **Save**

### Step 5: Optional - Set Up Alerts
**Azure Portal:**
1. Go to Application Insights → **Alerts**
2. Click **+ Create** → **Alert rule**
3. Configure two alerts:

**Alert 1: High Error Rate**
- Condition: `exceptions` count > 10 in 5 minutes
- Action: Email to `tyler.stewart@netsurit.com`

**Alert 2: Slow Response**
- Condition: `requests` average duration > 3000ms in 5 minutes
- Action: Email to `tyler.stewart@netsurit.com`

## Verification

After setup (whether automated or manual):

1. **Check Function App has connection string:**
   ```powershell
   az functionapp config appsettings list `
     --name func-dreamspace-prod `
     --resource-group dreamspace-rg `
     --query "[?name=='APPLICATIONINSIGHTS_CONNECTION_STRING']"
   ```

2. **Check Application Insights exists:**
   ```powershell
   az monitor app-insights component show `
     --app func-dreamspace-prod-insights `
     --resource-group dreamspace-rg
   ```

3. **View in Azure Portal:**
   - Go to Application Insights → Live Metrics
   - Make a request to your API
   - Should see activity in real-time

## Who Can Help

**Azure Subscription Admins** can grant the required permissions. Contact:
- Your Azure subscription owner
- Your IT admin or DevOps team
- The person who created the `dreamspace-rg` resource group

## Quick Summary for Admin

> Hi! I need help setting up Application Insights monitoring for our DreamSpace app.
> 
> Could you either:
> 1. Grant me **Contributor** role on the `dreamspace-rg` resource group, OR
> 2. Manually create an Application Insights resource named `func-dreamspace-prod-insights` and connect it to our Function App `func-dreamspace-prod`
>
> Here's the detailed guide: [share this file]
>
> Thanks!

---

## Next Steps After Permission Grant

Once you have permissions, simply re-run:

```powershell
.\docs-deployment\SETUP_MONITORING.ps1 `
  -ResourceGroup "dreamspace-rg" `
  -FunctionAppName "func-dreamspace-prod" `
  -AlertEmail "tyler.stewart@netsurit.com"
```

The script will automatically:
- Create Application Insights
- Connect Function App
- Set up alerts
- Configure logging
- Provide connection string for frontend

