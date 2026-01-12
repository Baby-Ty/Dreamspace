/**
 * Cosmos DB Provider Utility (Refactored)
 * Facade pattern - delegates to specialized repository classes
 * Maintains 100% backward compatibility
 */

const { CosmosClient } = require('@azure/cosmos');
const { getWeeksContainerName } = require('./repositories/WeeksRepository');
const {
  UserRepository,
  DreamsRepository,
  ConnectsRepository,
  WeeksRepository,
  ScoringRepository,
  TeamsRepository,
  PromptsRepository
} = require('./repositories');

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
 * CosmosProvider class - Facade pattern
 * Delegates to specialized repository classes while maintaining backward compatibility
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
    
    // Initialize repository instances
    this.userRepo = new UserRepository(this.database, CONTAINER_CONFIG);
    this.dreamsRepo = new DreamsRepository(this.database, CONTAINER_CONFIG);
    this.connectsRepo = new ConnectsRepository(this.database, CONTAINER_CONFIG);
    this.weeksRepo = new WeeksRepository(this.database, CONTAINER_CONFIG);
    this.scoringRepo = new ScoringRepository(this.database, CONTAINER_CONFIG);
    this.teamsRepo = new TeamsRepository(this.database, CONTAINER_CONFIG);
    this.promptsRepo = new PromptsRepository(this.database, CONTAINER_CONFIG);
    
    // Keep container access for backward compatibility
    this.containers = {};
    this._containerCache = {};
    this._initializeContainers();
  }

  /**
   * Initialize container references
   * @private
   */
  _initializeContainers() {
    Object.entries(CONTAINER_CONFIG).forEach(([key, config]) => {
      this.containers[key] = this.database.container(config.name);
    });
  }

  /**
   * Get a container by logical name
   * CRITICAL: Used by 18 consumer files - must remain in facade
   * @param {string} name - Container name (users, dreams, connects, scoring, teams, coaching_alerts)
   * @returns {Container} Cosmos DB container instance
   */
  getContainer(name) {
    if (this.containers[name]) {
      return this.containers[name];
    }
    throw new Error(`Container '${name}' not found in configuration`);
  }

  // ==================== USER METHODS ====================

  async getUserProfile(userId) {
    return this.userRepo.getUserProfile(userId);
  }

  async upsertUserProfile(userId, profile) {
    return this.userRepo.upsertUserProfile(userId, profile);
  }

  // ==================== DREAMS METHODS ====================

  async getDreamsDocument(userId) {
    return this.dreamsRepo.getDreamsDocument(userId);
  }

  async upsertDreamsDocument(userId, dreamsData) {
    return this.dreamsRepo.upsertDreamsDocument(userId, dreamsData);
  }

  // ==================== CONNECTS METHODS ====================

  async getUserConnects(userId, orderBy) {
    return this.connectsRepo.getUserConnects(userId, orderBy);
  }

  async upsertConnect(userId, connectData) {
    return this.connectsRepo.upsertConnect(userId, connectData);
  }

  // ==================== WEEKS METHODS ====================

  // Legacy weeks{year} container methods (deprecated)
  getWeeksContainer(year) {
    return this.weeksRepo.getWeeksContainer(year);
  }

  async ensureWeeksContainerExists(year, context) {
    return this.weeksRepo.ensureWeeksContainerExists(year, context);
  }

  async getWeekDocument(userId, year) {
    return this.weeksRepo.getWeekDocument(userId, year);
  }

  async upsertWeekGoals(userId, year, weekId, goals) {
    return this.weeksRepo.upsertWeekGoals(userId, year, weekId, goals);
  }

  // New currentWeek container methods
  async getCurrentWeekDocument(userId) {
    return this.weeksRepo.getCurrentWeekDocument(userId);
  }

  async upsertCurrentWeek(userId, weekId, goals, stats) {
    return this.weeksRepo.upsertCurrentWeek(userId, weekId, goals, stats);
  }

  // New pastWeeks container methods
  async getPastWeeksDocument(userId) {
    return this.weeksRepo.getPastWeeksDocument(userId);
  }

  async archiveWeekToPastWeeks(userId, weekId, weekSummary) {
    return this.weeksRepo.archiveWeekToPastWeeks(userId, weekId, weekSummary);
  }

  // Utility methods
  getWeekStartDate(weekId) {
    return this.weeksRepo.getWeekStartDate(weekId);
  }

  getWeekEndDate(weekId) {
    return this.weeksRepo.getWeekEndDate(weekId);
  }

  // ==================== SCORING METHODS ====================

  async getScoringDocument(userId, year) {
    return this.scoringRepo.getScoringDocument(userId, year);
  }

  async addScoringEntry(userId, year, entry) {
    return this.scoringRepo.addScoringEntry(userId, year, entry);
  }

  // ==================== TEAMS METHODS ====================

  async getTeamByManager(managerId) {
    return this.teamsRepo.getTeamByManager(managerId);
  }

  async upsertTeam(managerId, teamData) {
    return this.teamsRepo.upsertTeam(managerId, teamData);
  }

  // ==================== PROMPTS METHODS ====================

  async getPrompts() {
    return this.promptsRepo.getPrompts();
  }

  async upsertPrompts(promptsData, modifiedBy) {
    return this.promptsRepo.upsertPrompts(promptsData, modifiedBy);
  }

  getDefaultPrompts() {
    return this.promptsRepo.getDefaultPrompts();
  }

  async ensurePromptsExist(context) {
    return this.promptsRepo.ensurePromptsExist(context);
  }

  async addPromptHistoryEntry(promptsData, modifiedBy, changeDescription) {
    return this.promptsRepo.addPromptHistoryEntry(promptsData, modifiedBy, changeDescription);
  }

  async getPromptHistory(limit) {
    return this.promptsRepo.getPromptHistory(limit);
  }

  async getPromptVersion(version) {
    return this.promptsRepo.getPromptVersion(version);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Clean Cosmos metadata from documents
   * Delegates to BaseRepository utility
   */
  cleanMetadata(doc) {
    return this.userRepo.cleanMetadata(doc);
  }

  /**
   * Log write operations
   * Delegates to BaseRepository utility
   */
  logWrite(containerName, partitionKey, id, operation, metadata) {
    return this.userRepo.logWrite(containerName, partitionKey, id, operation, metadata);
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
