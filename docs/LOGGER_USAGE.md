# Logger Utility Usage Guide

## Quick Start

### Basic Usage
```javascript
import { logger } from '../utils/logger.js';

// Debug (verbose, dev only)
logger.debug('auth', 'Token validated', { userId: '123' });

// Info (general information)
logger.info('api', 'Data loaded successfully', { count: 10 });

// Warning (potential issues)
logger.warn('storage', 'localStorage quota at 80%', { used: '8MB' });

// Error (needs attention)
logger.error('network', 'Failed to fetch data', { url: '/api/users' });

// Critical (severe errors)
logger.critical('system', 'Database connection lost', { attempts: 3 });
```

### Module-Scoped Logger
```javascript
import { createLogger } from '../utils/logger.js';

// Create logger for your module
const log = createLogger('auth');

// Use without repeating module name
log.info('User logged in', { userId: '123' });
log.error('Login failed', { reason: 'invalid_credentials' });
log.warn('Token expiring soon', { expiresIn: '5min' });
```

## Log Levels

| Level | When to Use | Console | App Insights | Production |
|-------|-------------|---------|--------------|------------|
| `DEBUG` | Verbose development info | ✅ Dev only | ❌ | ❌ |
| `INFO` | General information | ✅ | ✅ | ✅ |
| `WARN` | Potential issues | ✅ | ✅ | ✅ |
| `ERROR` | Errors needing attention | ✅ | ✅ Exception | ✅ |
| `CRITICAL` | Severe system failures | ✅ | ✅ Exception | ✅ |

## Examples by Use Case

### 1. Authentication Flow
```javascript
import { createLogger } from '../utils/logger.js';

const log = createLogger('auth');

async function login(email, password) {
  log.info('Login attempt started', { email });

  try {
    const user = await authService.login(email, password);
    log.info('Login successful', { 
      userId: user.id, 
      email: user.email 
    });
    return user;
  } catch (error) {
    log.error('Login failed', {
      email,
      error: error.message
    });
    throw error;
  }
}
```

### 2. API Calls
```javascript
import { createLogger } from '../utils/logger.js';

const log = createLogger('api');

async function fetchData(endpoint) {
  log.debug('API request started', { endpoint });

  try {
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      log.warn('API request failed', {
        endpoint,
        status: response.status,
        statusText: response.statusText
      });
      return null;
    }

    const data = await response.json();
    log.info('API request successful', {
      endpoint,
      dataSize: JSON.stringify(data).length
    });
    
    return data;
  } catch (error) {
    log.error('API request error', {
      endpoint,
      error: error.message
    });
    throw error;
  }
}
```

### 3. Performance Monitoring
```javascript
import { logger } from '../utils/logger.js';

async function loadDashboard() {
  // Start timer
  const stopTimer = logger.startTimer('load_dashboard');

  try {
    await loadUserData();
    await loadMetrics();
    await loadCharts();
    
    // Stop timer and log duration
    const duration = stopTimer();
    // Logs: "ℹ️ [timestamp] [perf] Completed: load_dashboard { duration: '123.45ms' }"
    
    return duration;
  } catch (error) {
    stopTimer();
    throw error;
  }
}
```

### 4. Event Tracking
```javascript
import { logger } from '../utils/logger.js';

// Track user actions
function handleButtonClick(action) {
  logger.event('button_clicked', {
    action,
    page: window.location.pathname,
    timestamp: Date.now()
  });
}

// Track feature usage
function trackFeatureUsage(feature) {
  logger.event('feature_used', {
    feature,
    userId: currentUser.id
  });
}
```

### 5. Page View Tracking
```javascript
import { logger } from '../utils/logger.js';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    logger.pageView(
      document.title,
      location.pathname,
      {
        referrer: document.referrer,
        userAgent: navigator.userAgent
      }
    );
  }, [location]);
}
```

### 6. Error Boundaries
```javascript
import { logger } from '../utils/logger.js';
import { Component } from 'react';

class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    logger.critical('react-error-boundary', 'React component error', {
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    return this.props.children;
  }
}
```

## Application Insights Integration

### Setup (Optional)
```bash
npm install @microsoft/applicationinsights-web
```

### Initialize in App
```javascript
// src/main.jsx or App.jsx
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { initializeAppInsights, logger } from './utils/logger.js';

// Initialize Application Insights
const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true,
    disableFetchTracking: false,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true
  }
});

appInsights.loadAppInsights();

// Connect to logger
initializeAppInsights(appInsights);

logger.info('app', 'Application started', {
  version: import.meta.env.VITE_APP_VERSION,
  environment: import.meta.env.MODE
});
```

### What Gets Sent to App Insights

| Logger Method | App Insights Type | Severity Level |
|---------------|-------------------|----------------|
| `debug()` | Trace | 0 (Verbose) |
| `info()` | Trace | 1 (Information) |
| `warn()` | Trace | 2 (Warning) |
| `error()` | Exception | 3 (Error) |
| `critical()` | Exception | 4 (Critical) |
| `event()` | Event | - |
| `pageView()` | Page View | - |
| `metric()` | Metric | - |

## Configuration

### Set Log Level
```javascript
import { setLogLevel, LogLevel } from './utils/logger.js';

// Only show warnings and errors in production
if (import.meta.env.PROD) {
  setLogLevel(LogLevel.WARN);
}

// Show everything in development
if (import.meta.env.DEV) {
  setLogLevel(LogLevel.DEBUG);
}
```

### Environment Variables
```env
# .env.production
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://...
VITE_APP_VERSION=1.0.0
```

## Best Practices

### 1. Use Module Names Consistently
```javascript
// Good
const log = createLogger('auth');
log.info('User logged in');

// Avoid
logger.info('authentication', 'User logged in');
logger.info('auth-service', 'User logged in');
```

### 2. Include Relevant Context
```javascript
// Good - includes useful context
log.error('Failed to save data', {
  userId: user.id,
  dataType: 'profile',
  timestamp: Date.now(),
  error: error.message
});

// Less useful
log.error('Failed to save data');
```

### 3. Don't Log Sensitive Data
```javascript
// Bad - logs password
log.info('Login attempt', { email, password });

// Good - logs only safe data
log.info('Login attempt', { email });
```

### 4. Use Appropriate Log Levels
```javascript
// Debug - verbose development info
log.debug('Cache hit', { key: 'user-123' });

// Info - normal operations
log.info('Data loaded', { count: 10 });

// Warn - potential issues
log.warn('Slow query detected', { duration: '5s' });

// Error - needs attention
log.error('Failed to load data', { error });

// Critical - severe failures
log.critical('Database connection lost');
```

### 5. Performance Monitoring
```javascript
// Measure operations
async function expensiveOperation() {
  const stopTimer = logger.startTimer('expensive_operation');
  
  try {
    // ... do work
    return result;
  } finally {
    stopTimer(); // Always stop, even on error
  }
}
```

## Console Output Format

```
🔍 [2024-10-04T19:47:00.123Z] [auth] Debug message { data: 'value' }
ℹ️  [2024-10-04T19:47:00.456Z] [api] Info message { count: 10 }
⚠️  [2024-10-04T19:47:00.789Z] [storage] Warning message { quota: '80%' }
❌ [2024-10-04T19:47:01.012Z] [network] Error message { error: 'timeout' }
🔥 [2024-10-04T19:47:01.345Z] [system] Critical message { attempts: 3 }
```

## Migration from console.log

### Before
```javascript
console.log('User logged in:', userId);
console.error('Error:', error);
console.warn('Cache miss');
```

### After
```javascript
import { createLogger } from '../utils/logger.js';
const log = createLogger('auth');

log.info('User logged in', { userId });
log.error('Login error', error);
log.warn('Cache miss');
```

## Testing

### Suppress Logs in Tests
```javascript
// In test setup
import { setLogLevel, LogLevel } from '../utils/logger.js';

beforeAll(() => {
  // Only show errors in tests
  setLogLevel(LogLevel.ERROR);
});
```

### Test Logging Behavior
```javascript
import { logger } from './logger.js';
import { vi } from 'vitest';

describe('MyComponent', () => {
  it('should log errors', () => {
    const errorSpy = vi.spyOn(console, 'log');
    
    // Trigger error
    component.doSomething();
    
    expect(errorSpy).toHaveBeenCalled();
  });
});
```

---

**Result**: Production-ready logging with Azure App Insights support! 📊

