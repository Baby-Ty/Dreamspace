/**
 * Authentication Middleware for Azure Functions
 * 
 * Validates Entra ID (Azure AD) tokens and provides role-based access control.
 * Roles are stored in Cosmos DB, not Entra ID app roles.
 * 
 * Usage:
 *   const { requireAuth, requireAdmin, requireUserAccess, isAuthRequired } = require('../utils/authMiddleware');
 *   
 *   // At top of function:
 *   if (isAuthRequired()) {
 *     const user = await requireAuth(context, req);
 *     if (!user) return; // 401 already sent
 *   }
 */

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { CosmosClient } = require('@azure/cosmos');

// Configuration from environment
const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID || 'ebe60b7a-93c9-4b12-8375-4ab3181000e8';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://dreamspace.tylerstewart.co.za';

// Cosmos client for role lookups (lazy init)
let cosmosClient = null;
let usersContainer = null;
let teamsContainer = null;

function getCosmosClient() {
  if (!cosmosClient && process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
    cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_ENDPOINT,
      key: process.env.COSMOS_KEY
    });
  }
  return cosmosClient;
}

function getCosmosContainer() {
  const client = getCosmosClient();
  if (!usersContainer && client) {
    usersContainer = client.database('dreamspace').container('users');
  }
  return usersContainer;
}

function getTeamsContainer() {
  const client = getCosmosClient();
  if (!teamsContainer && client) {
    teamsContainer = client.database('dreamspace').container('teams');
  }
  return teamsContainer;
}

// JWKS client for Microsoft's signing keys (lazy init)
let jwks = null;

function getJwksClient() {
  if (!jwks && TENANT_ID) {
    jwks = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`,
      cache: true,
      cacheMaxAge: 86400000, // 24 hours
      rateLimit: true,
      jwksRequestsPerMinute: 10
    });
  }
  return jwks;
}

/**
 * Get signing key from JWKS endpoint
 */
function getSigningKey(header, callback) {
  const client = getJwksClient();
  if (!client) {
    return callback(new Error('JWKS client not configured - missing AZURE_TENANT_ID'));
  }
  
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.publicKey || key.rsaPublicKey);
  });
}

/**
 * Validate ID token from Entra ID
 * @param {object} req - HTTP request
 * @param {object} context - Azure Function context
 * @returns {Promise<object|null>} User info or null if invalid
 */
async function validateToken(req, context) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    context.log('No Bearer token in Authorization header');
    return null;
  }
  
  const token = authHeader.substring(7);
  
  if (!TENANT_ID) {
    context.log.warn('AZURE_TENANT_ID not configured - skipping token validation');
    return null;
  }
  
  return new Promise((resolve) => {
    jwt.verify(token, getSigningKey, {
      audience: CLIENT_ID,
      issuer: [
        `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
        `https://sts.windows.net/${TENANT_ID}/`
      ],
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        context.log.warn('Token validation failed:', err.message);
        resolve(null);
      } else {
        const user = {
          userId: decoded.preferred_username || decoded.email || decoded.sub,
          email: decoded.email || decoded.preferred_username,
          name: decoded.name,
          oid: decoded.oid,  // Object ID in Entra
          tid: decoded.tid   // Tenant ID
        };
        context.log(`Token validated for user: ${user.email}`);
        resolve(user);
      }
    });
  });
}

/**
 * Get user role and flags from Cosmos DB
 * Also checks if user is a team manager (which grants coach privileges)
 * @param {string} userId - User ID (email)
 * @param {object} context - Azure Function context
 * @returns {Promise<object>} { role: string, isCoach: boolean, isAdmin: boolean, isTeamManager: boolean }
 */
async function getUserRole(userId, context) {
  const container = getCosmosContainer();
  if (!container) {
    context.log.warn('Cosmos container not available - defaulting to user role');
    return { role: 'user', isCoach: false, isAdmin: false, isTeamManager: false };
  }
  
  try {
    const { resource } = await container.item(userId, userId).read();
    
    // Use roles object as source of truth (not the derived role string)
    const isAdmin = resource?.roles?.admin === true;
    let isCoach = resource?.roles?.coach === true || resource?.isCoach === true;
    
    // Keep role string for backward compatibility in logs
    let role = resource?.role || 'user';
    
    // Also check if user is a team manager (grants coach privileges)
    let isTeamManager = false;
    const teamsContainer = getTeamsContainer();
    if (teamsContainer && !isCoach && !isAdmin) {
      try {
        // Query teams where this user is the manager
        const { resources: teams } = await teamsContainer.items.query({
          query: 'SELECT c.id FROM c WHERE c.managerId = @userId',
          parameters: [{ name: '@userId', value: userId }]
        }).fetchAll();
        
        if (teams && teams.length > 0) {
          isTeamManager = true;
          isCoach = true; // Team managers have coach privileges
          context.log(`User ${userId} is a team manager - granting coach privileges`);
        }
      } catch (teamError) {
        context.log.warn('Error checking team manager status:', teamError.message);
      }
    }
    
    context.log(`User ${userId} has role: ${role}, isCoach: ${isCoach}, isAdmin: ${isAdmin}, isTeamManager: ${isTeamManager}, roles:`, resource?.roles);
    return { role, isCoach, isAdmin, isTeamManager };
  } catch (error) {
    if (error.code === 404) {
      context.log(`User ${userId} not found in database - defaulting to user role`);
      return { role: 'user', isCoach: false, isAdmin: false, isTeamManager: false };
    }
    context.log.error('Error fetching user role:', error.message);
    return { role: 'user', isCoach: false, isAdmin: false, isTeamManager: false };
  }
}

/**
 * Check if authentication is required (feature flag)
 * Authentication is REQUIRED by default for security.
 * Set REQUIRE_AUTH=false explicitly to disable (development only).
 * @returns {boolean}
 */
function isAuthRequired() {
  return process.env.REQUIRE_AUTH !== 'false';
}

/**
 * Get CORS headers for responses
 * @returns {object} Headers object
 */
function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  };
}

/**
 * Send 401 Unauthorized response
 */
function send401(context, message = 'Authentication required') {
  context.res = {
    status: 401,
    body: JSON.stringify({ error: message }),
    headers: getCorsHeaders()
  };
}

/**
 * Send 403 Forbidden response
 */
function send403(context, message = 'Access denied') {
  context.res = {
    status: 403,
    body: JSON.stringify({ error: message }),
    headers: getCorsHeaders()
  };
}

/**
 * Require authentication - returns user info or sends 401
 * @param {object} context - Azure Function context
 * @param {object} req - HTTP request
 * @returns {Promise<object|null>} User info or null (response already sent)
 */
async function requireAuth(context, req) {
  const user = await validateToken(req, context);
  
  if (!user) {
    send401(context, 'Invalid or missing authentication token');
    return null;
  }
  
  return user;
}

/**
 * Require admin role - returns user info or sends 401/403
 * @param {object} context - Azure Function context
 * @param {object} req - HTTP request
 * @returns {Promise<object|null>} User info with role, or null (response already sent)
 */
async function requireAdmin(context, req) {
  const user = await requireAuth(context, req);
  if (!user) return null;
  
  const { role, isAdmin } = await getUserRole(user.userId, context);
  
  if (!isAdmin) {
    context.log.warn(`User ${user.userId} attempted admin action (isAdmin: ${isAdmin}, role: ${role})`);
    send403(context, 'Admin access required');
    return null;
  }
  
  return { ...user, role, isAdmin };
}

/**
 * Require coach role (or admin) - returns user info or sends 401/403
 * Also checks the isCoach boolean flag in user profile
 * @param {object} context - Azure Function context
 * @param {object} req - HTTP request
 * @returns {Promise<object|null>} User info with role, or null (response already sent)
 */
async function requireCoach(context, req) {
  const user = await requireAuth(context, req);
  if (!user) return null;
  
  const { role, isCoach, isAdmin } = await getUserRole(user.userId, context);
  
  // Allow if admin, coach role, OR isCoach flag is true
  if (!isAdmin && !isCoach) {
    context.log.warn(`User ${user.userId} attempted coach action with role: ${role}, isCoach: ${isCoach}`);
    send403(context, 'Coach access required');
    return null;
  }
  
  return { ...user, role, isCoach, isAdmin };
}

/**
 * Require user to be accessing their own data (or be admin/coach)
 * @param {object} context - Azure Function context
 * @param {object} req - HTTP request
 * @param {string} targetUserId - The user ID being accessed
 * @returns {Promise<object|null>} User info with role, or null (response already sent)
 */
async function requireUserAccess(context, req, targetUserId) {
  const user = await requireAuth(context, req);
  if (!user) return null;
  
  const { role, isCoach, isAdmin } = await getUserRole(user.userId, context);
  
  // Admin can access any user
  if (isAdmin) {
    return { ...user, role, isCoach, isAdmin };
  }
  
  // Coach can access their team members (simplified - just allow any access for now)
  // TODO: Add team membership check if needed
  if (isCoach) {
    return { ...user, role, isCoach, isAdmin };
  }
  
  // Regular users can only access their own data
  if (user.userId !== targetUserId && user.email !== targetUserId) {
    context.log.warn(`User ${user.userId} attempted to access data for ${targetUserId}`);
    send403(context, 'You can only access your own data');
    return null;
  }
  
  return { ...user, role, isCoach, isAdmin };
}

module.exports = {
  validateToken,
  getUserRole,
  isAuthRequired,
  getCorsHeaders,
  requireAuth,
  requireAdmin,
  requireCoach,
  requireUserAccess,
  send401,
  send403,
  ALLOWED_ORIGIN
};
