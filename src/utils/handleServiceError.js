// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { ERR } from '../constants/errors.js';

/**
 * Centralized service error handler
 * Automatically responds to different error types:
 * - AUTH errors → trigger logout
 * - NETWORK errors → show toast notification
 * - Other errors → log to console/Sentry
 * 
 * @param {Object} error - Error object from service response
 * @param {Object} options - Configuration options
 * @param {Function} options.onLogout - Callback to trigger logout (required for AUTH errors)
 * @param {Function} options.showToast - Callback to show toast message (required for NETWORK errors)
 * @param {boolean} options.silent - If true, suppress toast notifications (default: false)
 * @param {boolean} options.useSentry - If true, send errors to Sentry (default: false)
 * @param {Object} options.context - Additional context for error logging
 */
export function handleServiceError(error, options = {}) {
  const {
    onLogout,
    showToast,
    silent = false,
    useSentry = false,
    context = {}
  } = options;

  // Early return if no error
  if (!error) {
    console.warn('handleServiceError called with no error');
    return;
  }

  const errorCode = error.code || ERR.UNKNOWN;
  const errorMessage = error.message || 'An unexpected error occurred';
  const errorData = error.data || {};

  // Log error with context
  const logContext = {
    code: errorCode,
    message: errorMessage,
    data: errorData,
    timestamp: new Date().toISOString(),
    ...context
  };

  // Handle different error types
  switch (errorCode) {
    case ERR.AUTH:
      // Authentication error - trigger logout
      console.warn('🔒 Authentication error:', logContext);
      
      if (onLogout && typeof onLogout === 'function') {
        // Give user feedback before logout
        if (!silent && showToast) {
          showToast('Session expired. Please log in again.', 'warning');
        }
        
        // Trigger logout (with slight delay for toast to show)
        setTimeout(() => {
          onLogout();
        }, 500);
      } else {
        console.error('handleServiceError: onLogout callback not provided for AUTH error');
      }
      
      // Send to Sentry if enabled
      if (useSentry && window.Sentry) {
        window.Sentry.captureException(new Error(`Auth Error: ${errorMessage}`), {
          tags: { errorType: 'auth' },
          extra: logContext
        });
      }
      break;

    case ERR.NETWORK:
      // Network error - show toast
      console.warn('🌐 Network error:', logContext);
      
      if (!silent && showToast && typeof showToast === 'function') {
        showToast(
          'Network error. Please check your connection and try again.',
          'error'
        );
      }
      
      // Send to Sentry if enabled
      if (useSentry && window.Sentry) {
        window.Sentry.captureException(new Error(`Network Error: ${errorMessage}`), {
          tags: { errorType: 'network' },
          extra: logContext
        });
      }
      break;

    case ERR.VALIDATION:
      // Validation error - usually handled by the calling component
      console.warn('⚠️ Validation error:', logContext);
      
      // Optionally show toast for validation errors
      if (!silent && showToast && typeof showToast === 'function') {
        showToast(errorMessage, 'warning');
      }
      
      // Don't send validation errors to Sentry (too noisy)
      break;

    case ERR.UNKNOWN:
    default:
      // Unknown error - log and optionally send to Sentry
      console.error('❌ Unknown error:', logContext);
      
      if (!silent && showToast && typeof showToast === 'function') {
        showToast(
          'Something went wrong. Please try again.',
          'error'
        );
      }
      
      // Send to Sentry if enabled
      if (useSentry && window.Sentry) {
        window.Sentry.captureException(new Error(`Unknown Error: ${errorMessage}`), {
          tags: { errorType: 'unknown' },
          extra: logContext
        });
      }
      break;
  }

  // Return error for further handling if needed
  return {
    handled: true,
    code: errorCode,
    message: errorMessage
  };
}

/**
 * Create a pre-configured error handler with default options
 * Useful for setting up global error handling in app initialization
 * 
 * @param {Object} defaultOptions - Default options for all error handling
 * @returns {Function} Configured error handler
 */
export function createErrorHandler(defaultOptions = {}) {
  return (error, overrideOptions = {}) => {
    return handleServiceError(error, {
      ...defaultOptions,
      ...overrideOptions
    });
  };
}

/**
 * React Query compatible error handler
 * Use with React Query's global onError or mutation onError callbacks
 * 
 * @param {Error|Object} error - Error from React Query
 * @param {Object} options - Handler options
 */
export function handleQueryError(error, options = {}) {
  // Extract error object from React Query error format
  const serviceError = error?.response?.data || error?.error || error;
  
  return handleServiceError(serviceError, options);
}

/**
 * Wrapper for async functions that automatically handles errors
 * 
 * @param {Function} asyncFn - Async function to wrap
 * @param {Object} options - Error handler options
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(asyncFn, options = {}) {
  return async (...args) => {
    try {
      const result = await asyncFn(...args);
      
      // Handle service error format { success, data, error }
      if (result && !result.success && result.error) {
        handleServiceError(result.error, options);
      }
      
      return result;
    } catch (error) {
      handleServiceError(
        {
          code: ERR.UNKNOWN,
          message: error.message || 'An unexpected error occurred',
          data: error
        },
        options
      );
      throw error;
    }
  };
}

export default handleServiceError;

