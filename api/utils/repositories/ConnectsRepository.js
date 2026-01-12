/**
 * ConnectsRepository
 * Handles connect (meaningful moment) operations
 */

const BaseRepository = require('./BaseRepository');

class ConnectsRepository extends BaseRepository {
  /**
   * Get connects for a user
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
   * Save a connect
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
      ...connectData
    };
    
    // Add timestamps
    this.addTimestamps(document, !connectData.createdAt);
    
    const { resource } = await container.items.upsert(document);
    return resource;
  }
}

module.exports = ConnectsRepository;
