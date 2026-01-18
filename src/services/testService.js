
import { env } from '../utils/env';
import { logger } from '../utils/logger';

const API_BASE_URL = env.VITE_API_BASE_URL;

/**
 * Test service for development/testing features
 * Only available in development mode
 */

/**
 * Trigger week rollover for testing
 * @param {string} userId - User ID
 * @param {boolean} force - Force rollover even if week is current
 * @returns {Promise<{success: boolean, rolled: boolean, message: string}>}
 */
export async function testWeekRollover(userId, force = false) {
  if (!userId) {
    return {
      success: false,
      error: 'User ID is required'
    };
  }

  try {
    const url = `${API_BASE_URL}/testWeekRollover/${encodeURIComponent(userId)}`;
    
    logger.info('testService', 'Triggering test week rollover', { userId, force });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ force })
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('testService', 'Test rollover failed', { 
        status: response.status, 
        error: data.error 
      });
      return {
        success: false,
        error: data.error || 'Failed to trigger rollover'
      };
    }

    logger.info('testService', 'Test rollover completed', data);
    return {
      success: true,
      ...data
    };

  } catch (error) {
    logger.error('testService', 'Test rollover error', { error: error.message });
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}
