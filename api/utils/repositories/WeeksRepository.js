/**
 * WeeksRepository
 * Handles week goal tracking operations across current, past, and legacy containers
 */

const BaseRepository = require('./BaseRepository');

/**
 * Get dynamic year-based container name (legacy)
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

class WeeksRepository extends BaseRepository {
  constructor(database, containerConfig) {
    super(database, containerConfig);
    this._containerCache = {}; // Cache for container existence checks
    this._legacyContainers = {}; // Cache for dynamically created legacy containers
  }

  // ==================== LEGACY WEEKS{YEAR} METHODS ====================
  // These methods support the old weeks{year} container structure
  // Deprecated but kept for backward compatibility

  /**
   * Get year-specific weeks container (dynamic, legacy)
   * @param {number} year - Year (e.g., 2025)
   * @returns {Container} Cosmos DB container instance
   * 
   * @deprecated This method accesses legacy weeks{year} containers.
   * New code should use getCurrentWeekDocument() or getPastWeeksDocument() instead.
   * Kept for backward compatibility with old data reads only.
   */
  getWeeksContainer(year) {
    const containerName = getWeeksContainerName(year);
    // Cache dynamically created container references
    if (!this._legacyContainers[containerName]) {
      this._legacyContainers[containerName] = this.database.container(containerName);
    }
    return this._legacyContainers[containerName];
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
   * Get week document for a user (legacy)
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @returns {Promise<object|null>} Week document or null if not found
   * 
   * @deprecated Legacy method for weeks{year} containers.
   */
  async getWeekDocument(userId, year) {
    const container = this.getWeeksContainer(year);
    const docId = `${userId}_${year}`;
    try {
      const { resource } = await container.item(docId, userId).read();
      return resource;
    } catch (error) {
      return this.handleReadError(error);
    }
  }

  /**
   * Upsert week goals for a specific week (legacy)
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @param {string} weekId - Week ID (e.g., "2025-W43")
   * @param {Array} goals - Array of goal objects
   * @returns {Promise<object>} Saved week document
   * 
   * @deprecated Legacy method for weeks{year} containers.
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

  // ==================== CURRENT WEEK METHODS ====================
  // New structure: one document per user in currentWeek container

  /**
   * Get current week document for a user
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
      return this.handleReadError(error);
    }
  }

  /**
   * Upsert current week document
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

  // ==================== PAST WEEKS METHODS ====================
  // New structure: one document per user with all historical weeks

  /**
   * Get past weeks document for a user
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
      return this.handleReadError(error);
    }
  }

  /**
   * Archive a week to past weeks history
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

  // ==================== UTILITY METHODS ====================

  /**
   * Get week start date from ISO week ID
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
   * Get week end date from ISO week ID
   * @param {string} weekId - ISO week ID (e.g., "2025-W47")
   * @returns {string} ISO date string
   */
  getWeekEndDate(weekId) {
    const weekStart = new Date(this.getWeekStartDate(weekId));
    weekStart.setDate(weekStart.getDate() + 6);
    return weekStart.toISOString().split('T')[0];
  }
}

module.exports = WeeksRepository;
module.exports.getWeeksContainerName = getWeeksContainerName;
