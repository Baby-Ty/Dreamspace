// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
// DoD: validated I/O with Zod; consistent error shape; unit tested; CI green; health check passing.

/**
 * Success response helper
 */
export function ok(data) {
  return { success: true, data };
}

/**
 * Error response helper
 */
export function fail(code, message, data) {
  const response = {
    success: false,
    error: { code, message }
  };
  if (data !== undefined) {
    response.data = data;
  }
  return response;
}

/**
 * Convert error to readable message
 */
export function toErrorMessage(e) {
  if (typeof e === 'string') return e;
  if (e?.message) return e.message;
  if (e?.error?.message) return e.error.message;
  if (e?.statusText) return e.statusText;
  return 'An unexpected error occurred';
}


