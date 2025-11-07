// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

// Scoring service for managing scoring in the 6-container architecture
import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';

class ScoringService {
  constructor() {
    const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
    this.apiBase = isLiveSite ? 'https://func-dreamspace-prod.azurewebsites.net/api' : '/api';
    console.log('🏆 Scoring Service initialized');
  }

  /**
   * Get scoring document for a user/year
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getScoring(userId, year) {
    try {
      const encodedUserId = encodeURIComponent(userId);
      const url = `${this.apiBase}/getScoring/${encodedUserId}?year=${year}`;

      console.log('📂 Loading scoring:', { userId, year });

      const response = await fetch(url);

      if (response.ok) {
        const scoringDoc = await response.json();
        console.log(`✅ Loaded scoring for ${year}, total: ${scoringDoc.totalScore}`);
        return ok(scoringDoc);
      } else {
        const error = await response.json();
        console.error('❌ Error loading scoring:', error);
        return fail(ErrorCodes.LOAD_ERROR, error.error || 'Failed to load scoring');
      }
    } catch (error) {
      console.error('❌ Error loading scoring:', error);
      return fail(ErrorCodes.LOAD_ERROR, error.message || 'Failed to load scoring');
    }
  }

  /**
   * Add a scoring entry
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @param {object} entry - Scoring entry object
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async addScoringEntry(userId, year, entry) {
    try {
      console.log('💾 Adding scoring entry:', { userId, year, source: entry.source, points: entry.points });

      const response = await fetch(`${this.apiBase}/saveScoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          year,
          entry
        })
      });

      const responseText = await response.text();
      
      if (response.ok) {
        if (!responseText || responseText.trim() === '') {
          console.error('❌ Empty response from API');
          return fail(ErrorCodes.SAVE_ERROR, 'Empty response from API');
        }
        
        try {
          const result = JSON.parse(responseText);
          console.log(`✅ Scoring entry added, new total: ${result.totalScore}`);
          return ok(result);
        } catch (parseError) {
          console.error('❌ Invalid JSON response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, 'Invalid JSON response from API');
        }
      } else {
        try {
          const error = responseText ? JSON.parse(responseText) : { error: 'Unknown error' };
          console.error('❌ Error adding scoring entry:', error);
          return fail(ErrorCodes.SAVE_ERROR, error.error || 'Failed to add scoring entry');
        } catch (parseError) {
          console.error('❌ Error response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, responseText || 'Failed to add scoring entry');
        }
      }
    } catch (error) {
      console.error('❌ Error adding scoring entry:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to add scoring entry');
    }
  }

  /**
   * Calculate scoring for adding a dream
   * Client-side helper
   * @param {object} dream - Dream object
   * @returns {number} - Points to award
   */
  calculateDreamScoring(dream) {
    // Base points for adding a dream
    return 10;
  }

  /**
   * Calculate scoring for completing a weekly goal
   * Client-side helper
   * @param {object} goal - Goal object
   * @returns {number} - Points to award
   */
  calculateWeekScoring(goal) {
    // Base points for completing a weekly goal
    return 5;
  }

  /**
   * Calculate scoring for adding a connect
   * Client-side helper
   * @param {object} connect - Connect object
   * @returns {number} - Points to award
   */
  calculateConnectScoring(connect) {
    // Base points for adding a connect
    return 3;
  }

  /**
   * Calculate scoring for completing a milestone
   * Client-side helper
   * @param {object} milestone - Milestone object
   * @returns {number} - Points to award
   */
  calculateMilestoneScoring(milestone) {
    // Base points for completing a milestone
    return 15;
  }

  /**
   * Create a scoring entry object
   * Helper to build properly formatted entry
   */
  createScoringEntry(source, points, activity, metadata = {}) {
    return {
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split('T')[0],
      source, // 'dream', 'week', 'connect', 'milestone'
      dreamId: metadata.dreamId,
      weekId: metadata.weekId,
      connectId: metadata.connectId,
      points,
      activity,
      createdAt: new Date().toISOString()
    };
  }
}

// Create singleton instance
const scoringService = new ScoringService();
export default scoringService;



