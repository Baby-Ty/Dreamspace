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

// Configuration from environment - REQUIRED in production
// These must be set in Azure Functions App Settings
const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

// Validate required config at startup (fail fast)
if (!CLIENT_ID) {
  console.error('❌ AZURE_CLIENT_ID is required. Set it in Azure Functions App Settings.');
}
if (!ALLOWED_ORIGIN) {
  console.error('❌ ALLOWED_ORIGIN is required. Set it in Azure Functions App Settings.');
}

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
 * Check if a coach has access to a specific team member
 * @param {string} coachId - The coach's user ID
 * @param {string} targetUserId - The user ID being accessed
 * @param {object} context - Azure Function context
 * @returns {Promise<boolean>} True if coach can access this user
 */
async function checkTeamMembership(coachId, targetUserId, context) {
  const teamsContainer = getTeamsContainer();
  if (!teamsContainer) {
    context.log.warn('Teams container not available - denying coach access for safety');
    return false;
  }
  
  try {
    // Query teams where this user is the manager and target is a member
    const { resources: teams } = await teamsContainer.items.query({
      query: 'SELECT c.id, c.teamMembers FROM c WHERE c.type = @type AND c.managerId = @coachId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@coachId', value: coachId }
      ]
    }).fetchAll();
    
    if (!teams || teams.length === 0) {
      context.log(`Coach ${coachId} has no team assigned`);
      return false;
    }
    
    // Check if targetUserId is in any of the coach's teams
    for (const team of teams) {
      const members = team.teamMembers || [];
      if (members.includes(targetUserId)) {
        context.log(`Verified: ${targetUserId} is in coach ${coachId}'s team`);
        return true;
      }
    }
    
    context.log(`User ${targetUserId} is NOT in coach ${coachId}'s team(s)`);
    return false;
  } catch (error) {
    context.log.error('Error checking team membership:', error.message);
    // Fail closed - deny access if we can't verify
    return false;
  }
}

/**
 * Check if two users are in the same team (for team member visibility)
 * This allows regular team members to see each other on Dream Team and Dream Connect
 * @param {string} userId - The requesting user's ID
 * @param {string} targetUserId - The user ID being accessed
 * @param {object} context - Azure Function context
 * @returns {Promise<boolean>} True if users are in the same team
 */
async function areUsersInSameTeam(userId, targetUserId, context) {
  const teamsContainer = getTeamsContainer();
  if (!teamsContainer) {
    context.log.warn('Teams container not available');
    return false;
  }
  
  try {
    // Query all teams and check if both users are members of any team
    const { resources: teams } = await teamsContainer.items.query({
      query: 'SELECT c.id, c.teamMembers, c.managerId FROM c WHERE c.type = @type',
      parameters: [
        { name: '@type', value: 'team_relationship' }
      ]
    }).fetchAll();
    
    for (const team of teams) {
      const members = team.teamMembers || [];
      const managerId = team.managerId;
      
      // Include manager in the team for visibility purposes
      const allTeamMembers = [...members, managerId].filter(Boolean);
      
      const userInTeam = allTeamMembers.includes(userId);
      const targetInTeam = allTeamMembers.includes(targetUserId);
      
      if (userInTeam && targetInTeam) {
        context.log(`Users ${userId} and ${targetUserId} are in the same team`);
        return true;
      }
    }
    
    context.log(`Users ${userId} and ${targetUserId} are NOT in the same team`);
    return false;
  } catch (error) {
    context.log.error('Error checking if users are in same team:', error.message);
    return false;
  }
}

/**
 * Require user to be accessing their own data (or be admin/coach/teammate with proper access)
 * @param {object} context - Azure Function context
 * @param {object} req - HTTP request
 * @param {string} targetUserId - The user ID being accessed
 * @returns {Promise<object|null>} User info with role, or null (response already sent)
 */
async function requireUserAccess(context, req, targetUserId) {
  const user = await requireAuth(context, req);
  if (!user) return null;
  
  const { role, isCoach, isAdmin, isTeamManager } = await getUserRole(user.userId, context);
  
  // Admin can access any user
  if (isAdmin) {
    context.log(`Admin ${user.userId} accessing data for ${targetUserId}`);
    return { ...user, role, isCoach, isAdmin };
  }
  
  // User accessing their own data - always allowed
  if (user.userId === targetUserId || user.email === targetUserId) {
    return { ...user, role, isCoach, isAdmin };
  }
  
  // Coach can access their own team members
  if (isCoach || isTeamManager) {
    const hasAccess = await checkTeamMembership(user.userId, targetUserId, context);
    if (hasAccess) {
      return { ...user, role, isCoach, isAdmin, accessingTeamMember: true };
    }
    // Coach trying to access non-team member - fall through to same-team check
  }
  
  // Regular users can see other users in their same team (Dream Team, Dream Connect)
  const sameTeam = await areUsersInSameTeam(user.userId, targetUserId, context);
  if (sameTeam) {
    return { ...user, role, isCoach, isAdmin, accessingTeammate: true };
  }
  
  // Not in same team - deny access
  context.log.warn(`User ${user.userId} attempted to access data for ${targetUserId} (not in same team)`);
  send403(context, 'You can only access data for members of your team');
  return null;
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
  checkTeamMembership,
  areUsersInSameTeam,
  send401,
  send403,
  ALLOWED_ORIGIN
};
