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
  },
  currentWeek: {
    name: 'currentWeek',
    partitionKey: '/userId',
    description: 'Active goals for current week only (one doc per user)'
  },
  pastWeeks: {
    name: 'pastWeeks',
    partitionKey: '/userId',
    description: 'Lightweight historical summaries of past weeks (one doc per user, all years)'
  },
  meeting_attendance: {
    name: 'meeting_attendance',
    partitionKey: '/teamId',
    description: 'Team meeting attendance records'
  },
  prompts: {
    name: 'prompts',
    partitionKey: '/partitionKey',
    description: 'AI prompt configurations for image and text generation (includes history)'
  }
};

/**
 * Get dynamic year-based container name
 * @param {number} year - Year (e.g., 2025)
 * @returns {string} Container name (e.g., "weeks2025")
 * 
 * @deprecated This function supports legacy weeks{year} containers.
 * New code should use currentWeek + pastWeeks containers instead.
 * Kept for backward compatibility with old data reads only.
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
    this._containerCache = {}; // Cache for container existence checks
    
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
   * 
   * @deprecated This method accesses legacy weeks{year} containers.
   * New code should use getContainer('currentWeek') or getContainer('pastWeeks') instead.
   * Kept for backward compatibility with old data reads only.
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
   * Ensure a year-specific weeks container exists, creating it if necessary
   * @param {number} year - Year (e.g., 2025, 2026)
   * @param {object} context - Optional Azure Function context for logging
   * @returns {Promise<boolean>} True if container exists/created, false on error
   * 
   * @deprecated This method creates legacy weeks{year} containers.
   * New code should use currentWeek + pastWeeks containers instead.
   * Kept for backward compatibility with old data reads only.
   */
  async ensureWeeksContainerExists(year, context = null) {
    const containerName = getWeeksContainerName(year);
    
    // Check cache to avoid repeated checks in same execution
    if (this._containerCache[containerName]) {
      return true;
    }
    
    try {
      // Use createIfNotExists to ensure container exists
      const { container } = await this.database.containers.createIfNotExists({
        id: containerName,
        partitionKey: { paths: ['/userId'] }
      });
      
      // Cache the result
      this._containerCache[containerName] = true;
      
      // Log success (use context.log if available, otherwise console.log)
      const logFn = context?.log || console.log;
      logFn(`✅ Container ${containerName} ready`);
      
      return true;
    } catch (error) {
      // Log error
      const logFn = context?.log?.error || console.error;
      logFn(`❌ Failed to ensure container ${containerName}:`, error.message);
      return false;
    }
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
   * Helper: Get current week document for a user
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Current week document or null if not found
   */
  async getCurrentWeekDocument(userId) {
    const container = this.getContainer('currentWeek');
    const docId = userId; // Document ID format: {userId} per CONTEXT.md
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
   * Helper: Upsert current week document
   * @param {string} userId - User ID
   * @param {string} weekId - ISO week ID (e.g., "2025-W47")
   * @param {Array} goals - Array of goal objects
   * @param {object} stats - Week statistics
   * @returns {Promise<object>} Saved current week document
   */
  async upsertCurrentWeek(userId, weekId, goals, stats = {}) {
    const container = this.getContainer('currentWeek');
    const docId = userId; // Document ID format: {userId} per CONTEXT.md
    
    // Calculate week start/end dates
    const weekStart = this.getWeekStartDate(weekId);
    const weekEnd = this.getWeekEndDate(weekId);
    
    const document = {
      id: docId,
      userId: userId,
      weekId: weekId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      goals: goals.map(g => ({
        ...g,
        id: g.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: g.createdAt || new Date().toISOString()
      })),
      stats: {
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.completed).length,
        skippedGoals: goals.filter(g => g.skipped).length,
        score: stats.score || 0,
        ...stats
      },
      updatedAt: new Date().toISOString()
    };

    // Set createdAt only if new document
    const existing = await this.getCurrentWeekDocument(userId);
    if (!existing) {
      document.createdAt = new Date().toISOString();
    }

    const { resource } = await container.items.upsert(document);
    return resource;
  }

  /**
   * Helper: Get past weeks document for a user
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Past weeks document or null if not found
   */
  async getPastWeeksDocument(userId) {
    const container = this.getContainer('pastWeeks');
    const docId = userId; // Document ID format: {userId} per CONTEXT.md
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
   * Helper: Archive a week to past weeks history
   * @param {string} userId - User ID
   * @param {string} weekId - ISO week ID (e.g., "2025-W47")
   * @param {object} weekSummary - Week summary stats
   * @returns {Promise<object>} Updated past weeks document
   */
  async archiveWeekToPastWeeks(userId, weekId, weekSummary) {
    const container = this.getContainer('pastWeeks');
    const docId = userId; // Document ID format: {userId} per CONTEXT.md
    
    // Get existing document or create new
    let existingDoc = await this.getPastWeeksDocument(userId);
    
    const document = existingDoc ? {
      ...existingDoc,
      weekHistory: {
        ...existingDoc.weekHistory,
        [weekId]: {
          totalGoals: weekSummary.totalGoals || 0,
          completedGoals: weekSummary.completedGoals || 0,
          skippedGoals: weekSummary.skippedGoals || 0,
          score: weekSummary.score || 0,
          weekStartDate: weekSummary.weekStartDate,
          weekEndDate: weekSummary.weekEndDate,
          archivedAt: new Date().toISOString()
        }
      },
      totalWeeksTracked: Object.keys(existingDoc.weekHistory || {}).length + 1,
      updatedAt: new Date().toISOString()
    } : {
      id: docId,
      userId: userId,
      weekHistory: {
        [weekId]: {
          totalGoals: weekSummary.totalGoals || 0,
          completedGoals: weekSummary.completedGoals || 0,
          skippedGoals: weekSummary.skippedGoals || 0,
          score: weekSummary.score || 0,
          weekStartDate: weekSummary.weekStartDate,
          weekEndDate: weekSummary.weekEndDate,
          archivedAt: new Date().toISOString()
        }
      },
      totalWeeksTracked: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { resource } = await container.items.upsert(document);
    return resource;
  }

  /**
   * Helper: Get week start date from ISO week ID
   * @param {string} weekId - ISO week ID (e.g., "2025-W47")
   * @returns {string} ISO date string
   */
  getWeekStartDate(weekId) {
    const [yearStr, weekStr] = weekId.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    
    // ISO week starts on Monday
    const jan4 = new Date(year, 0, 4);
    const firstMonday = new Date(jan4);
    firstMonday.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1);
    
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
    
    return weekStart.toISOString().split('T')[0];
  }

  /**
   * Helper: Get week end date from ISO week ID
   * @param {string} weekId - ISO week ID (e.g., "2025-W47")
   * @returns {string} ISO date string
   */
  getWeekEndDate(weekId) {
    const weekStart = new Date(this.getWeekStartDate(weekId));
    weekStart.setDate(weekStart.getDate() + 6);
    return weekStart.toISOString().split('T')[0];
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
   * Helper: Get prompts configuration
   * @returns {Promise<object|null>} Prompts document or null if not found
   */
  async getPrompts() {
    try {
      const container = this.getContainer('prompts');
      const docId = 'ai-prompts';
      const partitionKey = 'config';
      try {
        const { resource } = await container.item(docId, partitionKey).read();
        return resource;
      } catch (error) {
        // Handle document not found (404) or container not found
        if (error.code === 404 || error.code === 'NotFound') {
          return null;
        }
        // If it's a container not found error, return null to trigger creation
        if (error.message && error.message.includes('Container') && error.message.includes('not found')) {
          return null;
        }
        throw error;
      }
    } catch (error) {
      // If container doesn't exist in config or other initialization error, return null
      if (error.message && error.message.includes('not found in configuration')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Helper: Upsert prompts configuration
   * @param {object} promptsData - Prompts data
   * @param {string} modifiedBy - User email who made the change
   * @returns {Promise<object>} Saved prompts document
   */
  async upsertPrompts(promptsData, modifiedBy) {
    try {
      const container = this.getContainer('prompts');
      const docId = 'ai-prompts';
      const partitionKey = 'config';
      
      const document = {
        id: docId,
        partitionKey: partitionKey,
        ...promptsData,
        lastModified: new Date().toISOString(),
        modifiedBy: modifiedBy || 'system'
      };
      
      const { resource } = await container.items.upsert(document);
      return resource;
    } catch (error) {
      // If container doesn't exist, try to create it first
      if (error.message && (error.message.includes('Container') || error.message.includes('not found'))) {
        // Container will be auto-created on first write in Cosmos DB, but if that fails,
        // we'll let the error propagate
        throw new Error(`Prompts container not found. Please ensure the 'prompts' container exists in Cosmos DB with partition key '/partitionKey'. Error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Helper: Get default prompts configuration
   * @returns {object} Default prompts structure
   */
  getDefaultPrompts() {
    return {
      imageGeneration: {
        dreamPrompt: `Create an inspiring, symbolic image that represents the dream: {userSearchTerm}

Make the image visually strong, motivating, and emotionally uplifting.  
Use scenery, objects, environments, silhouettes, distant figures, or hands-only shots — no identifiable people or faces.`,
        backgroundCardPrompt: `Create a clean, visually appealing background image based on the theme: "{userSearchTerm}".

Make the image expressive but not distracting, with a subtle composition that works behind UI text.  
Use scenery, objects, abstract shapes, or symbolic visuals — but no identifiable people or faces.`
      },
      visionGeneration: {
        generateSystemPrompt: `You are a visionary life coach helping someone craft an inspiring personal vision statement. 
Write in first person, present tense. Warm, authentic, aspirational — never corporate.

The tone should feel like a confident dreamer speaking from the heart.
Keep it to around {maxWords} words. Make every word count.`,
        generateUserPrompt: `Here's what I shared about my mindset, goals, and hopes:
"{userInput}"

{dreamContext}

Transform this into a powerful, personal vision statement that captures my aspirations. 
Make it sound like ME - confident, inspired, and ready to make it happen.`,
        polishSystemPrompt: `You are an editor refining a personal vision statement.
Keep the same meaning and personal voice, but elevate clarity, confidence, and inspiration.
Write in first person. Around {maxWords} words.
Do not add new concepts — just polish what's already there.`,
        polishUserPrompt: `Please polish this vision statement while keeping my voice:
"{userInput}"

{dreamContext}

Make it sound more visionary and confident, but still authentically me.`
      },
      styleModifiers: {
        stylized_digital: {
          label: 'Stylized Digital Painting',
          modifier: 'stylized digital painting, soft brush textures, warm lighting, smooth gradients, gentle color exaggeration, clean modern illustration style'
        },
        vibrant_coastal: {
          label: 'Vibrant Coastal Illustration',
          modifier: 'vibrant illustrated scenery, warm daylight, smooth shading, gentle highlights, slightly stylized natural elements'
        },
        semi_realistic: {
          label: 'Semi-Realistic Landscape Art',
          modifier: 'semi-realistic environment art, crisp edges, vibrant tones, atmospheric depth, painterly highlights, detailed but not photorealistic'
        },
        photorealistic_cinematic: {
          label: 'Photorealistic Cinematic',
          modifier: 'photorealistic detail, cinematic lighting, shallow depth of field, soft film grain, high-contrast highlights'
        }
      }
    };
  }

  /**
   * Helper: Ensure prompts document exists with defaults
   * @param {object} context - Optional Azure Function context for logging
   * @returns {Promise<object>} Prompts document (existing or newly created)
   */
  async ensurePromptsExist(context = null) {
    let prompts = await this.getPrompts();
    
    if (!prompts) {
      const logFn = context?.log || console.log;
      logFn('📝 Creating default prompts configuration');
      
      const defaultPrompts = this.getDefaultPrompts();
      prompts = await this.upsertPrompts(defaultPrompts, 'system');
      logFn('✅ Default prompts configuration created');
    }
    
    return prompts;
  }

  /**
   * Helper: Add a prompt history entry (snapshot before changes)
   * @param {object} promptsData - Current prompts data to snapshot
   * @param {string} modifiedBy - User email who made the change
   * @param {string} changeDescription - Optional description of what changed
   * @returns {Promise<object>} Created history entry
   */
  async addPromptHistoryEntry(promptsData, modifiedBy, changeDescription = null) {
    try {
      // Use same 'prompts' container but with 'history' partition key
      const container = this.getContainer('prompts');
      const timestamp = new Date().toISOString();
      const version = `history_${Date.now()}`;
      
      // Create a clean copy of prompts (remove metadata)
      const { id, partitionKey, _rid, _self, _etag, _attachments, _ts, lastModified, modifiedBy: prevModifier, ...promptsSnapshot } = promptsData;
      
      const historyEntry = {
        id: version,
        partitionKey: 'history',  // Different partition key from 'config' used by main prompts
        type: 'prompt-history',
        version: version,
        timestamp: timestamp,
        modifiedBy: modifiedBy || 'system',
        changeDescription: changeDescription,
        prompts: promptsSnapshot
      };
      
      const { resource } = await container.items.upsert(historyEntry);
      return resource;
    } catch (error) {
      // Fail gracefully - history is optional, don't break the main save operation
      console.warn('Failed to save prompt history entry:', error.message || error);
      return null;
    }
  }

  /**
   * Helper: Get prompt history entries
   * @param {number} limit - Maximum number of entries to return (default 50)
   * @returns {Promise<Array>} Array of history entries, newest first
   */
  async getPromptHistory(limit = 50) {
    try {
      // Query history entries from the 'prompts' container (partition key = 'history')
      const container = this.getContainer('prompts');
      const query = {
        query: `SELECT * FROM c WHERE c.partitionKey = @partitionKey AND c.type = @type ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit`,
        parameters: [
          { name: '@partitionKey', value: 'history' },
          { name: '@type', value: 'prompt-history' },
          { name: '@limit', value: limit }
        ]
      };
      const { resources } = await container.items.query(query).fetchAll();
      return resources;
    } catch (error) {
      // Fail gracefully - return empty array if any error
      console.warn('Failed to get prompt history:', error.message || error);
      return [];
    }
  }

  /**
   * Helper: Get a specific prompt version from history
   * @param {string} version - Version ID to retrieve
   * @returns {Promise<object|null>} History entry or null if not found
   */
  async getPromptVersion(version) {
    try {
      // Read from 'prompts' container with 'history' partition key
      const container = this.getContainer('prompts');
      const { resource } = await container.item(version, 'history').read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      // Fail gracefully - return null if any error
      console.warn('Failed to get prompt version:', error.message || error);
      return null;
    }
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





