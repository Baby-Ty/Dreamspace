# 📊 Azure Monitoring Setup - Complete Guide

Simple monitoring for DreamSpace using Application Insights.

## What's Included

This monitoring setup provides:

✅ **Automatic Tracking:**
- All API requests and responses
- Page views and navigation
- Errors and exceptions  
- Cosmos DB queries
- Performance metrics

✅ **Alerts:** (if email configured)
- High API failure rate
- Slow response times

✅ **Real-time Dashboard:**
- Live metrics
- Error tracking
- Performance monitoring

## Quick Setup (5 minutes)

### 1. Run Setup Script

```powershell
.\docs-deployment\SETUP_MONITORING.ps1 `
  -ResourceGroup "dreamspace-rg" `
  -FunctionAppName "your-function-app-name" `
  -AlertEmail "your@email.com"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variable

Add the connection string (from script output) to:

**Azure Portal:** Static Web App → Configuration → Application settings
```
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=...
```

**Local Dev:** Create `.env.local`
```
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=...
```

### 4. Done! ✅

Your monitoring is now active. Visit Azure Portal → Application Insights.

## Files Created

```
docs-deployment/
├── SETUP_MONITORING.ps1              # Main setup script
├── MONITORING_GUIDE.md                # Detailed guide
├── MONITORING_QUICK_START.md          # Quick reference
├── MONITORING_USAGE_EXAMPLES.md       # Code examples
├── ENVIRONMENT_VARIABLES_MONITORING.md # Env var help
└── README_MONITORING.md               # This file

src/config/
└── appInsights.js                     # Frontend config

package.json                           # Updated with @applicationinsights/web
src/main.jsx                          # Updated to initialize monitoring
src/components/ErrorBoundary.jsx      # Updated to track errors
```

## Viewing Monitoring Data

### Azure Portal

**URL:** https://portal.azure.com → Application Insights → `[your-app]-insights`

**Key Sections:**

1. **Live Metrics** - Real-time monitoring
   - See requests as they happen
   - Watch for errors immediately
   - View server performance

2. **Failures** - Error tracking
   - All exceptions with stack traces
   - Failed API calls
   - Grouped by type

3. **Performance** - Speed metrics
   - Slowest operations
   - Database query times
   - Response time trends

4. **Logs** - Query telemetry
   - Use Kusto queries
   - Custom reports
   - Detailed analysis

### Quick Queries

In Application Insights → Logs:

**Recent errors:**
```kusto
exceptions
| where timestamp > ago(24h)
| order by timestamp desc
| take 10
```

**Slow API calls:**
```kusto
requests
| where timestamp > ago(1h)
| where duration > 1000
| order by duration desc
| take 10
```

**User activity:**
```kusto
pageViews
| where timestamp > ago(24h)
| summarize count() by name
| order by count_ desc
```

## Custom Event Tracking

Track business metrics in your code:

```javascript
import { trackEvent, trackError } from './config/appInsights';

// Track dream creation
trackEvent('DreamCreated', { 
  category: dream.category 
});

// Track errors with context
try {
  await saveDream(dream);
} catch (error) {
  trackError(error, { operation: 'saveDream' });
}
```

See `MONITORING_USAGE_EXAMPLES.md` for more examples.

## Troubleshooting

### No data showing?

1. **Wait 2-5 minutes** - Initial data ingestion takes time
2. **Check Live Metrics** - Shows real-time data
3. **Verify connection string** - Check environment variables
4. **Generate traffic** - Visit your site, make API calls

### Console warning about App Insights?

If you see "Application Insights not configured":
- Environment variable not set
- Variable name misspelled
- Need to restart app/dev server

### Alerts not working?

- Verify email was provided to setup script
- Check Azure Portal → Alerts → Alert rules
- May need to confirm email subscription

## Cost Information

**Application Insights Pricing:**
- First 5 GB/month: **FREE**
- After 5 GB: ~$2.30/GB

**Typical Usage:**
- Small app: 0.5-1 GB/month = FREE
- Medium app: 2-3 GB/month = FREE
- Large app: 5+ GB/month = ~$5-10/month

**To reduce costs:**
- Sampling is already enabled (in host.json)
- Don't track debug logs in production
- Filter unnecessary telemetry

## Next Steps

- [ ] Run setup script
- [ ] Configure environment variable
- [ ] Deploy application
- [ ] Verify monitoring in Azure Portal
- [ ] Set up additional alerts (optional)
- [ ] Add custom event tracking (optional)

## Documentation

| Document | Purpose |
|----------|---------|
| `MONITORING_QUICK_START.md` | Fast 5-minute setup |
| `MONITORING_GUIDE.md` | Detailed guide with queries |
| `MONITORING_USAGE_EXAMPLES.md` | Code examples for tracking |
| `ENVIRONMENT_VARIABLES_MONITORING.md` | Environment setup help |

## Support

**Azure Monitor Documentation:**
https://docs.microsoft.com/en-us/azure/azure-monitor/

**Application Insights JavaScript SDK:**
https://docs.microsoft.com/en-us/azure/azure-monitor/app/javascript

**Need help?** Check the troubleshooting sections in the guides above.

---

**Ready to start?** Run `SETUP_MONITORING.ps1` and follow the output! 🚀

