// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';
import { logger } from '../utils/logger.js';

// Use direct function app URL on live site (same pattern as other services)
const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
const API_BASE_URL = isLiveSite ? 'https://func-dreamspace-prod.azurewebsites.net/api' : '/api';

/**
 * Current Week Service
 * Simplified service for managing current week goals
 * Replaces complex weeks{year} multi-document pattern
 */

/**
 * Get current week document for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getCurrentWeek(userId) {
  try {
    logger.info('currentWeekService', 'Getting current week', { userId });

    const response = await fetch(`${API_BASE_URL}/getCurrentWeek/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('currentWeekService', 'Failed to get current week', { 
        status: response.status,
        error: errorData 
      });
      return fail(ErrorCodes.NETWORK, errorData.error || 'Failed to get current week');
    }

    const result = await response.json();
    
    if (!result.success) {
      logger.error('currentWeekService', 'Get current week returned unsuccessful', { result });
      return fail(ErrorCodes.UNKNOWN, result.error || 'Failed to get current week');
    }

    logger.info('currentWeekService', 'Current week retrieved', { 
      weekId: result.data?.weekId,
      goalsCount: result.data?.goals?.length || 0
    });

    return ok(result.data);

  } catch (error) {
    logger.error('currentWeekService', 'Error getting current week', { error: error.message });
    return fail(ErrorCodes.NETWORK, 'Network error while getting current week');
  }
}

/**
 * Save/update current week document
 * @param {string} userId - User ID
 * @param {string} weekId - ISO week ID (e.g., "2025-W47")
 * @param {Array} goals - Array of goal objects
 * @param {object} stats - Optional stats object
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function saveCurrentWeek(userId, weekId, goals, stats = {}) {
  try {
    logger.info('currentWeekService', 'Saving current week', { 
      userId, 
      weekId, 
      goalsCount: goals.length 
    });

    const response = await fetch(`${API_BASE_URL}/saveCurrentWeek`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        weekId,
        goals,
        stats
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('currentWeekService', 'Failed to save current week', { 
        status: response.status,
        error: errorData 
      });
      return fail(ErrorCodes.NETWORK, errorData.error || 'Failed to save current week');
    }

    const result = await response.json();
    
    if (!result.success) {
      logger.error('currentWeekService', 'Save current week returned unsuccessful', { result });
      return fail(ErrorCodes.UNKNOWN, result.error || 'Failed to save current week');
    }

    logger.info('currentWeekService', 'Current week saved successfully', { 
      weekId,
      goalsCount: goals.length
    });

    return ok(result.data);

  } catch (error) {
    logger.error('currentWeekService', 'Error saving current week', { error: error.message });
    return fail(ErrorCodes.NETWORK, 'Network error while saving current week');
  }
}

/**
 * Archive current week to past weeks history
 * @param {string} userId - User ID
 * @param {string} weekId - ISO week ID (e.g., "2025-W47")
 * @param {object} weekSummary - Week summary stats
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function archiveWeek(userId, weekId, weekSummary) {
  try {
    logger.info('currentWeekService', 'Archiving week', { userId, weekId });

    const response = await fetch(`${API_BASE_URL}/archiveWeek`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        weekId,
        weekSummary
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('currentWeekService', 'Failed to archive week', { 
        status: response.status,
        error: errorData 
      });
      return fail(ErrorCodes.NETWORK, errorData.error || 'Failed to archive week');
    }

    const result = await response.json();
    
    if (!result.success) {
      logger.error('currentWeekService', 'Archive week returned unsuccessful', { result });
      return fail(ErrorCodes.UNKNOWN, result.error || 'Failed to archive week');
    }

    logger.info('currentWeekService', 'Week archived successfully', { weekId });

    return ok(result.data);

  } catch (error) {
    logger.error('currentWeekService', 'Error archiving week', { error: error.message });
    return fail(ErrorCodes.NETWORK, 'Network error while archiving week');
  }
}

/**
 * Toggle goal completion in current week
 * @param {string} userId - User ID
 * @param {string} weekId - ISO week ID
 * @param {string} goalId - Goal ID to toggle
 * @param {Array} currentGoals - Current goals array
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function toggleGoalCompletion(userId, weekId, goalId, currentGoals) {
  // Find and toggle the goal
  const updatedGoals = currentGoals.map(g => {
    if (g.id === goalId) {
      const newCompleted = !g.completed;
      return {
        ...g,
        completed: newCompleted,
        completedAt: newCompleted ? new Date().toISOString() : null
      };
    }
    return g;
  });

  // Save the updated goals
  return await saveCurrentWeek(userId, weekId, updatedGoals);
}

/**
 * Skip a goal for the current week
 * @param {string} userId - User ID
 * @param {string} weekId - ISO week ID
 * @param {string} goalId - Goal ID to skip
 * @param {Array} currentGoals - Current goals array
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function skipGoal(userId, weekId, goalId, currentGoals) {
  const updatedGoals = currentGoals.map(g => {
    if (g.id === goalId) {
      return {
        ...g,
        skipped: true,
        skippedAt: new Date().toISOString()
      };
    }
    return g;
  });

  return await saveCurrentWeek(userId, weekId, updatedGoals);
}

/**
 * Increment completion count for monthly goal
 * @param {string} userId - User ID
 * @param {string} weekId - ISO week ID
 * @param {string} goalId - Goal ID to increment
 * @param {Array} currentGoals - Current goals array
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function incrementMonthlyGoal(userId, weekId, goalId, currentGoals) {
  const updatedGoals = currentGoals.map(g => {
    if (g.id === goalId && g.recurrence === 'monthly') {
      const newCount = Math.min((g.completionCount || 0) + 1, g.frequency || 1);
      const isComplete = newCount >= g.frequency;
      
      return {
        ...g,
        completionCount: newCount,
        completed: isComplete,
        completionDates: [
          ...(g.completionDates || []),
          new Date().toISOString()
        ]
      };
    }
    return g;
  });

  return await saveCurrentWeek(userId, weekId, updatedGoals);
}

/**
 * Increment completion count for weekly goal
 * @param {string} userId - User ID
 * @param {string} weekId - ISO week ID
 * @param {string} goalId - Goal ID to increment
 * @param {Array} currentGoals - Current goals array
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function incrementWeeklyGoal(userId, weekId, goalId, currentGoals) {
  const updatedGoals = currentGoals.map(g => {
    if (g.id === goalId && g.recurrence === 'weekly') {
      const newCount = Math.min((g.completionCount || 0) + 1, g.frequency || 1);
      const isComplete = newCount >= g.frequency;
      
      return {
        ...g,
        completionCount: newCount,
        completed: isComplete,
        completionDates: [
          ...(g.completionDates || []),
          new Date().toISOString()
        ]
      };
    }
    return g;
  });

  return await saveCurrentWeek(userId, weekId, updatedGoals);
}

export default {
  getCurrentWeek,
  saveCurrentWeek,
  archiveWeek,
  toggleGoalCompletion,
  skipGoal,
  incrementMonthlyGoal,
  incrementWeeklyGoal
};

