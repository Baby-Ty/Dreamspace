const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database;
let containersCache = {};

if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  
  // Pre-initialize containers
  containersCache = {
    users: database.container('users'),
    botConversations: database.container('botConversations'),
    checkins: database.container('checkins')
  };
}

/**
 * Get a Cosmos DB container by name
 * @param {string} containerName - Name of the container
 * @returns {object} Container instance
 */
function getContainer(containerName) {
  if (!database) {
    throw new Error('Cosmos DB not configured. COSMOS_ENDPOINT and COSMOS_KEY required.');
  }
  
  if (!containersCache[containerName]) {
    containersCache[containerName] = database.container(containerName);
  }
  
  return containersCache[containerName];
}

/**
 * Save or update a conversation reference for proactive messaging
 * @param {string} userId - Azure AD Object ID of the user
 * @param {object} conversationReference - Bot Framework conversation reference
 * @param {string} scope - 'personal' or 'team'
 * @returns {Promise<void>}
 */
async function saveConversationRef(userId, conversationReference, scope = 'personal') {
  const container = getContainer('botConversations');
  
  const conversationData = {
    id: `${userId}-${conversationReference.conversation.id}`,
    userId: userId,
    conversationReference: conversationReference,
    channelId: conversationReference.channelId,
    serviceUrl: conversationReference.serviceUrl,
    scope: scope,
    updatedAt: new Date().toISOString()
  };
  
  await container.items.upsert(conversationData);
}

/**
 * Save a check-in submission to Cosmos DB
 * @param {string} userId - Azure AD Object ID of the user
 * @param {object} checkinData - Check-in form data
 * @returns {Promise<object>} Created check-in document
 */
async function saveCheckin(userId, checkinData) {
  const container = getContainer('checkins');
  
  const now = new Date();
  const timestamp = now.toISOString();
  
  // Calculate week ID (ISO 8601 week format: YYYY-Www)
  const weekNumber = getISOWeekNumber(now);
  const weekId = `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  
  const checkin = {
    id: `${userId}-${Date.now()}`,
    userId: userId,
    type: 'weekly_checkin',
    win: checkinData.win || '',
    challenge: checkinData.challenge || '',
    focused: checkinData.focused === 'true' || checkinData.focused === true,
    needHelp: checkinData.needHelp === 'true' || checkinData.needHelp === true,
    timestamp: timestamp,
    weekId: weekId
  };
  
  const { resource } = await container.items.create(checkin);
  return resource;
}

/**
 * Get ISO week number for a date
 * @param {Date} date 
 * @returns {number} Week number
 */
function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Check if Cosmos DB is configured
 * @returns {boolean}
 */
function isConfigured() {
  return !!client && !!database;
}

module.exports = {
  getContainer,
  saveConversationRef,
  saveCheckin,
  isConfigured
};

