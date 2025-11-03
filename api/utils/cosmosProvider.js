/**
 * Cosmos DB Provider Utility
 * Centralized management of Cosmos DB connections and containers
 * for the Dreamspace application
 */

const { CosmosClient } = require('@azure/cosmos');

// Singleton instance
let cosmosProvider = null;

/**
 * Container configuration
 * Maps logical container names to their properties
 */
const CONTAINER_CONFIG = {
  users: {
    name: 'users',
    partitionKey: '/userId',
    description: 'User profiles (no arrays, minimal data)'
  },
  dreams: {
    name: 'dreams',
    partitionKey: '/userId',
    description: 'Aggregated dreams and weekly goal templates per user'
  },
  connects: {
    name: 'connects',
    partitionKey: '/userId',
    description: 'Individual connect documents'
  },
  scoring: {
    name: 'scoring',
    partitionKey: '/userId',
    description: 'Yearly scoring rollups per user'
  },
  teams: {
    name: 'teams',
    partitionKey: '/managerId',
    description: 'Team relationships and coaching assignments'
  },
  coaching_alerts: {
    name: 'coaching_alerts',
    partitionKey: '/managerId',
    description: 'Coaching alerts and notifications'
  }
};

/**
 * Get dynamic year-based container name
 * @param {number} year - Year (e.g., 2025)
 * @returns {string} Container name (e.g., "weeks2025")
 */
function getWeeksContainerName(year) {
  return `weeks${year}`;
}

/**
 * CosmosProvider class - Singleton pattern
 */
class CosmosProvider {
  constructor() {
    if (!process.env.COSMOS_ENDPOINT || !process.env.COSMOS_KEY) {
      throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables are required');
    }

    this.client = new CosmosClient({
      endpoint: process.env.COSMOS_ENDPOINT,
      key: process.env.COSMOS_KEY
    });

    this.database = this.client.database('dreamspace');
    this.containers = {};
    
    // Pre-initialize common containers
    this._initializeContainers();
  }

  /**
   * Initialize container references
   */
  _initializeContainers() {
    Object.entries(CONTAINER_CONFIG).forEach(([key, config]) => {
      this.containers[key] = this.database.container(config.name);
    });
  }

  /**
   * Get a container by logical name
   * @param {string} name - Container name (users, dreams, connects, scoring, teams, coaching_alerts)
   * @returns {Container} Cosmos DB container instance
   */
  getContainer(name) {
    if (this.containers[name]) {
      return this.containers[name];
    }
    throw new Error(`Container '${name}' not found in configuration`);
  }

  /**
   * Get year-specific weeks container (dynamic)
   * @param {number} year - Year (e.g., 2025)
   * @returns {Container} Cosmos DB container instance
   */
  getWeeksContainer(year) {
    const containerName = getWeeksContainerName(year);
    // Cache dynamically created container references
    if (!this.containers[containerName]) {
      this.containers[containerName] = this.database.container(containerName);
    }
    return this.containers[containerName];
  }

  /**
   * Helper: Read a user profile
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} User profile or null if not found
   */
  async getUserProfile(userId) {
    const container = this.getContainer('users');
    try {
      const { resource } = await container.item(userId, userId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Helper: Upsert a user profile
   * @param {string} userId - User ID
   * @param {object} profile - User profile data
   * @returns {Promise<object>} Saved user profile
   */
  async upsertUserProfile(userId, profile) {
    const container = this.getContainer('users');
    const document = {
      ...profile,
      id: userId,
      userId: userId,
      updatedAt: new Date().toISOString()
    };
    const { resource } = await container.items.upsert(document);
    return resource;
  }

  /**
   * Helper: Get dreams document (aggregated format)
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Dreams document or null if not found
   */
  async getDreamsDocument(userId) {
    const container = this.getContainer('dreams');
    try {
      const { resource } = await container.item(userId, userId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Helper: Upsert dreams document
   * @param {string} userId - User ID
   * @param {object} dreamsData - Dreams data (dreamBook, weeklyGoalTemplates)
   * @returns {Promise<object>} Saved dreams document
   */
  async upsertDreamsDocument(userId, dreamsData) {
    const container = this.getContainer('dreams');
    const document = {
      id: userId,
      userId: userId,
      ...dreamsData,
      updatedAt: new Date().toISOString()
    };
    const { resource } = await container.items.upsert(document);
    return resource;
  }

  /**
   * Helper: Get connects for a user
   * @param {string} userId - User ID
   * @param {string} orderBy - Order by clause (e.g., "when DESC")
   * @returns {Promise<Array>} Array of connect documents
   */
  async getUserConnects(userId, orderBy = 'when DESC') {
    const container = this.getContainer('connects');
    const [field, direction] = orderBy.split(' ');
    const query = {
      query: `SELECT * FROM c WHERE c.userId = @userId ORDER BY c.${field} ${direction || 'ASC'}`,
      parameters: [{ name: '@userId', value: userId }]
    };
    const { resources } = await container.items.query(query).fetchAll();
    return resources;
  }

  /**
   * Helper: Save a connect
   * @param {string} userId - User ID
   * @param {object} connectData - Connect data
   * @returns {Promise<object>} Saved connect document
   */
  async upsertConnect(userId, connectData) {
    const container = this.getContainer('connects');
    const connectId = connectData.id || `connect_${userId}_${Date.now()}`;
    const document = {
      id: connectId,
      userId: userId,
      type: 'connect',
      ...connectData,
      updatedAt: new Date().toISOString()
    };
    const { resource } = await container.items.upsert(document);
    return resource;
  }

  /**
   * Helper: Get week document for a user
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @returns {Promise<object|null>} Week document or null if not found
   */
  async getWeekDocument(userId, year) {
    const container = this.getWeeksContainer(year);
    const docId = `${userId}_${year}`;
    try {
      const { resource } = await container.item(docId, userId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Helper: Upsert week goals for a specific week
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @param {string} weekId - Week ID (e.g., "2025-W43")
   * @param {Array} goals - Array of goal objects
   * @returns {Promise<object>} Saved week document
   */
  async upsertWeekGoals(userId, year, weekId, goals) {
    const container = this.getWeeksContainer(year);
    const docId = `${userId}_${year}`;
    
    // Get existing document or create new
    let existingDoc = await this.getWeekDocument(userId, year);
    
    const weekData = {
      goals: goals.map(g => ({
        ...g,
        id: g.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: g.createdAt || new Date().toISOString()
      }))
    };

    const document = existingDoc ? {
      ...existingDoc,
      weeks: {
        ...existingDoc.weeks,
        [weekId]: weekData
      },
      updatedAt: new Date().toISOString()
    } : {
      id: docId,
      userId: userId,
      year: year,
      weeks: {
        [weekId]: weekData
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { resource } = await container.items.upsert(document);
    return resource;
  }

  /**
   * Helper: Get scoring document for a user
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @returns {Promise<object|null>} Scoring document or null if not found
   */
  async getScoringDocument(userId, year) {
    const container = this.getContainer('scoring');
    const docId = `${userId}_${year}_scoring`;
    try {
      const { resource } = await container.item(docId, userId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Helper: Add scoring entry
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @param {object} entry - Scoring entry data
   * @returns {Promise<object>} Saved scoring document
   */
  async addScoringEntry(userId, year, entry) {
    const container = this.getContainer('scoring');
    const docId = `${userId}_${year}_scoring`;
    
    let existingDoc = await this.getScoringDocument(userId, year);
    
    const newEntry = {
      id: entry.id || `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...entry,
      createdAt: entry.createdAt || new Date().toISOString()
    };

    const document = existingDoc ? {
      ...existingDoc,
      totalScore: existingDoc.totalScore + newEntry.points,
      entries: [...existingDoc.entries, newEntry],
      updatedAt: new Date().toISOString()
    } : {
      id: docId,
      userId: userId,
      year: year,
      totalScore: newEntry.points,
      entries: [newEntry],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { resource } = await container.items.upsert(document);
    return resource;
  }

  /**
   * Helper: Get team for a coach/manager
   * @param {string} managerId - Manager ID
   * @returns {Promise<object|null>} Team document or null if not found
   */
  async getTeamByManager(managerId) {
    const container = this.getContainer('teams');
    const query = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@managerId', value: managerId }
      ]
    };
    const { resources } = await container.items.query(query).fetchAll();
    return resources.length > 0 ? resources[0] : null;
  }

  /**
   * Helper: Upsert team
   * @param {string} managerId - Manager ID
   * @param {object} teamData - Team data
   * @returns {Promise<object>} Saved team document
   */
  async upsertTeam(managerId, teamData) {
    const container = this.getContainer('teams');
    const teamId = teamData.id || `team_${managerId}_${Date.now()}`;
    const document = {
      id: teamId,
      managerId: managerId,
      type: 'team_relationship',
      ...teamData,
      lastModified: new Date().toISOString()
    };
    const { resource } = await container.items.upsert(document);
    return resource;
  }

  /**
   * Logging helper for write operations
   * @param {string} containerName - Container name
   * @param {string} partitionKey - Partition key value
   * @param {string} id - Document ID
   * @param {string} operation - Operation type (upsert, delete, etc.)
   * @param {object} metadata - Additional metadata to log
   */
  logWrite(containerName, partitionKey, id, operation, metadata = {}) {
    console.log('💾 WRITE:', {
      container: containerName,
      partitionKey,
      id,
      operation,
      ...metadata
    });
  }

  /**
   * Clean Cosmos metadata from documents
   * @param {object} doc - Document with Cosmos metadata
   * @returns {object} Document without Cosmos metadata
   */
  cleanMetadata(doc) {
    if (!doc) return doc;
    const { _rid, _self, _etag, _attachments, _ts, ...clean } = doc;
    return clean;
  }
}

/**
 * Get singleton instance of CosmosProvider
 * @returns {CosmosProvider|null} CosmosProvider instance or null if initialization fails
 */
function getCosmosProvider() {
  if (!cosmosProvider) {
    try {
      cosmosProvider = new CosmosProvider();
    } catch (error) {
      console.error('Failed to initialize CosmosProvider:', error);
      return null;
    }
  }
  return cosmosProvider;
}

/**
 * Reset provider (useful for testing)
 */
function resetCosmosProvider() {
  cosmosProvider = null;
}

module.exports = {
  getCosmosProvider,
  resetCosmosProvider,
  CosmosProvider,
  CONTAINER_CONFIG,
  getWeeksContainerName
};

