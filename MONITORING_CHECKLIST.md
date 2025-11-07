# ✅ Monitoring Setup Checklist

Quick checklist to set up Azure monitoring for DreamSpace.

## Prerequisites
- [ ] Azure subscription active
- [ ] Resource group created (e.g., `dreamspace-rg`)
- [ ] Function App deployed
- [ ] Azure CLI installed (or use Azure Cloud Shell)

## Setup Steps

### 1. Run Setup Script
```powershell
.\docs-deployment\SETUP_MONITORING.ps1 `
  -ResourceGroup "dreamspace-rg" `
  -FunctionAppName "YOUR_FUNCTION_APP_NAME" `
  -AlertEmail "YOUR_EMAIL@example.com"
```

- [ ] Script completed successfully
- [ ] Copied connection string from output
- [ ] Application Insights resource created

### 2. Install Frontend Dependency
```bash
npm install
```

- [ ] Package installed successfully
- [ ] No errors in terminal

### 3. Configure Environment Variable

**For Azure Deployment:**
- [ ] Go to Azure Portal
- [ ] Navigate to Static Web App (or Web App)
- [ ] Configuration → Application settings → New application setting
- [ ] Name: `VITE_APPINSIGHTS_CONNECTION_STRING`
- [ ] Value: [paste connection string from step 1]
- [ ] Click Save
- [ ] Restart app (if needed)

**For Local Development:**
- [ ] Create `.env.local` in project root
- [ ] Add: `VITE_APPINSIGHTS_CONNECTION_STRING=your-connection-string`
- [ ] Restart dev server

### 4. Deploy Application
```bash
npm run build
# Then deploy to Azure
```

- [ ] Build completed successfully
- [ ] Deployed to Azure

### 5. Verify Monitoring

**Browser Check:**
- [ ] Visit your site
- [ ] Open browser console (F12)
- [ ] See message: "✅ Application Insights initialized"

**Azure Portal Check:**
- [ ] Go to Azure Portal
- [ ] Navigate to Application Insights resource
- [ ] Click "Live Metrics"
- [ ] Refresh your site
- [ ] See requests appearing in real-time

**Data Check (wait 2-5 minutes):**
- [ ] Application Insights → Overview shows data
- [ ] Failures tab accessible (may be empty = good!)
- [ ] Performance tab shows requests

### 6. Test Alerts (Optional)
- [ ] Check email for Azure Alert confirmation
- [ ] Confirm subscription if needed
- [ ] Trigger test alert by making many requests

## Troubleshooting

### ❌ "Application Insights not configured" in console
**Fix:** Environment variable not set or named incorrectly
- Check variable name: `VITE_APPINSIGHTS_CONNECTION_STRING`
- Restart dev server or Azure app after adding

### ❌ No data in Azure Portal
**Fix:** Wait or verify connection
- Wait 2-5 minutes for initial data
- Check Live Metrics (shows real-time data)
- Verify connection string is correct
- Generate traffic to your site

### ❌ Script fails
**Fix:** Check permissions and parameters
- Verify Azure CLI is logged in: `az login`
- Check resource names are correct
- Ensure you have Owner/Contributor role

## What's Being Monitored?

✅ **Automatically tracked:**
- API requests and responses
- Page views
- JavaScript errors
- Database queries (Cosmos DB)
- User sessions
- Performance metrics

## View Your Monitoring

**Quick Link:** 
https://portal.azure.com → Search "Application Insights" → Select your app

**Key Views:**
1. **Live Metrics** - Real-time dashboard
2. **Failures** - All errors with stack traces
3. **Performance** - Slow operations
4. **Logs** - Custom queries

## Sample Query to Try

Go to Application Insights → Logs and run:

```kusto
requests
| where timestamp > ago(1h)
| summarize count() by name, resultCode
| order by count_ desc
```

## Cost

- First 5 GB/month: **FREE**
- Typical small app usage: ~1 GB/month

## Files Modified

- ✅ `package.json` - Added Application Insights package
- ✅ `src/main.jsx` - Initialize monitoring
- ✅ `src/config/appInsights.js` - Configuration (new file)
- ✅ `src/components/ErrorBoundary.jsx` - Error tracking

## Documentation

Detailed docs in `docs-deployment/`:
- `README_MONITORING.md` - Complete guide
- `MONITORING_QUICK_START.md` - Fast reference
- `MONITORING_GUIDE.md` - Detailed walkthrough
- `MONITORING_USAGE_EXAMPLES.md` - Code examples

## Done! 🎉

- [ ] All steps completed
- [ ] Monitoring verified in Azure Portal
- [ ] Alerts configured (if desired)
- [ ] Team notified

---

**Need Help?** Check the detailed guides in `docs-deployment/` or Azure Monitor documentation.

