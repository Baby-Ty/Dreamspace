# 🔍 Monitoring Quick Start

Get monitoring up and running in 5 minutes.

## Step 1: Run Setup Script

```powershell
.\docs-deployment\SETUP_MONITORING.ps1 `
  -ResourceGroup "dreamspace-rg" `
  -FunctionAppName "your-function-app-name" `
  -AlertEmail "your@email.com"
```

**Replace:**
- `your-function-app-name` with your actual Azure Function App name
- `your@email.com` with your email for alerts

## Step 2: Install Frontend Package

```bash
npm install
```

## Step 3: Add Connection String

The script outputs a connection string. Add it to:

**Azure Portal:**
1. Static Web App → Configuration → Application settings
2. Add: `VITE_APPINSIGHTS_CONNECTION_STRING` = `[the connection string from script]`

**Local Development:**
Add to `.env.local`:
```
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxxx;IngestionEndpoint=...
```

## Step 4: Enable in Your App

Add to `src/App.jsx` (at the top with other imports):

```javascript
import './config/appInsights';
```

## Step 5: Deploy & Verify

```bash
npm run build
# Deploy your app
```

Then check Azure Portal → Application Insights → Live Metrics

---

## What's Monitored?

✅ **Automatic:**
- All API calls and response times
- Errors and exceptions
- Database queries (Cosmos DB)
- Page views and navigation
- AJAX requests

✅ **Alerts Setup:**
- High API failure rate
- Slow response times

## View Your Monitoring

**Azure Portal URL:**
```
https://portal.azure.com → Application Insights → [your-app-name]-insights
```

**Key Tabs:**
- **Live Metrics** - Real-time dashboard
- **Failures** - All errors
- **Performance** - Slow operations
- **Logs** - Query telemetry data

---

That's it! You're now monitoring DreamSpace. 📊

