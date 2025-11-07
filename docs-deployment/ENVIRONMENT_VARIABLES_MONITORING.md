# Environment Variables for Monitoring

## Application Insights Connection String

After running `SETUP_MONITORING.ps1`, add this environment variable:

### For Azure Static Web App or Web App

**Azure Portal:**
1. Navigate to your Static Web App or Web App
2. Go to **Configuration** → **Application settings**
3. Click **+ New application setting**
4. Add:
   - **Name:** `VITE_APPINSIGHTS_CONNECTION_STRING`
   - **Value:** `InstrumentationKey=xxxxx;IngestionEndpoint=https://...`
   (The script outputs this value)
5. Click **Save**
6. Restart your app if needed

### For Local Development

Create or update `.env.local` in the project root:

```bash
# Application Insights Monitoring
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxxxx;IngestionEndpoint=https://...
```

**Note:** This file is git-ignored and won't be committed.

## Finding Your Connection String

If you lost the connection string from the setup script:

### Using Azure Portal
1. Go to **Application Insights** resource
2. Click **Properties** (in the left menu)
3. Copy the **Connection String**

### Using Azure CLI
```powershell
az monitor app-insights component show `
  --app your-app-insights-name `
  --resource-group dreamspace-rg `
  --query connectionString -o tsv
```

## Verify It's Working

1. **In your browser console**, you should see:
   ```
   ✅ Application Insights initialized
   ```

2. **In Azure Portal:**
   - Go to Application Insights → Live Metrics
   - Make some requests to your app
   - You should see requests appearing in real-time

## Troubleshooting

**"Application Insights not configured" warning in console:**
- The environment variable is not set or misspelled
- For Azure deployments, restart the app after adding the variable
- For local dev, restart your dev server (`npm run dev`)

**No data appearing in Azure Portal:**
- Wait 2-5 minutes for data to appear
- Check Live Metrics for real-time data
- Verify the connection string is correct

