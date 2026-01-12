/**
 * UserRepository
 * Handles all user profile operations
 */

const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  /**
   * Read a user profile
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} User profile or null if not found
   */
  async getUserProfile(userId) {
    const container = this.getContainer('users');
    try {
      const { resource } = await container.item(userId, userId).read();
      return resource;
    } catch (error) {
      return this.handleReadError(error);
    }
  }

  /**
   * Upsert a user profile
   * @param {string} userId - User ID
   * @param {object} profile - User profile data
   * @returns {Promise<object>} Saved user profile
   */
  async upsertUserProfile(userId, profile) {
    const container = this.getContainer('users');
    const document = {
      ...profile,
      id: userId,
      userId: userId
    };
    
    // Add timestamps
    this.addTimestamps(document, !profile.createdAt);
    
    const { resource } = await container.items.upsert(document);
    return resource;
  }
}

module.exports = UserRepository;
