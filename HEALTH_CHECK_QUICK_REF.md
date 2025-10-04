# Health Check System - Quick Reference

## API Endpoint

**GET** `/api/health`

```bash
# Test locally
curl http://localhost:7071/api/health

# Test production
curl https://your-app.azurestaticapps.net/api/health
```

## Response Format

```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2024-10-04T20:00:00.000Z",
  "service": "DreamSpace API",
  "version": "1.0.0",
  "checks": {
    "api": {
      "status": "healthy",
      "responseTime": 45
    },
    "cosmosdb": {
      "status": "healthy",
      "responseTime": 123,
      "endpoint": "dreamspace-cosmos"
    }
  }
}
```

## Component Usage

### Simple Badge
```jsx
import HealthBadge from './components/HealthBadge';

<HealthBadge />
```

### Detailed Badge
```jsx
<HealthBadge showDetails={true} />
```

### Custom Polling
```jsx
<HealthBadge 
  pollInterval={30000}  // 30 seconds
  showDetails={true}
/>
```

## Status Colors

| Status | Color | Icon | HTTP | Meaning |
|--------|-------|------|------|---------|
| **healthy** | 🟢 Green | ✓ | 200 | All operational |
| **degraded** | 🟡 Yellow | ⚠ | 200 | Some unavailable |
| **unhealthy** | 🔴 Red | ✗ | 503 | Critical failure |
| **unknown** | ⚪ Gray | ? | - | Cannot check |

## Where It's Displayed

1. **Sidebar** (desktop) - Detailed badge with expand
2. **Mobile Header** - Simple badge
3. **`/health` Route** - Full dashboard

## Configuration

### Backend
```env
COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_KEY=your-primary-key
```

### Frontend Polling
Default: 60 seconds (60000ms)
- Set to `0` to disable auto-polling
- Min recommended: 30 seconds
- Max recommended: 5 minutes

## Testing

```bash
# Backend
curl http://localhost:7071/api/health

# Expected: 200 OK with JSON response
```

```javascript
// Frontend
// Navigate to: http://localhost:5173/health
```

## Monitoring

### Alert Setup
```
Condition: Health check returns 503
Frequency: Every 5 minutes
Action: Email notification
```

### CI/CD Integration
```bash
# After deployment
curl -f https://your-app.azurestaticapps.net/api/health || exit 1
```

---

**Full Docs**: `HEALTH_CHECK_IMPLEMENTATION.md`

