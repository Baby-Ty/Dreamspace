# Error Handler Usage Examples

## Setup

### 1. Basic Usage in Components
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

### 2. Global Error Handler Setup
```javascript
// In App.jsx or main app setup
import { createErrorHandler } from './utils/handleServiceError.js';
import { showToast } from './utils/toast.js';
import { useAuth } from './context/AuthContext';

function App() {
  const { logout } = useAuth();

  // Create global error handler with defaults
  const handleError = createErrorHandler({
    onLogout: logout,
    showToast: showToast,
    useSentry: import.meta.env.PROD // Enable Sentry in production
  });

  // Make it available globally
  window.handleServiceError = handleError;

  // Or provide via context
  return (
    <ErrorHandlerContext.Provider value={handleError}>
      {/* Your app */}
    </ErrorHandlerContext.Provider>
  );
}
```

### 3. With Custom Hooks
```javascript
// src/hooks/useApiCall.js
import { handleServiceError } from '../utils/handleServiceError.js';
import { showToast } from '../utils/toast.js';
import { useAuth } from '../context/AuthContext';

export function useApiCall() {
  const { logout } = useAuth();

  const callApi = async (serviceMethod, ...args) => {
    const result = await serviceMethod(...args);
    
    if (!result.success) {
      handleServiceError(result.error, {
        onLogout: logout,
        showToast: showToast
      });
      return null;
    }
    
    return result.data;
  };

  return { callApi };
}

// Usage in components
function MyComponent() {
  const { callApi } = useApiCall();
  
  async function loadUsers() {
    const users = await callApi(peopleService.getAllUsers);
    if (users) {
      setUsers(users);
    }
  }
}
```

### 4. With Async Function Wrapper
```javascript
import { withErrorHandling } from '../utils/handleServiceError.js';
import { showToast } from '../utils/toast.js';
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { logout } = useAuth();

  // Wrap your async function
  const loadData = withErrorHandling(
    async () => {
      const result = await someService.getData();
      if (result.success) {
        setData(result.data);
      }
      return result;
    },
    {
      onLogout: logout,
      showToast: showToast
    }
  );

  // Use it
  useEffect(() => {
    loadData();
  }, []);
}
```

### 5. React Query Integration
```javascript
import { QueryClient, QueryClientProvider } from 'react-query';
import { handleQueryError } from '../utils/handleServiceError.js';
import { showToast } from '../utils/toast.js';
import { useAuth } from '../context/AuthContext';

function App() {
  const { logout } = useAuth();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        onError: (error) => {
          handleQueryError(error, {
            onLogout: logout,
            showToast: showToast
          });
        }
      },
      mutations: {
        onError: (error) => {
          handleQueryError(error, {
            onLogout: logout,
            showToast: showToast
          });
        }
      }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

## Toast Notifications

### Basic Toast Usage
```javascript
import { toast } from '../utils/toast.js';

// Success
toast.success('Data saved successfully!');

// Error
toast.error('Failed to load data');

// Warning
toast.warning('Session will expire soon');

// Info
toast.info('New features available');

// Custom duration (default is 4000ms)
toast.success('Quick message', 2000);
```

### Replace with React Libraries

If you prefer using popular toast libraries:

#### React Hot Toast
```bash
npm install react-hot-toast
```

```javascript
// Replace showToast in handleServiceError
import toast from 'react-hot-toast';

const showToast = (message, type) => {
  switch(type) {
    case 'success': return toast.success(message);
    case 'error': return toast.error(message);
    case 'warning': return toast(message, { icon: '⚠️' });
    case 'info': return toast(message);
  }
};
```

#### React Toastify
```bash
npm install react-toastify
```

```javascript
import { toast } from 'react-toastify';

const showToast = (message, type) => {
  toast[type](message);
};
```

## Error Scenarios

### 1. Authentication Error (Auto Logout)
```javascript
// Service returns AUTH error
const result = await userService.getProfile();

// Error handler automatically:
// 1. Shows "Session expired" toast
// 2. Calls logout() after 500ms
// 3. Logs to Sentry if enabled

handleServiceError(result.error, {
  onLogout: logout,
  showToast: showToast
});
```

### 2. Network Error (Toast Only)
```javascript
// Service returns NETWORK error
const result = await dataService.load();

// Error handler automatically:
// 1. Shows "Network error" toast
// 2. Logs to Sentry if enabled

handleServiceError(result.error, {
  showToast: showToast
});
```

### 3. Validation Error (Custom Message)
```javascript
// Service returns VALIDATION error with custom message
const result = await formService.submit(data);

// Error handler automatically:
// 1. Shows custom error message in toast
// 2. Does NOT log to Sentry (too noisy)

handleServiceError(result.error, {
  showToast: showToast
});
```

### 4. Silent Error Handling
```javascript
// Handle error without showing toasts
handleServiceError(result.error, {
  onLogout: logout,
  silent: true // No toast notifications
});
```

### 5. With Additional Context
```javascript
// Add context for better debugging
handleServiceError(result.error, {
  onLogout: logout,
  showToast: showToast,
  context: {
    userId: currentUser.id,
    action: 'load_dashboard',
    timestamp: Date.now()
  }
});
```

## Sentry Integration

### Setup Sentry
```bash
npm install @sentry/react
```

```javascript
// In main.jsx or App.jsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});

// Now handleServiceError will automatically send errors to Sentry
// when useSentry: true is set
```

### Enable Sentry in Error Handler
```javascript
const handleError = createErrorHandler({
  onLogout: logout,
  showToast: showToast,
  useSentry: import.meta.env.PROD // Only in production
});
```

## Best Practices

### 1. Create a Global Hook
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

// Usage
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

### 2. Centralize in API Hooks
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
```

### 3. Early Return Pattern
```javascript
async function loadData() {
  const result = await service.getData();
  
  // Handle error and return early
  if (!result.success) {
    handleError(result.error);
    return;
  }
  
  // Continue with success path
  processData(result.data);
}
```

---

**Result**: Automatic, consistent error handling across your entire app! 🎯

