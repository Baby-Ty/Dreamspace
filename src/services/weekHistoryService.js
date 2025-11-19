// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../utils/env.js';

const API_BASE_URL = env.VITE_API_BASE_URL;

/**
 * Week History Service
 * Service for querying past weeks historical summaries
 */

/**
 * Get past weeks history for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getPastWeeks(userId) {
  try {
    logger.info('weekHistoryService', 'Getting past weeks history', { userId });

    const response = await fetch(`${API_BASE_URL}/getPastWeeks/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('weekHistoryService', 'Failed to get past weeks', { 
        status: response.status,
        error: errorData 
      });
      return fail(ErrorCodes.NETWORK, errorData.error || 'Failed to get past weeks');
    }

    const result = await response.json();
    
    console.log('📊 weekHistoryService.getPastWeeks: API response:', {
      success: result.success,
      hasData: !!result.data,
      dataKeys: result.data ? Object.keys(result.data) : [],
      weekHistoryType: typeof result.data?.weekHistory,
      weekHistoryKeys: result.data?.weekHistory ? Object.keys(result.data.weekHistory) : [],
      weekHistoryCount: result.data?.weekHistory ? Object.keys(result.data.weekHistory).length : 0,
      sampleWeek: result.data?.weekHistory ? Object.values(result.data.weekHistory)[0] : null
    });
    
    if (!result.success) {
      logger.error('weekHistoryService', 'Get past weeks returned unsuccessful', { result });
      return fail(ErrorCodes.UNKNOWN, result.error || 'Failed to get past weeks');
    }

    const weeksCount = Object.keys(result.data?.weekHistory || {}).length;
    logger.info('weekHistoryService', 'Past weeks retrieved', { weeksCount });
    
    console.log(`✅ weekHistoryService.getPastWeeks: Returning ${weeksCount} weeks`);

    return ok(result.data);

  } catch (error) {
    logger.error('weekHistoryService', 'Error getting past weeks', { error: error.message });
    return fail(ErrorCodes.NETWORK, 'Network error while getting past weeks');
  }
}

/**
 * Get recent weeks (last N weeks)
 * @param {string} userId - User ID
 * @param {number} count - Number of recent weeks to get (default: 12)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getRecentWeeks(userId, count = 12) {
  const result = await getPastWeeks(userId);
  
  if (!result.success) {
    return result;
  }

  const weekHistory = result.data?.weekHistory || {};
  const weekEntries = Object.entries(weekHistory);
  
  console.log('📊 weekHistoryService.getRecentWeeks:', {
    weekHistoryKeys: Object.keys(weekHistory),
    weekHistoryCount: weekEntries.length,
    sampleEntry: weekEntries[0]
  });
  
  // Sort by week ID (descending - most recent first)
  weekEntries.sort((a, b) => b[0].localeCompare(a[0]));
  
  // Take most recent N weeks
  const recentWeeks = weekEntries.slice(0, count).map(([weekId, stats]) => {
    const weekData = {
      weekId,
      ...stats
    };
    
    console.log(`   Week ${weekId}:`, weekData);
    
    return weekData;
  });
  
  console.log(`✅ Returning ${recentWeeks.length} recent weeks`);

  return ok(recentWeeks);
}

/**
 * Get week statistics for a specific week
 * @param {string} userId - User ID
 * @param {string} weekId - ISO week ID (e.g., "2025-W47")
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getWeekStats(userId, weekId) {
  const result = await getPastWeeks(userId);
  
  if (!result.success) {
    return result;
  }

  const weekHistory = result.data?.weekHistory || {};
  const weekStats = weekHistory[weekId];

  if (!weekStats) {
    return fail(ErrorCodes.NOT_FOUND, `No stats found for week ${weekId}`);
  }

  return ok({
    weekId,
    ...weekStats
  });
}

/**
 * Get completion rate over time (for charting)
 * @param {string} userId - User ID
 * @param {number} weeks - Number of weeks to include (default: 12)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getCompletionRate(userId, weeks = 12) {
  const result = await getRecentWeeks(userId, weeks);
  
  if (!result.success) {
    return result;
  }

  const completionData = result.data.map(week => ({
    weekId: week.weekId,
    weekStartDate: week.weekStartDate,
    completionRate: week.totalGoals > 0 
      ? Math.round((week.completedGoals / week.totalGoals) * 100)
      : 0,
    totalGoals: week.totalGoals,
    completedGoals: week.completedGoals,
    score: week.score
  }));

  return ok(completionData);
}

/**
 * Calculate total stats across all weeks
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getTotalStats(userId) {
  const result = await getPastWeeks(userId);
  
  if (!result.success) {
    return result;
  }

  const weekHistory = result.data?.weekHistory || {};
  const weeks = Object.values(weekHistory);

  const totals = weeks.reduce((acc, week) => ({
    totalWeeks: acc.totalWeeks + 1,
    totalGoals: acc.totalGoals + (week.totalGoals || 0),
    completedGoals: acc.completedGoals + (week.completedGoals || 0),
    totalScore: acc.totalScore + (week.score || 0)
  }), {
    totalWeeks: 0,
    totalGoals: 0,
    completedGoals: 0,
    totalScore: 0
  });

  totals.overallCompletionRate = totals.totalGoals > 0
    ? Math.round((totals.completedGoals / totals.totalGoals) * 100)
    : 0;

  return ok(totals);
}

export default {
  getPastWeeks,
  getRecentWeeks,
  getWeekStats,
  getCompletionRate,
  getTotalStats
};

