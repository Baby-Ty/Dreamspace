/**
 * Environment Variable Validation
 * 
 * SECURITY: Validates required environment variables at startup.
 * This ensures the application fails fast if misconfigured,
 * rather than failing at runtime with potentially confusing errors.
 * 
 * Usage: Import this module early in your application to trigger validation.
 */

// Required environment variables - application will not start without these
const REQUIRED_ENV = [
  'COSMOS_ENDPOINT',
  'COSMOS_KEY'
];

// Required for authentication in production
const AUTH_REQUIRED_ENV = [
  'AZURE_TENANT_ID',
  'AZURE_CLIENT_ID',
  'ALLOWED_ORIGIN'
];

// Optional environment variables - features are disabled without these
const OPTIONAL_ENV = {
  'OPENAI_API_KEY': 'Image generation will be unavailable',
  'AZURE_STORAGE_CONNECTION_STRING': 'Image uploads will be unavailable'
};

/**
 * Validate environment variables and log warnings/errors
 * @param {Object} context - Optional Azure Function context for logging
 * @returns {Object} Validation result { valid: boolean, missing: string[], warnings: string[] }
 */
function validateEnvironment(context = null) {
  const log = context?.log || console;
  const missing = [];
  const warnings = [];
  
  // Check required variables
  REQUIRED_ENV.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });
  
  // Check auth-required variables (if auth is enabled)
  const authRequired = process.env.REQUIRE_AUTH !== 'false';
  if (authRequired) {
    AUTH_REQUIRED_ENV.forEach(key => {
      if (!process.env[key]) {
        missing.push(key);
      }
    });
  }
  
  // Check optional variables
  Object.entries(OPTIONAL_ENV).forEach(([key, message]) => {
    if (!process.env[key]) {
      warnings.push(`${key}: ${message}`);
    }
  });
  
  // Log results
  if (missing.length > 0) {
    log.error?.(`❌ SECURITY: Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (warnings.length > 0) {
    warnings.forEach(warning => {
      log.warn?.(`⚠️ Optional env not set - ${warning}`);
    });
  }
  
  // Security check: Warn if auth is disabled in what looks like production
  if (!authRequired) {
    const isProd = process.env.NODE_ENV === 'production' || 
                   process.env.AZURE_FUNCTIONS_ENVIRONMENT === 'Production' ||
                   process.env.WEBSITE_SITE_NAME; // Azure deployment indicator
    
    if (isProd) {
      log.error?.('❌ SECURITY CRITICAL: REQUIRE_AUTH=false in production environment!');
      missing.push('REQUIRE_AUTH (should be true in production)');
    } else {
      log.warn?.('⚠️ SECURITY: Authentication is disabled (REQUIRE_AUTH=false). Only use in development.');
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Validate and fail fast if critical variables are missing
 * Call this at application startup
 */
function requireValidEnvironment(context = null) {
  const result = validateEnvironment(context);
  
  if (!result.valid) {
    const errorMsg = `FATAL: Missing required environment variables: ${result.missing.join(', ')}`;
    
    // In Azure Functions, we can't call process.exit, but we can throw
    throw new Error(errorMsg);
  }
  
  return result;
}

module.exports = {
  validateEnvironment,
  requireValidEnvironment,
  REQUIRED_ENV,
  AUTH_REQUIRED_ENV,
  OPTIONAL_ENV
};
