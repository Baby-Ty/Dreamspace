# DreamSpace Monitoring Guide

Simple guide to monitor your Azure deployment.

## Quick Setup

### 1. Run the Setup Script

```powershell
cd docs-deployment

# Basic setup (no alerts)
.\SETUP_MONITORING.ps1 -ResourceGroup "dreamspace-rg" -FunctionAppName "your-function-app-name"

# Full setup with email alerts
.\SETUP_MONITORING.ps1 -ResourceGroup "dreamspace-rg" -FunctionAppName "your-function-app-name" -AlertEmail "your@email.com"
```

### 2. Add Frontend Monitoring

1. **Install the package:**
   ```bash
   npm install
   ```

2. **Add the connection string to your environment:**
   
   The setup script will output a connection string. Add it to:
   - Azure Portal → Static Web App → Configuration → Application settings
   - Or your `.env.local` file for local development:
     ```
     VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxxxx;...
     ```

3. **Import in your main App file:**
   ```javascript
   // In src/App.jsx (add at the top)
   import './config/appInsights';
   ```

### 3. That's It!

Visit Azure Portal → Application Insights → `your-app-name-insights`

## What You Can Monitor

### In Azure Portal

**Live Metrics** (Real-time monitoring)
- Active requests
- Failed requests
- Server response time
- Dependency calls (Cosmos DB)

**Failures** (Error tracking)
- All exceptions and errors
- Failed API calls
- Stack traces

**Performance** (Speed monitoring)
- Slowest operations
- Dependency duration
- Database query performance

**Availability** (Uptime)
- Create ping tests to check if site is up

### Useful Queries

Go to Application Insights → Logs, try these queries:

**Find slowest API calls (last hour):**
```kusto
requests
| where timestamp > ago(1h)
| summarize avg(duration), max(duration) by name
| order by avg_duration desc
| take 10
```

**Find all errors (last 24 hours):**
```kusto
exceptions
| where timestamp > ago(24h)
| project timestamp, type, outerMessage, problemId
| order by timestamp desc
```

**Cosmos DB throttling events:**
```kusto
dependencies
| where type == "Azure DocumentDB"
| where resultCode == "429"
| summarize count() by bin(timestamp, 5m)
```

**User activity (custom events):**
```kusto
customEvents
| where timestamp > ago(24h)
| summarize count() by name
| order by count_ desc
```

## Track Custom Events

You can track business metrics in your code:

```javascript
import { trackEvent, trackError } from './config/appInsights';

// Track when a user creates a dream
trackEvent('DreamCreated', { 
  userId: user.id,
  dreamType: 'personal'
});

// Track errors with context
try {
  await saveDream(dream);
} catch (error) {
  trackError(error, { 
    action: 'saveDream',
    userId: user.id 
  });
}
```

## Simple Alerts Setup

If you provided an email during setup, you'll get alerts for:

1. **High API Failure Rate** - More than 10 failed requests in 5 minutes
2. **Slow API Response** - Average response time over 3 seconds

### Add More Alerts

Azure Portal → Application Insights → Alerts → Create

Common alerts to add:
- **Cosmos DB Throttling** - When you get 429 errors
- **High Memory Usage** - Memory > 80%
- **Budget Alert** - When spending exceeds budget

## Costs

Application Insights pricing:
- **First 5GB/month**: FREE
- **After 5GB**: ~$2.30/GB

Typical usage: 1-2 GB/month for small apps = **FREE**

To reduce data ingestion:
- Disable debug logging in production
- Use sampling (already configured in host.json)
- Filter out unnecessary telemetry

## Troubleshooting

### No data showing up?

1. **Check connection string is set:**
   ```powershell
   az functionapp config appsettings list --name your-function-app-name --resource-group dreamspace-rg
   ```

2. **Generate some traffic:**
   - Visit your site
   - Make API calls
   - Data can take 2-5 minutes to appear

3. **Check browser console:**
   - Should see "✅ Application Insights initialized"
   - If not, check VITE_APPINSIGHTS_CONNECTION_STRING is set

### Still having issues?

Check Application Insights → Live Metrics in Azure Portal. This shows real-time data and helps diagnose connection issues.

## Quick Reference

| What to Monitor | Where to Look |
|----------------|---------------|
| Is my site up? | Live Metrics (real-time) |
| API errors | Failures tab |
| Slow operations | Performance tab |
| Database issues | Performance → Dependencies |
| User activity | Custom Events |
| Logs & queries | Logs tab |

## Next Steps

1. ✅ Run SETUP_MONITORING.ps1
2. ✅ Add connection string to frontend
3. ✅ Import appInsights in App.jsx
4. ✅ Deploy and test
5. 📊 Check Azure Portal after a few minutes

---

**Need more detailed monitoring?** Let us know what specific metrics you want to track!

