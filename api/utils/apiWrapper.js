/**
 * API Wrapper Utility
 * 
 * Eliminates boilerplate code from Azure Function API endpoints by providing
 * a standardized wrapper that handles:
 * - CORS headers and OPTIONS preflight requests
 * - Authentication and authorization
 * - Database initialization via cosmosProvider
 * - Standard error handling and response formatting
 * - Consistent logging
 * 
 * Usage:
 *   const { createApiHandler } = require('../utils/apiWrapper');
 *   
 *   module.exports = createApiHandler({
 *     auth: 'user',              // 'none' | 'user' | 'coach' | 'admin' | 'user-access'
 *     containerName: 'connects', // optional, provides container to handler
 *     skipDbCheck: false         // optional, for endpoints like health
 *   }, async (context, req, { container, provider, user }) => {
 *     // Your business logic here
 *     // Return data object for 200 response, or throw error
 *     return { success: true, data: ... };
 *   });
 */

const { getCosmosProvider } = require('./cosmosProvider');
const {
  getCorsHeaders,
  isAuthRequired,
  requireAuth,
  requireAdmin,
  requireCoach,
  requireUserAccess
} = require('./authMiddleware');
const { checkRateLimit, addRateLimitHeaders } = require('./rateLimiter');

/**
 * Get value from nested object path
 * e.g., getNestedValue(req, 'body.userId') or getNestedValue(context, 'bindingData.userId')
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Create an API handler with standardized boilerplate handling
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.auth - Auth mode: 'none', 'user', 'coach', 'admin', 'user-access'
 * @param {string} options.targetUserIdParam - Path to userId for 'user-access' auth (e.g., 'body.userId', 'bindingData.userId')
 * @param {string} options.containerName - Optional container name to provide to handler
 * @param {boolean} options.skipDbCheck - Skip database configuration check (for endpoints like health)
 * @param {Function} handler - Business logic function(context, req, { container, provider, user })
 * @returns {Function} Azure Function handler
 */
function createApiHandler(options, handler) {
  // Handle single parameter case (just handler function, no options)
  if (typeof options === 'function') {
    handler = options;
    options = { auth: 'none' };
  }

  // Default options
  const config = {
    auth: options.auth || 'none',
    targetUserIdParam: options.targetUserIdParam || 'body.userId',
    containerName: options.containerName || null,
    skipDbCheck: options.skipDbCheck || false,
    rateLimit: options.rateLimit !== false // Rate limiting enabled by default
  };

  return async function (context, req) {
    const headers = getCorsHeaders();
    let responseHeaders = headers; // For rate limit headers

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      context.res = { status: 200, headers };
      return;
    }

    try {
      // Initialize database provider (unless skipped)
      let provider = null;
      let container = null;

      if (!config.skipDbCheck) {
        try {
          provider = getCosmosProvider();
          
          // Get specific container if requested
          if (config.containerName) {
            container = provider.getContainer(config.containerName);
          }
          
          // Verify provider is available
          if (!provider) {
            context.res = {
              status: 500,
              body: JSON.stringify({
                error: 'Database not configured',
                details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required'
              }),
              headers
            };
            return;
          }
        } catch (dbError) {
          context.log.error('Database initialization error:', dbError);
          context.res = {
            status: 500,
            body: JSON.stringify({
              error: 'Database not configured',
              details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required'
            }),
            headers
          };
          return;
        }
      }

      // Handle authentication based on auth mode
      let user = null;

      if (config.auth !== 'none' && isAuthRequired()) {
        switch (config.auth) {
          case 'user':
            user = await requireAuth(context, req);
            if (!user) return; // 401 already sent
            break;

          case 'admin':
            user = await requireAdmin(context, req);
            if (!user) return; // 401/403 already sent
            break;

          case 'coach':
            user = await requireCoach(context, req);
            if (!user) return; // 401/403 already sent
            break;

          case 'user-access':
            // Extract target userId from request based on configured path
            let targetUserId;
            if (config.targetUserIdParam.startsWith('body.')) {
              targetUserId = getNestedValue(req, config.targetUserIdParam);
            } else if (config.targetUserIdParam.startsWith('bindingData.')) {
              targetUserId = getNestedValue(context, config.targetUserIdParam);
            } else if (config.targetUserIdParam.startsWith('query.')) {
              targetUserId = getNestedValue(req, config.targetUserIdParam);
            } else {
              // Default to body.userId for backward compatibility
              targetUserId = req.body?.userId;
            }

            user = await requireUserAccess(context, req, targetUserId);
            if (!user) return; // 401/403 already sent
            break;

          default:
            context.log.error('Invalid auth mode:', config.auth);
            context.res = {
              status: 500,
              body: JSON.stringify({
                error: 'Internal server error',
                details: 'Invalid authentication configuration'
              }),
              headers
            };
            return;
        }
      }

      // Check rate limit (after auth so we can use user ID for tracking)
      if (config.rateLimit) {
        const rateLimitResult = checkRateLimit(context, req, user);
        responseHeaders = addRateLimitHeaders(headers, rateLimitResult);
        
        if (!rateLimitResult.allowed) {
          context.log.warn('Rate limit exceeded:', {
            endpoint: context.executionContext?.functionName,
            userId: user?.userId || 'anonymous'
          });
          context.res = {
            status: rateLimitResult.statusCode,
            body: JSON.stringify({
              error: rateLimitResult.message,
              retryAfter: rateLimitResult.headers['Retry-After']
            }),
            headers: responseHeaders
          };
          return;
        }
      }

      // Call the business logic handler
      const result = await handler(context, req, {
        container,
        provider,
        user
      });

      // If handler returns null, it has already set context.res
      if (result === null) {
        return;
      }

      // Format successful response
      context.res = {
        status: 200,
        body: JSON.stringify(result),
        headers: responseHeaders
      };

    } catch (error) {
      // Handle errors thrown by business logic
      handleError(context, error, responseHeaders || headers);
    }
  };
}

/**
 * Handle errors and format error responses
 * Supports both standard Error objects and custom error objects with status codes
 */
function handleError(context, error, headers) {
  // Check if it's a custom error with status code
  if (error.status) {
    const statusCode = error.status;
    const errorBody = {
      error: error.message || 'Request failed'
    };
    
    if (error.details) {
      errorBody.details = error.details;
    }

    context.log.error(`Error (${statusCode}):`, error.message || error);
    context.res = {
      status: statusCode,
      body: JSON.stringify(errorBody),
      headers
    };
    return;
  }

  // Handle Cosmos DB errors
  if (error.code === 404) {
    context.log.error('Resource not found:', error.message);
    context.res = {
      status: 404,
      body: JSON.stringify({
        error: 'Resource not found',
        details: error.message
      }),
      headers
    };
    return;
  }

  // Handle standard errors
  context.log.error('Internal server error:', error);
  context.res = {
    status: 500,
    body: JSON.stringify({
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred'
    }),
    headers
  };
}

module.exports = {
  createApiHandler
};
