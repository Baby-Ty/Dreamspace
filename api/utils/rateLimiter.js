/**
 * Simple Rate Limiter for Azure Functions
 * 
 * SECURITY NOTE: Uses in-memory storage for rate limiting.
 * 
 * LIMITATIONS:
 * - State is lost on function restart (users can exceed limits temporarily)
 * - State is NOT shared across multiple instances
 * - Suitable for single-instance Azure Static Web Apps
 * 
 * For production multi-instance deployments, migrate to Azure Cache for Redis:
 * - Install: npm install ioredis
 * - Replace Map with Redis client
 * - Use REDIS_CONNECTION_STRING environment variable
 * 
 * Current deployment model: Azure Static Web Apps (single instance) - in-memory is acceptable.
 */

// In-memory store for rate limiting (clears on function restart)
// WARNING: See security notes above about scaling limitations
const rateLimitStore = new Map();

// Default configuration
const DEFAULT_CONFIG = {
  windowMs: 60 * 1000,      // 1 minute window
  maxRequests: 100,          // 100 requests per window
  message: 'Too many requests, please try again later.',
  statusCode: 429
};

// Endpoint-specific configurations
const ENDPOINT_LIMITS = {
  // AI-related endpoints (expensive operations)
  'generateImage': { windowMs: 60 * 1000, maxRequests: 10 },
  'generateVision': { windowMs: 60 * 1000, maxRequests: 10 },
  
  // Write operations (moderate limits)
  'saveDreams': { windowMs: 60 * 1000, maxRequests: 30 },
  'saveCurrentWeek': { windowMs: 60 * 1000, maxRequests: 60 },
  'saveUserData': { windowMs: 60 * 1000, maxRequests: 30 },
  'saveConnect': { windowMs: 60 * 1000, maxRequests: 30 },
  'saveCoachMessage': { windowMs: 60 * 1000, maxRequests: 30 },
  
  // Read operations (higher limits)
  'getUserData': { windowMs: 60 * 1000, maxRequests: 120 },
  'getCurrentWeek': { windowMs: 60 * 1000, maxRequests: 120 },
  'getTeamMetrics': { windowMs: 60 * 1000, maxRequests: 60 },
  'getAllUsers': { windowMs: 60 * 1000, maxRequests: 30 },
  
  // Admin operations (stricter limits)
  'promoteUserToCoach': { windowMs: 60 * 1000, maxRequests: 10 },
  'replaceTeamCoach': { windowMs: 60 * 1000, maxRequests: 10 },
  'assignUserToCoach': { windowMs: 60 * 1000, maxRequests: 20 },
  
  // Upload operations (file size makes these expensive)
  'uploadDreamPicture': { windowMs: 60 * 1000, maxRequests: 20 },
  'uploadProfilePicture': { windowMs: 60 * 1000, maxRequests: 10 },
  'uploadUserBackgroundImage': { windowMs: 60 * 1000, maxRequests: 10 }
};

/**
 * Clean up expired entries from the rate limit store
 * Called periodically to prevent memory leaks
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.windowStart + data.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Get rate limit key for a request
 * Uses user ID if authenticated, otherwise IP address
 */
function getRateLimitKey(context, req, user) {
  const identifier = user?.userId || user?.id || 
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    'anonymous';
  
  const endpoint = context.executionContext?.functionName || 'unknown';
  return `${endpoint}:${identifier}`;
}

/**
 * Check if request should be rate limited
 * 
 * @param {Object} context - Azure Function context
 * @param {Object} req - HTTP request
 * @param {Object} user - Authenticated user (optional)
 * @returns {{ allowed: boolean, remaining: number, resetTime: number, headers: Object }}
 */
function checkRateLimit(context, req, user = null) {
  const now = Date.now();
  const key = getRateLimitKey(context, req, user);
  const endpoint = context.executionContext?.functionName || 'unknown';
  
  // Get endpoint-specific config or use defaults
  const config = {
    ...DEFAULT_CONFIG,
    ...(ENDPOINT_LIMITS[endpoint] || {})
  };
  
  let data = rateLimitStore.get(key);
  
  // Initialize or reset window if expired
  if (!data || now > data.windowStart + config.windowMs) {
    data = {
      windowStart: now,
      windowMs: config.windowMs,
      count: 0,
      maxRequests: config.maxRequests
    };
    rateLimitStore.set(key, data);
  }
  
  // Increment request count
  data.count++;
  
  const remaining = Math.max(0, config.maxRequests - data.count);
  const resetTime = data.windowStart + config.windowMs;
  
  // Build rate limit headers
  const headers = {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000))
  };
  
  if (data.count > config.maxRequests) {
    headers['Retry-After'] = String(Math.ceil((resetTime - now) / 1000));
    
    return {
      allowed: false,
      remaining: 0,
      resetTime,
      headers,
      message: config.message,
      statusCode: config.statusCode
    };
  }
  
  return {
    allowed: true,
    remaining,
    resetTime,
    headers
  };
}

/**
 * Rate limit middleware for use with apiWrapper
 * 
 * Usage in apiWrapper:
 *   const rateLimit = checkRateLimit(context, req, user);
 *   if (!rateLimit.allowed) {
 *     return { status: 429, body: { error: rateLimit.message }, headers: rateLimit.headers };
 *   }
 */
function createRateLimitMiddleware(options = {}) {
  return function rateLimitMiddleware(context, req, user) {
    return checkRateLimit(context, req, user);
  };
}

/**
 * Add rate limit headers to response
 */
function addRateLimitHeaders(headers, rateLimitResult) {
  return {
    ...headers,
    ...rateLimitResult.headers
  };
}

module.exports = {
  checkRateLimit,
  createRateLimitMiddleware,
  addRateLimitHeaders,
  ENDPOINT_LIMITS,
  DEFAULT_CONFIG
};
