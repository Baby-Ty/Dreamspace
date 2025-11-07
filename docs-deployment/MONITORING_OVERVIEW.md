# Azure Monitoring Overview for DreamSpace

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DreamSpace Application                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   React Frontend │         │  Azure Functions │          │
│  │                  │         │       (API)      │          │
│  │  - Page views    │         │  - API requests  │          │
│  │  - User actions  │────────▶│  - Response time │          │
│  │  - JS errors     │         │  - Exceptions    │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                             │                    │
│           │                             │                    │
│           └──────────┬──────────────────┘                    │
│                      │                                       │
│                      ▼                                       │
│         ┌─────────────────────────┐                          │
│         │  Application Insights   │                          │
│         │                         │                          │
│         │  - Collects telemetry   │                          │
│         │  - Stores metrics       │                          │
│         │  - Triggers alerts      │                          │
│         └─────────────────────────┘                          │
│                      │                                       │
│                      ▼                                       │
│         ┌─────────────────────────┐                          │
│         │   Azure Portal Views    │                          │
│         │                         │                          │
│         │  - Live Metrics         │                          │
│         │  - Failures             │                          │
│         │  - Performance          │                          │
│         │  - Logs (Kusto)         │                          │
│         └─────────────────────────┘                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## What Gets Monitored

### Frontend Telemetry
- ✅ Page views and navigation
- ✅ User sessions and engagement
- ✅ JavaScript errors and exceptions
- ✅ AJAX/API call performance
- ✅ Custom events (optional)

### Backend Telemetry
- ✅ HTTP requests (all API calls)
- ✅ Response times and duration
- ✅ Failed requests (4xx, 5xx errors)
- ✅ Dependency calls (Cosmos DB)
- ✅ Server exceptions

### Infrastructure Metrics
- ✅ Memory usage
- ✅ CPU usage
- ✅ Request rate
- ✅ Availability

## Data Flow

```
User Action → Frontend → API Call → Backend → Cosmos DB
    ↓            ↓          ↓          ↓          ↓
    └────────────┴──────────┴──────────┴──────────┘
                          ↓
              Application Insights
                          ↓
            ┌─────────────┴─────────────┐
            ↓                           ↓
      Live Dashboard              Stored Metrics
      (Real-time)                 (Historical)
            ↓                           ↓
      Alert Rules                 Log Queries
      (Email/SMS)                 (Analysis)
```

## Key Features

### 1. Live Metrics (Real-time)
**Access:** Azure Portal → Application Insights → Live Metrics

**Shows:**
- Incoming request rate (requests/second)
- Failed request count
- Average response time
- Server CPU/Memory
- Active instances

**Use Case:** Monitor deployments, debug live issues

---

### 2. Failures View
**Access:** Azure Portal → Application Insights → Failures

**Shows:**
- All exceptions with stack traces
- Failed HTTP requests
- Dependency failures
- Grouped by type and count

**Use Case:** Find and fix errors quickly

---

### 3. Performance View
**Access:** Azure Portal → Application Insights → Performance

**Shows:**
- Slowest operations
- Database query duration
- External API call times
- Response time percentiles (P50, P95, P99)

**Use Case:** Optimize slow operations

---

### 4. Logs (Kusto Queries)
**Access:** Azure Portal → Application Insights → Logs

**Shows:**
- Custom query results
- Deep analysis
- Cross-correlation
- Time series data

**Use Case:** Complex investigations, reports

---

### 5. Alerts
**Access:** Azure Portal → Application Insights → Alerts

**Triggers:**
- High failure rate
- Slow response times
- Custom metric thresholds

**Actions:**
- Email notifications
- SMS (optional)
- Webhooks (optional)

**Use Case:** Proactive issue detection

## Typical Workflow

### During Development
1. Code feature
2. Run locally (monitoring enabled with `.env.local`)
3. Check console for "✅ Application Insights initialized"
4. Test feature
5. Deploy to Azure

### After Deployment
1. Monitor Live Metrics during deployment
2. Verify no spike in errors
3. Check performance hasn't degraded
4. Review logs if issues arise

### When Issues Occur
1. Check Failures tab for recent errors
2. Click error to see stack trace
3. Review associated requests
4. Check Performance for slow operations
5. Query Logs for deeper analysis

## Sample Queries

### Find Recent Errors
```kusto
exceptions
| where timestamp > ago(1h)
| order by timestamp desc
| project timestamp, type, outerMessage
| take 10
```

### API Performance by Endpoint
```kusto
requests
| where timestamp > ago(24h)
| summarize 
    count=count(),
    avgDuration=avg(duration),
    p95Duration=percentile(duration, 95)
  by name
| order by avgDuration desc
```

### User Activity
```kusto
pageViews
| where timestamp > ago(7d)
| summarize count() by name
| render barchart
```

### Failed Requests by Status Code
```kusto
requests
| where timestamp > ago(24h)
| where success == false
| summarize count() by resultCode
| render piechart
```

### Cosmos DB Performance
```kusto
dependencies
| where type == "Azure DocumentDB"
| where timestamp > ago(1h)
| summarize 
    count=count(),
    avgDuration=avg(duration),
    maxDuration=max(duration)
  by name
| order by avgDuration desc
```

## Alert Strategy

### Critical Alerts (Immediate Action)
- ⚠️ API availability < 99% (5 min window)
- ⚠️ Error rate > 5% (5 min window)
- ⚠️ Response time P95 > 5 seconds

### Warning Alerts (Review Soon)
- ⚡ Response time P95 > 3 seconds (15 min window)
- ⚡ Failed requests > 10 (15 min window)
- ⚡ Memory usage > 80%

### Informational Alerts (Daily Review)
- 📊 Daily request count
- 📊 New error types
- 📊 Performance trends

## Cost Management

### Free Tier Limits
- 5 GB data ingestion/month
- 90-day data retention

### Estimated Usage
| App Size | Requests/day | Estimated Data | Monthly Cost |
|----------|--------------|----------------|--------------|
| Small    | 1,000        | 0.5-1 GB       | FREE         |
| Medium   | 10,000       | 2-3 GB         | FREE         |
| Large    | 100,000      | 5-8 GB         | $7-10        |

### Reduce Costs
- ✅ Sampling enabled (in `host.json`)
- ✅ Filter noisy telemetry
- ✅ Reduce debug logging in production
- ✅ Use shorter retention for high-volume data

## Best Practices

### DO ✅
- Monitor after every deployment
- Set up alerts for critical paths
- Review failures daily
- Track business metrics with custom events
- Use sampling for high-volume apps
- Archive old logs if not needed

### DON'T ❌
- Track sensitive data (passwords, tokens)
- Over-alert (alert fatigue)
- Ignore warning alerts
- Track every click (too noisy)
- Forget to set up alerts
- Ignore cost alerts

## Quick Reference

| Need | Go To |
|------|-------|
| Real-time monitoring | Live Metrics |
| Find errors | Failures tab |
| Slow operations | Performance tab |
| Custom analysis | Logs (Kusto) |
| Set up alerts | Alerts tab |
| Check costs | Application Insights → Usage and estimated costs |

## Integration Points

### Code Changes Made
1. `package.json` - Added `@applicationinsights/web`
2. `src/config/appInsights.js` - Configuration
3. `src/main.jsx` - Initialize on startup
4. `src/components/ErrorBoundary.jsx` - Track errors

### Azure Resources
1. Application Insights resource
2. Log Analytics workspace (automatic)
3. Alert rules (if configured)
4. Action group (for email alerts)

### Configuration
1. Function App - `APPLICATIONINSIGHTS_CONNECTION_STRING`
2. Frontend - `VITE_APPINSIGHTS_CONNECTION_STRING`

## Getting Started

**Quick Start:** See `MONITORING_CHECKLIST.md`

**Setup Script:** `docs-deployment/SETUP_MONITORING.ps1`

**Full Guide:** `docs-deployment/README_MONITORING.md`

**Code Examples:** `docs-deployment/MONITORING_USAGE_EXAMPLES.md`

---

**Ready to monitor?** Run the setup script and start gaining visibility into your application! 📊

