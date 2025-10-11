# Centralized Error Handler Implementation

## Overview
Created a centralized error handling system that automatically responds to different error types with appropriate actions (logout, toast, logging, Sentry).

## Files Created

### 1. **`src/utils/handleServiceError.js`**
Main error handler with smart error type routing.

**Features**:
- ✅ **AUTH errors** → Automatic logout
- ✅ **NETWORK errors** → Toast notification
- ✅ **VALIDATION errors** → Warning toast
- ✅ **UNKNOWN errors** → Error toast + logging
- ✅ **Sentry integration** (optional)
- ✅ **React Query compatible**
- ✅ **Function wrapper** for automatic error handling

**Exports**:
- `handleServiceError()` - Main error handler
- `createErrorHandler()` - Factory for pre-configured handlers
- `handleQueryError()` - React Query compatible handler
- `withErrorHandling()` - Async function wrapper

### 2. **`src/utils/toast.js`**
Simple toast notification system with vanilla JS (no dependencies).

**Features**:
- ✅ 4 toast types (success, error, warning, info)
- ✅ Auto-dismiss with customizable duration
- ✅ Click to dismiss
- ✅ Smooth animations
- ✅ Stacked notifications
- ✅ Zero dependencies

**Can be replaced with**:
- `react-hot-toast`
- `react-toastify`
- `sonner`

### 3. **`src/utils/USAGE_EXAMPLES.md`**
Comprehensive usage guide with real-world examples.

## Quick Start

### Basic Usage
```javascript
import { handleServiceError } from '../utils/handleServiceError.js';
import { showToast } from '../utils/toast.js';
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { logout } = useAuth();

  async function loadData() {
    const result = await someService.getData();
    
    if (!result.success) {
      handleServiceError(result.error, {
        onLogout: logout,
        showToast: showToast
      });
      return;
    }
    
    // Use result.data
  }
}
```

### Global Setup (Recommended)
```javascript
// src/hooks/useErrorHandler.js
import { useCallback } from 'react';
import { handleServiceError } from '../utils/handleServiceError.js';
import { showToast } from '../utils/toast.js';
import { useAuth } from '../context/AuthContext';

export function useErrorHandler() {
  const { logout } = useAuth();

  const handleError = useCallback((error, options = {}) => {
    return handleServiceError(error, {
      onLogout: logout,
      showToast: showToast,
      useSentry: import.meta.env.PROD,
      ...options
    });
  }, [logout]);

  return handleError;
}

// Usage in any component
function MyComponent() {
  const handleError = useErrorHandler();

  async function loadData() {
    const result = await service.getData();
    if (!result.success) {
      handleError(result.error);
    }
  }
}
```

## Error Flow

### AUTH Error Flow
```
Service returns AUTH error
       ↓
handleServiceError detects ERR.AUTH
       ↓
Shows "Session expired" toast
       ↓
Waits 500ms (for toast visibility)
       ↓
Calls onLogout()
       ↓
User redirected to login
       ↓
Optional: Logs to Sentry
```

### NETWORK Error Flow
```
Service returns NETWORK error
       ↓
handleServiceError detects ERR.NETWORK
       ↓
Shows "Network error" toast
       ↓
Logs to console with context
       ↓
Optional: Logs to Sentry
```

### VALIDATION Error Flow
```
Service returns VALIDATION error
       ↓
handleServiceError detects ERR.VALIDATION
       ↓
Shows custom error message in toast
       ↓
Logs warning to console
       ↓
Does NOT log to Sentry (too noisy)
```

### UNKNOWN Error Flow
```
Service returns UNKNOWN error
       ↓
handleServiceError detects ERR.UNKNOWN
       ↓
Shows "Something went wrong" toast
       ↓
Logs error to console
       ↓
Optional: Logs to Sentry
```

## Integration Points

### 1. Custom Hooks
Create a `useApi` hook that wraps all service calls:

```javascript
// src/hooks/useApi.js
import { useErrorHandler } from './useErrorHandler.js';

export function useApi() {
  const handleError = useErrorHandler();

  const call = async (serviceMethod, ...args) => {
    const result = await serviceMethod(...args);
    
    if (!result.success) {
      handleError(result.error);
      return { success: false, data: null };
    }
    
    return result;
  };

  return { call };
}

// Usage
function MyComponent() {
  const { call } = useApi();
  
  const loadUsers = async () => {
    const result = await call(peopleService.getAllUsers);
    if (result.success) {
      setUsers(result.data);
    }
  };
}
```

### 2. React Query
Add to global query configuration:

```javascript
// In App.jsx
import { QueryClient, QueryClientProvider } from 'react-query';
import { handleQueryError } from './utils/handleServiceError.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        handleQueryError(error, {
          onLogout: logout,
          showToast: showToast
        });
      }
    }
  }
});
```

### 3. Axios Interceptors (if using Axios)
```javascript
import axios from 'axios';
import { handleServiceError } from './utils/handleServiceError.js';

axios.interceptors.response.use(
  response => response,
  error => {
    handleServiceError({
      code: error.response?.status === 401 ? ERR.AUTH : ERR.NETWORK,
      message: error.message,
      data: error.response?.data
    }, {
      onLogout: logout,
      showToast: showToast
    });
    return Promise.reject(error);
  }
);
```

### 4. Global Error Boundary
```javascript
// src/components/ErrorBoundary.jsx
import { Component } from 'react';
import { ERR } from '../constants/errors.js';
import { handleServiceError } from '../utils/handleServiceError.js';

class ErrorBoundary extends Component {
  componentDidCatch(error, info) {
    handleServiceError({
      code: ERR.UNKNOWN,
      message: error.message,
      data: { componentStack: info.componentStack }
    }, {
      showToast: this.props.showToast,
      useSentry: true
    });
  }

  render() {
    return this.props.children;
  }
}
```

## Toast Customization

### Replace with React Hot Toast
```bash
npm install react-hot-toast
```

```javascript
import toast from 'react-hot-toast';

// Replace showToast implementation
const showToast = (message, type) => {
  switch(type) {
    case 'success': return toast.success(message);
    case 'error': return toast.error(message);
    case 'warning': return toast(message, { icon: '⚠️' });
    case 'info': return toast(message);
  }
};
```

### Replace with React Toastify
```bash
npm install react-toastify
```

```javascript
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const showToast = (message, type) => {
  toast[type](message);
};
```

## Sentry Integration

### Install Sentry
```bash
npm install @sentry/react
```

### Configure in main.jsx
```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Enable in Error Handler
```javascript
const handleError = createErrorHandler({
  onLogout: logout,
  showToast: showToast,
  useSentry: true // Sentry will now capture errors
});
```

## Error Context

Add context to errors for better debugging:

```javascript
handleServiceError(result.error, {
  onLogout: logout,
  showToast: showToast,
  context: {
    userId: currentUser.id,
    page: 'dashboard',
    action: 'load_data',
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  }
});
```

This context will appear in:
- Console logs
- Sentry error reports
- Any custom logging you add

## Silent Mode

Suppress toast notifications:

```javascript
// Handle error silently (logs only, no toasts)
handleServiceError(result.error, {
  onLogout: logout,
  silent: true
});
```

Useful for:
- Background polling
- Non-critical operations
- When you handle the error UI yourself

## Benefits

### 1. **Consistency**
- All errors handled the same way
- Predictable user experience
- Single source of truth for error handling

### 2. **DRY (Don't Repeat Yourself)**
- Write error handling once
- Reuse across all components
- Easy to update globally

### 3. **User Experience**
- Automatic logout on auth errors
- Clear error messages
- Non-intrusive toast notifications

### 4. **Developer Experience**
- Simple API
- Rich console logging
- Easy debugging

### 5. **Monitoring**
- Optional Sentry integration
- Contextual error data
- Production-ready error tracking

## Testing

### Unit Test Example
```javascript
import { handleServiceError } from './handleServiceError.js';
import { ERR } from '../constants/errors.js';
import { vi } from 'vitest';

describe('handleServiceError', () => {
  it('should call logout on AUTH error', () => {
    const mockLogout = vi.fn();
    const mockToast = vi.fn();
    
    handleServiceError(
      { code: ERR.AUTH, message: 'Unauthorized' },
      { onLogout: mockLogout, showToast: mockToast }
    );

    expect(mockToast).toHaveBeenCalledWith(
      'Session expired. Please log in again.',
      'warning'
    );
    
    // Wait for timeout
    setTimeout(() => {
      expect(mockLogout).toHaveBeenCalled();
    }, 600);
  });

  it('should show toast on NETWORK error', () => {
    const mockToast = vi.fn();
    
    handleServiceError(
      { code: ERR.NETWORK, message: 'Connection failed' },
      { showToast: mockToast }
    );

    expect(mockToast).toHaveBeenCalledWith(
      'Network error. Please check your connection and try again.',
      'error'
    );
  });
});
```

## Migration Path

### Phase 1: Install
✅ Create error handler files  
✅ Create toast utility

### Phase 2: Hook Setup
- [ ] Create `useErrorHandler` hook
- [ ] Create `useApi` hook (optional)

### Phase 3: Gradual Adoption
- [ ] Use in new components
- [ ] Refactor critical paths (auth, data loading)
- [ ] Add to existing components over time

### Phase 4: Global Integration
- [ ] Add to React Query config
- [ ] Add to error boundaries
- [ ] Enable Sentry monitoring

## Status

✅ **handleServiceError** created with smart routing  
✅ **Toast system** implemented (vanilla JS)  
✅ **React Query integration** ready  
✅ **Sentry support** built-in  
✅ **Function wrapper** for async error handling  
✅ **Comprehensive documentation** with examples  
✅ **Build successful** - production ready  

## Next Steps

1. **Create useErrorHandler hook** - Global hook for easy access
2. **Add to critical paths** - Auth, data loading
3. **Replace toast library** (optional) - Use react-hot-toast or react-toastify
4. **Enable Sentry** (optional) - Production error monitoring
5. **Add to React Query** (optional) - Automatic query error handling

---

**Result**: Production-ready centralized error handling! 🎯✨

