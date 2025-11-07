# 🎯 Monitoring Setup - Summary

## What Was Set Up

### ✅ Files Created

**PowerShell Script:**
- `docs-deployment/SETUP_MONITORING.ps1` - Automated Azure setup

**Frontend Code:**
- `src/config/appInsights.js` - Application Insights configuration
- Updated `src/main.jsx` - Initialize monitoring on app start
- Updated `src/components/ErrorBoundary.jsx` - Auto-track errors
- Updated `package.json` - Added `@applicationinsights/web` dependency

**Documentation:**
- `docs-deployment/README_MONITORING.md` - Main guide
- `docs-deployment/MONITORING_QUICK_START.md` - Fast setup
- `docs-deployment/MONITORING_GUIDE.md` - Detailed guide
- `docs-deployment/MONITORING_USAGE_EXAMPLES.md` - Code examples
- `docs-deployment/ENVIRONMENT_VARIABLES_MONITORING.md` - Env vars help

## What It Monitors

### Automatic (No Code Changes Needed)
✅ All API requests (success/failure/duration)
✅ Page views and navigation (React Router)
✅ JavaScript errors and exceptions
✅ Cosmos DB queries and performance
✅ User sessions and engagement
✅ AJAX/fetch requests

### Optional (Add Custom Tracking)
📊 Business events (dreams created, goals completed)
📊 Feature usage (button clicks, filters)
📊 Performance metrics (load times)
📊 Custom errors with context

## Quick Start

### Step 1: Run Setup Script
```powershell
.\docs-deployment\SETUP_MONITORING.ps1 `
  -ResourceGroup "dreamspace-rg" `
  -FunctionAppName "your-azure-function-name" `
  -AlertEmail "your@email.com"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Add Connection String
From script output, add to Azure Portal or `.env.local`:
```
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxxxx;...
```

### Step 4: Deploy
```bash
npm run build
# Deploy to Azure
```

### Step 5: View Monitoring
Azure Portal → Application Insights → Your App → Live Metrics

## What You'll See in Azure

**Live Metrics Dashboard:**
- Incoming request rate
- Failed request count
- Server response time
- Dependency call duration
- Exception rate

**Failures View:**
- Stack traces for all errors
- Failed API calls grouped by type
- Click to see full details

**Performance View:**
- Slowest operations
- Database query times
- Dependency duration
- Response time trends

**Logs (Kusto Queries):**
- Custom queries for deep analysis
- Pre-built query examples provided

## Alerts Configured

If you provided an email, these alerts were set up:

1. **High API Failure Rate**
   - Triggers: >10 failed requests in 5 minutes
   - Action: Email alert

2. **Slow API Response**
   - Triggers: Average response time >3 seconds
   - Action: Email alert

## Cost

**Included in Azure Free Tier:**
- First 5 GB/month of telemetry data

**Estimated Usage:**
- Small app: ~1 GB/month = FREE
- After 5 GB: ~$2.30/GB

## Verification Checklist

After deployment:
- [ ] Visit your site
- [ ] Open browser console - see "✅ Application Insights initialized"
- [ ] Azure Portal → Application Insights → Live Metrics shows activity
- [ ] Failures tab shows errors (or is empty = good!)
- [ ] Performance tab shows request metrics

## Integration Points

**Frontend:**
- `src/main.jsx` - Initializes monitoring on startup
- `src/config/appInsights.js` - Configuration and helpers
- `src/components/ErrorBoundary.jsx` - Automatic error tracking

**Backend (Azure Functions):**
- `api/host.json` - Already configured with sampling
- Connection string auto-configured by setup script

## Sample Queries

Quick queries to try in Application Insights → Logs:

**Recent errors:**
```kusto
exceptions | where timestamp > ago(24h) | take 10
```

**Slow operations:**
```kusto
requests | where duration > 1000 | order by duration desc | take 10
```

**User activity:**
```kusto
pageViews | where timestamp > ago(24h) | summarize count() by name
```

## Custom Tracking Examples

```javascript
import { trackEvent, trackError } from './config/appInsights';

// Track dream creation
function createDream(dream) {
  trackEvent('DreamCreated', { category: dream.category });
  // ... your code
}

// Track errors
try {
  await saveData();
} catch (error) {
  trackError(error, { operation: 'saveData' });
}
```

See `MONITORING_USAGE_EXAMPLES.md` for more.

## Troubleshooting

**No data showing?**
- Wait 2-5 minutes for initial ingestion
- Check Live Metrics (real-time)
- Verify connection string is set

**Console warning?**
- "Application Insights not configured" = env var not set
- Restart dev server after adding env vars

**Alerts not arriving?**
- Check spam folder
- Verify alert rules in Azure Portal
- May need to confirm email subscription

## Next Steps

1. ✅ **Setup Complete** - Monitoring is configured
2. 📝 **Add Custom Tracking** (optional) - Track business events
3. 📊 **Create Dashboards** (optional) - Custom Azure dashboards
4. 🔔 **Add More Alerts** (optional) - Budget, memory, etc.

## Documentation Quick Links

| Need | See |
|------|-----|
| Fast setup | `MONITORING_QUICK_START.md` |
| Detailed guide | `MONITORING_GUIDE.md` |
| Code examples | `MONITORING_USAGE_EXAMPLES.md` |
| Environment vars | `ENVIRONMENT_VARIABLES_MONITORING.md` |
| Overview | `README_MONITORING.md` |

---

**Status:** ✅ Ready to deploy!

Run the setup script whenever you're ready to enable monitoring in Azure.

