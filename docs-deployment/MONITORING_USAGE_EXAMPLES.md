# Application Insights - Usage Examples

How to track custom events and errors in your DreamSpace app.

## Tracking Custom Events

Track important user actions to understand how your app is used.

### Basic Event Tracking

```javascript
import { trackEvent } from '../config/appInsights';

// Track when user creates a dream
function handleCreateDream(dream) {
  trackEvent('DreamCreated', { 
    category: dream.category,
    hasImage: !!dream.imageUrl
  });
  
  // ... rest of your code
}

// Track feature usage
function handleExportData() {
  trackEvent('DataExported', {
    format: 'json',
    itemCount: data.length
  });
}
```

### Track User Engagement

```javascript
import { trackEvent } from '../config/appInsights';

// Track when user completes a goal
function handleGoalComplete(goal) {
  trackEvent('GoalCompleted', {
    goalType: goal.type,
    weekNumber: goal.weekNumber,
    daysToComplete: calculateDays(goal)
  });
}

// Track when user connects with someone
function handleConnect(connect) {
  trackEvent('ConnectCreated', {
    type: connect.type,
    hasMessage: !!connect.message
  });
}
```

## Error Tracking

Automatically track errors with context.

### Track API Errors

```javascript
import { trackError } from '../config/appInsights';

async function saveDream(dream) {
  try {
    const response = await fetch('/api/dreams', {
      method: 'POST',
      body: JSON.stringify(dream)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save dream: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Track the error with context
    trackError(error, {
      operation: 'saveDream',
      userId: currentUser.id,
      dreamId: dream.id
    });
    
    // Still throw so UI can handle it
    throw error;
  }
}
```

### Track Validation Errors

```javascript
import { trackEvent } from '../config/appInsights';

function validateDream(dream) {
  if (!dream.title) {
    trackEvent('ValidationError', {
      field: 'title',
      errorType: 'required'
    });
    return false;
  }
  return true;
}
```

## Performance Tracking

Track custom performance metrics.

```javascript
import { trackMetric } from '../config/appInsights';

// Track data load time
async function loadUserData() {
  const startTime = performance.now();
  
  const data = await fetchUserData();
  
  const duration = performance.now() - startTime;
  trackMetric('UserDataLoadTime', duration);
  
  return data;
}

// Track search performance
function handleSearch(query) {
  const startTime = performance.now();
  
  const results = performSearch(query);
  
  const duration = performance.now() - startTime;
  trackMetric('SearchDuration', duration);
  
  trackEvent('SearchPerformed', {
    query: query,
    resultCount: results.length,
    durationMs: Math.round(duration)
  });
  
  return results;
}
```

## Tracking in Components

### Example: Track Feature Usage

```javascript
import React from 'react';
import { trackEvent } from '../config/appInsights';

function DreamBook() {
  const handleAddDream = () => {
    trackEvent('DreamBook_AddClicked');
    // ... your code
  };
  
  const handleFilterChange = (filter) => {
    trackEvent('DreamBook_FilterChanged', { filter });
    // ... your code
  };
  
  return (
    <div>
      <button onClick={handleAddDream}>Add Dream</button>
      {/* ... rest of component */}
    </div>
  );
}
```

### Example: Track Page Views

```javascript
import React, { useEffect } from 'react';
import { trackEvent } from '../config/appInsights';

function DashboardPage() {
  useEffect(() => {
    // Track when user views dashboard
    trackEvent('Dashboard_Viewed', {
      timestamp: new Date().toISOString()
    });
  }, []);
  
  return <div>{/* ... */}</div>;
}
```

## Querying Your Custom Events

In Azure Portal → Application Insights → Logs:

### View all custom events (last 24 hours)
```kusto
customEvents
| where timestamp > ago(24h)
| summarize count() by name
| order by count_ desc
```

### View dream creation stats
```kusto
customEvents
| where name == "DreamCreated"
| where timestamp > ago(7d)
| summarize count() by tostring(customDimensions.category)
| render piechart
```

### View errors by operation
```kusto
exceptions
| where timestamp > ago(24h)
| extend operation = tostring(customDimensions.operation)
| summarize count() by operation, outerMessage
| order by count_ desc
```

### View performance metrics
```kusto
customMetrics
| where timestamp > ago(1h)
| where name == "UserDataLoadTime"
| summarize avg(value), max(value), min(value)
```

## Best Practices

### ✅ DO:
- Track meaningful business events (dreams created, goals completed)
- Include relevant context in properties
- Track errors with enough detail to debug
- Track performance of critical operations

### ❌ DON'T:
- Track every single click (too much noise)
- Include sensitive data (passwords, tokens, PII)
- Track personally identifiable information without consent
- Track too frequently (can hit data limits)

## Useful Properties to Track

When tracking events, consider including:

```javascript
{
  userId: user.id,              // Who did it
  timestamp: new Date(),         // When
  feature: 'DreamBook',          // Where
  action: 'create',              // What
  category: dream.category,      // Context
  duration: 1234,                // How long (if relevant)
  success: true,                 // Outcome
  errorMessage: error?.message   // If failed
}
```

## Integration with Existing Services

### In `databaseService.js`

```javascript
import { trackEvent, trackError } from '../config/appInsights';

async function saveUserData(userId, data) {
  const startTime = performance.now();
  
  try {
    const result = await cosmosClient.upsert(userId, data);
    
    const duration = performance.now() - startTime;
    trackEvent('CosmosDB_Save', {
      userId,
      duration: Math.round(duration),
      success: true
    });
    
    return result;
  } catch (error) {
    trackError(error, {
      operation: 'CosmosDB_Save',
      userId
    });
    throw error;
  }
}
```

---

**Need more examples?** Check the official [Application Insights documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/app/javascript).

