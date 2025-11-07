# 📊 Monitoring Cheat Sheet

Quick reference for Azure Application Insights monitoring.

## Setup in 3 Commands

```powershell
# 1. Run setup
.\docs-deployment\SETUP_MONITORING.ps1 -ResourceGroup "dreamspace-rg" -FunctionAppName "your-app" -AlertEmail "you@email.com"

# 2. Install
npm install

# 3. Add env var and deploy
# VITE_APPINSIGHTS_CONNECTION_STRING=<from step 1>
```

## Azure Portal Quick Links

| What | Where |
|------|-------|
| Real-time monitoring | Application Insights → **Live Metrics** |
| View errors | Application Insights → **Failures** |
| Performance issues | Application Insights → **Performance** |
| Custom queries | Application Insights → **Logs** |
| Configure alerts | Application Insights → **Alerts** |
| Check costs | Application Insights → **Usage and estimated costs** |

## Essential Queries

Copy-paste into Application Insights → Logs:

### Recent Errors
```kusto
exceptions | where timestamp > ago(24h) | order by timestamp desc | take 10
```

### Slow Operations
```kusto
requests | where duration > 1000 | order by duration desc | take 10
```

### Request Count by Endpoint
```kusto
requests | where timestamp > ago(24h) | summarize count() by name
```

### Failed Requests
```kusto
requests | where success == false | order by timestamp desc | take 10
```

### Cosmos DB Performance
```kusto
dependencies | where type == "Azure DocumentDB" | summarize avg(duration) by name
```

## Track Custom Events (Code)

```javascript
import { trackEvent, trackError } from './config/appInsights';

// Track event
trackEvent('DreamCreated', { category: 'personal' });

// Track error
try {
  await saveDream();
} catch (error) {
  trackError(error, { operation: 'saveDream' });
}
```

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| No data in portal | Wait 2-5 minutes; check Live Metrics |
| Console warning | Set `VITE_APPINSIGHTS_CONNECTION_STRING` env var |
| Script fails | Run `az login`; verify resource names |
| Alerts not working | Check spam; verify email in Azure Portal |

## Key Metrics to Watch

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| API Response Time | <500ms | 500-2000ms | >2000ms |
| Error Rate | <1% | 1-5% | >5% |
| Availability | >99.9% | 95-99% | <95% |

## Alert Rules Setup

Recommended alerts:

```powershell
# High error rate
resultCode >= 500, count > 10, window 5m

# Slow responses  
duration > 3000, avg, window 5m

# Availability
availabilityResults/availabilityPercentage < 99
```

## Cost Quick Reference

- **Free:** First 5 GB/month
- **Paid:** ~$2.30/GB after 5 GB
- **Typical:** 1-2 GB/month for small apps = **FREE**

## Files Modified

✅ `package.json` - Added `@applicationinsights/web`
✅ `src/config/appInsights.js` - Configuration (NEW)
✅ `src/main.jsx` - Initialize monitoring
✅ `src/components/ErrorBoundary.jsx` - Track errors

## Environment Variables

**Azure:**
```
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;...
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;...
```

**Local (`.env.local`):**
```
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;...
```

## Verification Checklist

- [ ] Script ran successfully
- [ ] Connection string added to Azure
- [ ] `npm install` completed
- [ ] Browser console: "✅ Application Insights initialized"
- [ ] Azure Portal → Live Metrics shows activity
- [ ] No errors in Failures tab (or expected errors)

## Quick Troubleshooting

```powershell
# Check if App Insights exists
az monitor app-insights component list --resource-group dreamspace-rg

# Get connection string
az monitor app-insights component show --app your-app-insights --resource-group dreamspace-rg --query connectionString

# List Function App settings
az functionapp config appsettings list --name your-function-app --resource-group dreamspace-rg
```

## Documentation Index

| Doc | Purpose |
|-----|---------|
| `MONITORING_CHECKLIST.md` | Step-by-step checklist |
| `MONITORING_QUICK_START.md` | 5-minute setup |
| `README_MONITORING.md` | Complete guide |
| `MONITORING_GUIDE.md` | Detailed walkthrough |
| `MONITORING_OVERVIEW.md` | Architecture & concepts |
| `MONITORING_USAGE_EXAMPLES.md` | Code samples |
| `MONITORING_CHEATSHEET.md` | This file |

## Support

**Azure Docs:** https://docs.microsoft.com/azure/azure-monitor/
**App Insights JS SDK:** https://github.com/microsoft/ApplicationInsights-JS

---

**Print this page and keep it handy!** 📄

