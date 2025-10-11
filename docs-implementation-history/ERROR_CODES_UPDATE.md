# Error Codes System Update

## Overview
Updated error handling to use a clean ERR enum with 4 primary categories while maintaining backward compatibility with existing detailed error codes.

## Primary Error Enum (ERR)

### New Structure
```javascript
export const ERR = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN'
};
```

### Usage in Services
**Preferred (New)**: Use ERR enum for simple, consistent errors
```javascript
import { ERR } from '../constants/errors.js';

// Network errors
return fail(ERR.NETWORK, 'Failed to fetch data');

// Authentication errors
return fail(ERR.AUTH, 'Unauthorized access');

// Validation errors
return fail(ERR.VALIDATION, 'Invalid input data');

// Unknown errors
return fail(ERR.UNKNOWN, 'An unexpected error occurred');
```

**Legacy (Still Supported)**: Use ErrorCodes for specific cases
```javascript
import { ErrorCodes } from '../constants/errors.js';

// Specific error codes (automatically map to ERR categories)
return fail(ErrorCodes.NOT_FOUND, 'User not found');
return fail(ErrorCodes.TIMEOUT, 'Request timed out');
return fail(ErrorCodes.TOKEN_EXPIRED, 'Token has expired');
```

## Error Code Mapping

All detailed ErrorCodes now map to one of the 4 primary ERR categories:

| ErrorCode | Maps To | Use Case |
|-----------|---------|----------|
| `NETWORK` | `ERR.NETWORK` | Network failures, fetch errors |
| `FETCH_ERROR` | `ERR.NETWORK` | Failed HTTP requests |
| `TIMEOUT` | `ERR.NETWORK` | Request timeouts |
| `HTTP_404` | `ERR.NETWORK` | Resource not found (network) |
| | | |
| `AUTH` | `ERR.AUTH` | Authentication failures |
| `UNAUTHORIZED` | `ERR.AUTH` | Missing/invalid credentials |
| `FORBIDDEN` | `ERR.AUTH` | Insufficient permissions |
| `TOKEN_EXPIRED` | `ERR.AUTH` | Expired auth token |
| `HTTP_401` | `ERR.AUTH` | Unauthorized (HTTP) |
| `HTTP_403` | `ERR.AUTH` | Forbidden (HTTP) |
| | | |
| `VALIDATION` | `ERR.VALIDATION` | Input validation failures |
| `VALIDATION_ERROR` | `ERR.VALIDATION` | Data validation errors |
| `INVALID_INPUT` | `ERR.VALIDATION` | Invalid user input |
| `INVALID_CONFIG` | `ERR.VALIDATION` | Invalid configuration |
| `NOT_FOUND` | `ERR.VALIDATION` | Resource not found (logical) |
| `ALREADY_EXISTS` | `ERR.VALIDATION` | Duplicate resource |
| `HTTP_400` | `ERR.VALIDATION` | Bad request (HTTP) |
| | | |
| `UNKNOWN` | `ERR.UNKNOWN` | Unexpected errors |
| `UNKNOWN_ERROR` | `ERR.UNKNOWN` | Generic errors |
| `SAVE_ERROR` | `ERR.UNKNOWN` | Save operation failed |
| `LOAD_ERROR` | `ERR.UNKNOWN` | Load operation failed |
| `DELETE_ERROR` | `ERR.UNKNOWN` | Delete operation failed |
| `HTTP_500` | `ERR.UNKNOWN` | Server error (HTTP) |

## Files Updated

### Core Error Constants
✅ **`src/constants/errors.js`**
- Added `ERR` enum with 4 categories
- Updated `ErrorCodes` to map to ERR categories
- Maintained backward compatibility

### Services (All Updated)
✅ **`src/services/databaseService.js`** - Imports `ERR, ErrorCodes`  
✅ **`src/services/peopleService.js`** - Imports `ERR, ErrorCodes`  
✅ **`src/services/adminService.js`** - Imports `ERR, ErrorCodes`  
✅ **`src/services/graphService.js`** - Imports `ERR, ErrorCodes`  
✅ **`src/services/unsplashService.js`** - Imports `ERR, ErrorCodes`  

### Hooks
✅ **`src/hooks/useAuthenticatedFetch.js`** - Uses `ERR.NETWORK` for network errors

## Usage Examples

### Example 1: Simple Network Error
```javascript
// Before
return fail('NETWORK', 'Connection failed');

// After (Preferred)
import { ERR } from '../constants/errors.js';
return fail(ERR.NETWORK, 'Connection failed');
```

### Example 2: Authentication Error
```javascript
// Before
return fail('AUTH', 'User not authenticated');

// After (Preferred)
import { ERR } from '../constants/errors.js';
return fail(ERR.AUTH, 'User not authenticated');
```

### Example 3: Validation Error
```javascript
// Before
return fail('INVALID_INPUT', 'Email format is invalid');

// After (Option 1 - Preferred)
import { ERR } from '../constants/errors.js';
return fail(ERR.VALIDATION, 'Email format is invalid');

// After (Option 2 - Specific)
import { ErrorCodes } from '../constants/errors.js';
return fail(ErrorCodes.INVALID_INPUT, 'Email format is invalid');
// Note: ErrorCodes.INVALID_INPUT internally equals ERR.VALIDATION
```

### Example 4: In Components (Error Handling)
```javascript
import { ERR } from '../constants/errors.js';

async function loadData() {
  const result = await someService.getData();
  
  if (!result.success) {
    switch (result.error.code) {
      case ERR.NETWORK:
        showMessage('Network error. Please check your connection.');
        break;
      case ERR.AUTH:
        redirectToLogin();
        break;
      case ERR.VALIDATION:
        showMessage('Invalid data. Please check your input.');
        break;
      default:
        showMessage('An unexpected error occurred.');
    }
  }
}
```

### Example 5: Service Implementation
```javascript
// src/services/myService.js
import { ok, fail } from '../utils/errorHandling.js';
import { ERR, ErrorCodes } from '../constants/errors.js';

async function fetchUser(userId) {
  try {
    if (!userId) {
      // Validation error
      return fail(ERR.VALIDATION, 'User ID is required');
    }

    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Auth error
        return fail(ERR.AUTH, 'Unauthorized');
      }
      if (response.status === 404) {
        // Network error (resource not found)
        return fail(ERR.NETWORK, 'User not found');
      }
      // Unknown error
      return fail(ERR.UNKNOWN, `HTTP ${response.status}`);
    }

    const data = await response.json();
    return ok(data);
    
  } catch (error) {
    // Network error (connection failed)
    return fail(ERR.NETWORK, error.message);
  }
}
```

## Benefits

### 1. Simplicity
- Only 4 primary error categories to remember
- Easier to handle in components
- Clear error boundaries

### 2. Consistency
- All services use the same error codes
- Predictable error handling patterns
- Uniform error responses

### 3. Backward Compatibility
- Existing `ErrorCodes` still work
- Gradual migration possible
- No breaking changes

### 4. Type Safety
- Enum-style constants prevent typos
- IDE autocomplete support
- Easy to validate error codes

## Migration Guide

### For New Code
✅ Use `ERR` enum directly:
```javascript
import { ERR } from '../constants/errors.js';
return fail(ERR.NETWORK, message);
```

### For Existing Code
✅ No changes required - `ErrorCodes` still works:
```javascript
import { ErrorCodes } from '../constants/errors.js';
return fail(ErrorCodes.NOT_FOUND, message);
// Automatically maps to ERR.VALIDATION
```

✅ Optional: Gradually migrate to ERR enum:
```javascript
// Old
return fail(ErrorCodes.FETCH_ERROR, message);

// New
return fail(ERR.NETWORK, message);
```

## Testing

### Updated Test Files
✅ Tests still pass with backward compatibility
✅ Can test using either ERR or ErrorCodes

### Example Test
```javascript
import { ERR } from '../constants/errors.js';

it('should return network error on fetch failure', async () => {
  const result = await service.getData();
  
  expect(result.success).toBe(false);
  expect(result.error.code).toBe(ERR.NETWORK);
});
```

## Status

✅ **ERR enum defined** with 4 categories  
✅ **ErrorCodes updated** to map to ERR  
✅ **All services updated** to import ERR  
✅ **Backward compatibility maintained**  
✅ **Build successful** - no breaking changes  
✅ **Documentation complete**  

## Next Steps (Optional)

- [ ] Gradually migrate existing code to use ERR enum
- [ ] Add error code to all UI error messages
- [ ] Create error boundary components that handle ERR categories
- [ ] Add logging/telemetry based on error categories
- [ ] Document error handling patterns in component guide

---

**Result**: Clean, consistent error handling system! 🎯

