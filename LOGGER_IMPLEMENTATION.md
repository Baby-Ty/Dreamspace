# Logger Utility Implementation ✅

## Overview
Lightweight, production-ready logging utility with Azure Application Insights support.

## ✅ What Was Created

### 1. Core Logger (`src/utils/logger.js`)
- **Line count**: ~390 lines (well under 400)
- **Dependencies**: Zero! (App Insights optional)
- **Features**:
  - 5 log levels: DEBUG, INFO, WARN, ERROR, CRITICAL
  - Timestamp & module tagging
  - Colored console output with emojis
  - Structured data logging
  - Performance timers
  - Event tracking
  - Page view tracking
  - Metric tracking
  - Module-scoped loggers
  - Application Insights integration (optional)

### 2. Documentation (`src/utils/LOGGER_USAGE.md`)
- Comprehensive usage guide
- Real-world examples
- Best practices
- Migration guide from console.log
- App Insights setup instructions

## 🎯 Key Features

### Log Levels
```javascript
logger.debug('module', 'Debug message', { data });    // 🔍 Dev only
logger.info('module', 'Info message', { data });      // ℹ️  General info
logger.warn('module', 'Warning message', { data });   // ⚠️  Potential issue
logger.error('module', 'Error message', { data });    // ❌ Error
logger.critical('module', 'Critical', { data });      // 🔥 Severe error
```

### Module-Scoped Logger
```javascript
import { createLogger } from './utils/logger.js';

const log = createLogger('auth');
log.info('User logged in', { userId: '123' });
// Output: ℹ️  [2024-10-04T19:47:00.123Z] [auth] User logged in { userId: '123' }
```

### Performance Monitoring
```javascript
const stopTimer = logger.startTimer('load_dashboard');
await loadData();
const duration = stopTimer();
// Output: ℹ️  [timestamp] [perf] Completed: load_dashboard { duration: '123.45ms' }
```

### Event Tracking
```javascript
logger.event('button_clicked', {
  action: 'save',
  page: '/dashboard'
});
```

### Page View Tracking
```javascript
logger.pageView('Dashboard', '/dashboard', {
  referrer: document.referrer
});
```

## 🚀 Application Insights Integration

### Auto-Sends to Azure
When `appInsights` is initialized, logger automatically sends:

| Logger Method | App Insights Type | Severity |
|---------------|-------------------|----------|
| `debug()` | Trace | Verbose |
| `info()` | Trace | Information |
| `warn()` | Trace | Warning |
| `error()` | Exception | Error |
| `critical()` | Exception | Critical |
| `event()` | Event | - |
| `pageView()` | Page View | - |
| `metric()` | Metric | - |

### Setup (Optional)
```bash
npm install @microsoft/applicationinsights-web
```

```javascript
// src/main.jsx
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { initializeAppInsights } from './utils/logger.js';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING
  }
});
appInsights.loadAppInsights();
initializeAppInsights(appInsights);
```

## 📊 Console Output Format

### Development Mode
```
🔍 [2024-10-04T19:47:00.123Z] [auth] Debug message { userId: '123' }
ℹ️  [2024-10-04T19:47:00.456Z] [api] Info message { count: 10 }
⚠️  [2024-10-04T19:47:00.789Z] [storage] Warning message { quota: '80%' }
❌ [2024-10-04T19:47:01.012Z] [network] Error message { error: 'timeout' }
🔥 [2024-10-04T19:47:01.345Z] [system] Critical message { attempts: 3 }
```

### Color Coding
- 🔍 **DEBUG**: Gray
- ℹ️ **INFO**: Blue
- ⚠️ **WARN**: Amber
- ❌ **ERROR**: Red
- 🔥 **CRITICAL**: Dark Red

## 💡 Usage Examples

### Replace console.log
```javascript
// Before
console.log('User logged in:', userId);
console.error('Error:', error);

// After
import { createLogger } from './utils/logger.js';
const log = createLogger('auth');

log.info('User logged in', { userId });
log.error('Login error', error);
```

### Error Boundaries
```javascript
import { logger } from './utils/logger.js';

class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    logger.critical('react-error-boundary', 'React component error', {
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  }
}
```

### API Calls
```javascript
import { createLogger } from './utils/logger.js';
const log = createLogger('api');

async function fetchData(endpoint) {
  log.debug('API request started', { endpoint });
  
  try {
    const response = await fetch(endpoint);
    log.info('API request successful', { endpoint });
    return response;
  } catch (error) {
    log.error('API request failed', { endpoint, error: error.message });
    throw error;
  }
}
```

## 🔒 Best Practices

### 1. Use Module Names Consistently
```javascript
const log = createLogger('auth');
```

### 2. Include Relevant Context
```javascript
log.error('Failed to save', {
  userId: user.id,
  dataType: 'profile',
  error: error.message
});
```

### 3. Don't Log Sensitive Data
```javascript
// Bad
log.info('Login attempt', { email, password });

// Good
log.info('Login attempt', { email });
```

### 4. Use Appropriate Levels
- **DEBUG**: Verbose development info
- **INFO**: Normal operations
- **WARN**: Potential issues
- **ERROR**: Needs attention
- **CRITICAL**: Severe failures

## 🎯 Integration Points

### Services
```javascript
// src/services/peopleService.js
import { createLogger } from '../utils/logger.js';
const log = createLogger('people-service');

export async function getAllUsers() {
  log.info('Fetching all users');
  // ...
}
```

### Hooks
```javascript
// src/hooks/usePeopleData.js
import { createLogger } from '../utils/logger.js';
const log = createLogger('people-data');

export function usePeopleData() {
  log.debug('Hook initialized');
  // ...
}
```

### Context
```javascript
// src/context/AuthContext.jsx
import { createLogger } from '../utils/logger.js';
const log = createLogger('auth-context');

export function AuthProvider({ children }) {
  log.info('AuthContext initialized');
  // ...
}
```

### Error Handler
```javascript
// src/utils/handleServiceError.js
import { logger } from './logger.js';

export function useErrorHandler() {
  return (error) => {
    logger.error('service-error', error.message, {
      code: error.code,
      details: error.details
    });
    // ...
  };
}
```

## ✅ Configuration

### Set Log Level
```javascript
import { setLogLevel, LogLevel } from './utils/logger.js';

// Production: only WARN and above
if (import.meta.env.PROD) {
  setLogLevel(LogLevel.WARN);
}

// Development: show everything
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

## 📦 Files Created

```
src/utils/
├── logger.js                # Core logger utility (~390 lines)
└── LOGGER_USAGE.md         # Comprehensive documentation
```

## 🧪 Testing

### Suppress Logs in Tests
```javascript
import { setLogLevel, LogLevel } from '../utils/logger.js';

beforeAll(() => {
  setLogLevel(LogLevel.ERROR); // Only errors in tests
});
```

### Spy on Logs
```javascript
import { vi } from 'vitest';

it('should log errors', () => {
  const logSpy = vi.spyOn(console, 'log');
  // ... test code
  expect(logSpy).toHaveBeenCalled();
});
```

## 🎯 Future Enhancements

### Already Prepared For:
- ✅ Azure Application Insights
- ✅ Custom log levels
- ✅ Structured logging
- ✅ Performance monitoring
- ✅ Event tracking
- ✅ Error reporting (Sentry-ready)

### Easy to Add:
- Remote logging endpoints
- Log buffering/batching
- Custom formatters
- Log filtering
- Log rotation
- Winston/Bunyan adapters

## 🏆 Benefits

### Developer Experience
- **Consistent**: Same API everywhere
- **Informative**: Timestamps, modules, structured data
- **Visual**: Colors & emojis in console
- **Fast**: Zero-dependency, lightweight

### Production Ready
- **Monitoring**: Auto-sends to App Insights
- **Debugging**: Structured data makes debugging easier
- **Performance**: Built-in timers track slow operations
- **Analytics**: Event & metric tracking built-in

### Maintainable
- **Centralized**: One place to change logging behavior
- **Extensible**: Easy to add new features
- **Testable**: Easy to mock in tests
- **Documented**: Comprehensive usage guide

## 📝 Next Steps

### 1. Start Using
```javascript
import { createLogger } from './utils/logger.js';
const log = createLogger('my-module');
log.info('Hello world!');
```

### 2. Replace console.log
Search for `console.log` and replace with `log.info()`

### 3. Add to Error Handler
```javascript
// src/utils/handleServiceError.js
import { logger } from './logger.js';

export function useErrorHandler() {
  return (error) => {
    logger.error('service-error', error.message, {
      code: error.code
    });
    // ... existing logic
  };
}
```

### 4. (Optional) Setup App Insights
```bash
npm install @microsoft/applicationinsights-web
```

Add connection string to `.env.production`

Initialize in `main.jsx`

---

**Status**: ✅ Complete, tested, and production-ready!
**Build**: ✅ Passing
**Dependencies**: 0 (App Insights optional)
**Lines**: ~390
**Documentation**: Comprehensive

