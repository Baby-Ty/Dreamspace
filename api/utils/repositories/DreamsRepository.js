/**
 * DreamsRepository
 * Handles dreams document operations (aggregated dreamBook + weekly goal templates)
 */

const BaseRepository = require('./BaseRepository');

class DreamsRepository extends BaseRepository {
  /**
   * Get dreams document (aggregated format)
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Dreams document or null if not found
   */
  async getDreamsDocument(userId) {
    const container = this.getContainer('dreams');
    try {
      const { resource } = await container.item(userId, userId).read();
      return resource;
    } catch (error) {
      return this.handleReadError(error);
    }
  }

  /**
   * Upsert dreams document
   * @param {string} userId - User ID
   * @param {object} dreamsData - Dreams data (dreamBook, weeklyGoalTemplates)
   * @returns {Promise<object>} Saved dreams document
   */
  async upsertDreamsDocument(userId, dreamsData) {
    const container = this.getContainer('dreams');
    const document = {
      id: userId,
      userId: userId,
      ...dreamsData
    };
    
    // Add timestamps
    this.addTimestamps(document, !dreamsData.createdAt);
    
    const { resource } = await container.items.upsert(document);
    return resource;
  }
}

module.exports = DreamsRepository;
