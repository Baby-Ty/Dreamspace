// Error code constants for consistent error handling across services

/**
 * Primary error categories (enum-style)
 * Use these as the main error codes throughout the app
 */
export const ERR = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Detailed error codes (legacy support + specific cases)
 * Prefer using ERR enum above for new code
 */
export const ErrorCodes = {
  // Network errors
  NETWORK: ERR.NETWORK,
  FETCH_ERROR: ERR.NETWORK,
  TIMEOUT: ERR.NETWORK,
  
  // Authentication/Authorization errors
  AUTH: ERR.AUTH,
  UNAUTHORIZED: ERR.AUTH,
  FORBIDDEN: ERR.AUTH,
  TOKEN_EXPIRED: ERR.AUTH,
  
  // Validation errors
  VALIDATION: ERR.VALIDATION,
  VALIDATION_ERROR: ERR.VALIDATION,
  INVALID_INPUT: ERR.VALIDATION,
  INVALID_CONFIG: ERR.VALIDATION,
  
  // Unknown/Generic errors
  UNKNOWN: ERR.UNKNOWN,
  UNKNOWN_ERROR: ERR.UNKNOWN,
  
  // HTTP status codes (map to primary categories)
  HTTP_400: ERR.VALIDATION,
  HTTP_401: ERR.AUTH,
  HTTP_403: ERR.AUTH,
  HTTP_404: ERR.NETWORK,
  HTTP_500: ERR.UNKNOWN,
  
  // Service-specific errors (map to primary categories)
  NOT_FOUND: ERR.VALIDATION,
  ALREADY_EXISTS: ERR.VALIDATION,
  SAVE_ERROR: ERR.UNKNOWN,
  LOAD_ERROR: ERR.UNKNOWN,
  DELETE_ERROR: ERR.UNKNOWN
};
