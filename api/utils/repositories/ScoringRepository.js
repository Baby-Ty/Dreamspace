/**
 * ScoringRepository
 * Handles yearly scoring rollup operations
 */

const BaseRepository = require('./BaseRepository');

class ScoringRepository extends BaseRepository {
  /**
   * Get scoring document for a user
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
      return this.handleReadError(error);
    }
  }

  /**
   * Add scoring entry
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
}

module.exports = ScoringRepository;
