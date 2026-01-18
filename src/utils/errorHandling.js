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

