// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';
import { parseIsoWeek } from '../utils/dateUtils.js';
import { requestCache } from '../utils/requestCache.js';

/**
 * Week Service for DreamSpace
 * Handles weekly goals CRUD operations in the 6-container architecture
 */
class WeekService {
  constructor() {
    const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
    this.apiBase = isLiveSite ? 'https://func-dreamspace-prod.azurewebsites.net/api' : '/api';
    console.log('📅 Week Service initialized');
  }

  /**
   * Initialize an empty week document for a user/year
   * Creates the document structure in the weeks container
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async initializeWeekDocument(userId, year) {
    try {
      console.log(`📅 Initializing week document for user ${userId}, year ${year}`);

      const response = await fetch(`${this.apiBase}/saveWeekGoals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          year,
          weekId: null, // Signal to create empty document
          goals: []
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
          console.log(`✅ Initialized week document for ${year}`);
          return ok(result);
        } catch (parseError) {
          console.error('❌ Invalid JSON response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, 'Invalid JSON response from API');
        }
      } else {
        try {
          const error = responseText ? JSON.parse(responseText) : { error: 'Unknown error' };
          console.error('❌ Error initializing week document:', error);
          return fail(ErrorCodes.SAVE_ERROR, error.error || 'Failed to initialize week document');
        } catch (parseError) {
          console.error('❌ Error response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, responseText || 'Failed to initialize week document');
        }
      }
    } catch (error) {
      console.error('❌ Error initializing week document:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to initialize week document');
    }
  }

  /**
   * Note: initializeAllWeeks is no longer needed as a separate method.
   * All weeks initialization is now handled automatically by the getUserData API on login.
   */

  /**
   * Get week goals document for a user/year
   * Uses caching to prevent duplicate requests and improve performance
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getWeekGoals(userId, year) {
    const cacheKey = `weekGoals:${userId}:${year}`;
    
    return requestCache.fetch(cacheKey, async () => {
      try {
        const encodedUserId = encodeURIComponent(userId);
        const url = `${this.apiBase}/getWeekGoals?userId=${encodedUserId}&year=${year}`;

        console.log('📂 Loading week goals:', { userId, year, url });

        const response = await fetch(url);

        if (response.ok) {
          const weekDoc = await response.json();
          console.log(`✅ Loaded week document for ${year}`);
          return ok(weekDoc);
        } else {
          if (response.status === 404) {
            console.log(`ℹ️ No week document exists for ${year} yet, returning empty`);
            return ok({ userId, year, weeks: {} });
          }
          
          const error = await response.json();
          console.error('❌ Error loading week goals:', error);
          return fail(ErrorCodes.LOAD_ERROR, error.error || 'Failed to load week goals');
        }
      } catch (error) {
        console.error('❌ Error loading week goals:', error);
        return fail(ErrorCodes.LOAD_ERROR, error.message || 'Failed to load week goals');
      }
    }, 30000); // 30 second cache TTL
  }

  /**
   * Save week goals for a specific week
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @param {string} weekId - Week ID (e.g., "2025-W43")
   * @param {array} goals - Array of goal objects
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async saveWeekGoals(userId, year, weekId, goals) {
    try {
      console.log(`💾 Saving ${goals.length} goals for ${weekId}`);

      const response = await fetch(`${this.apiBase}/saveWeekGoals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          year,
          weekId,
          goals
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
        console.log(`✅ Saved ${goals.length} goals for ${weekId}`);
        
        // Invalidate cache after successful save
        requestCache.invalidate(`weekGoals:${userId}:${year}`);
        
        return ok(result);
        } catch (parseError) {
          console.error('❌ Invalid JSON response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, 'Invalid JSON response from API');
        }
      } else {
        try {
          const error = responseText ? JSON.parse(responseText) : { error: 'Unknown error' };
          
          // If 404, week document doesn't exist yet - initialize it first
          if (response.status === 404 && error.error?.includes('does not exist')) {
            console.log('📅 Week document does not exist, initializing...');
            const initResult = await this.initializeWeekDocument(userId, year);
            
            if (initResult.success) {
              console.log('✅ Week document created, retrying save...');
              // Retry the save operation
              return await this.saveWeekGoals(userId, year, weekId, goals);
            } else {
              console.error('❌ Failed to initialize week document:', initResult.error);
              return initResult;
            }
          }
          
          console.error('❌ Error saving week goals:', error);
          return fail(ErrorCodes.SAVE_ERROR, error.error || 'Failed to save week goals');
        } catch (parseError) {
          console.error('❌ Error response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, responseText || 'Failed to save week goals');
        }
      }
    } catch (error) {
      console.error('❌ Error saving week goals:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to save week goals');
    }
  }

  /**
   * Bulk instantiate templates across all their target weeks
   * Creates goal instances for all weeks where templates should be active
   * Automatically splits instances across multiple year containers (e.g., weeks2025, weeks2026)
   * @param {string} userId - User ID
   * @param {array} templates - Array of template objects to instantiate
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async bulkInstantiateTemplates(userId, templates) {
    try {
      console.log(`🚀 Bulk instantiating ${templates.length} templates (multi-year support)`);

      const response = await fetch(`${this.apiBase}/bulkInstantiateTemplates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          templates
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
          console.log(`✅ Bulk instantiation complete:`, result);
          console.log(`   📊 Years affected: ${result.yearsAffected?.join(', ')}`);
          console.log(`   📈 Total instances: ${result.totalInstancesCreated}`);
          
          // Invalidate cache for all affected years
          if (result.yearsAffected && Array.isArray(result.yearsAffected)) {
            result.yearsAffected.forEach(year => {
              requestCache.invalidate(`weekGoals:${userId}:${year}`);
            });
          }
          
          return ok(result);
        } catch (parseError) {
          console.error('❌ Invalid JSON response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, 'Invalid JSON response from API');
        }
      } else {
        try {
          const error = responseText ? JSON.parse(responseText) : { error: 'Unknown error' };
          console.error('❌ Error bulk instantiating templates:', error);
          return fail(ErrorCodes.SAVE_ERROR, error.error || 'Failed to bulk instantiate templates');
        } catch (parseError) {
          console.error('❌ Error response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, responseText || 'Failed to bulk instantiate templates');
        }
      }
    } catch (error) {
      console.error('❌ Error bulk instantiating templates:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to bulk instantiate templates');
    }
  }

  /**
   * Load or create goals for a specific week
   * Fetches existing goals from weeks container, or creates from templates if not exists
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @param {string} weekId - Week ID (e.g., "2025-W43")
   * @param {array} templates - Array of template objects (weekly_goal_template)
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  async loadOrCreateWeekGoals(userId, year, weekId, templates = []) {
    try {
      console.log(`📂 Loading or creating goals for ${weekId}`);

      // Try to load existing week document
      const weekDocResult = await this.getWeekGoals(userId, year);
      
      if (!weekDocResult.success) {
        console.error('❌ Failed to load week document:', weekDocResult.error);
        return weekDocResult;
      }

      const weekDoc = weekDocResult.data;
      
      // Check if this specific week has goals
      if (weekDoc.weeks && weekDoc.weeks[weekId]) {
        const goals = weekDoc.weeks[weekId].goals || [];
        console.log(`✅ Found ${goals.length} existing goals for ${weekId}`);
        
        // Add weekId and type to each goal for consistency
        const goalsWithWeekId = goals.map(goal => ({
          ...goal,
          type: goal.type || 'weekly_goal',
          weekId: weekId
        }));
        
        return ok(goalsWithWeekId);
      }

      // Week doesn't exist yet, create from templates
      console.log(`📋 No goals found for ${weekId}, creating from ${templates.length} templates`);
      
      // Create instances from templates (inline logic from old weekTemplateService)
      const instances = templates.map(template => ({
        id: `${template.id}_${weekId}`,
        type: 'weekly_goal',
        goalType: template.goalType || 'consistency',
        templateId: template.id,
        goalId: template.goalId || template.id,
        dreamId: template.dreamId,
        milestoneId: template.milestoneId,
        title: template.title,
        description: template.description || '',
        dreamTitle: template.dreamTitle,
        dreamCategory: template.dreamCategory,
        completed: false,
        recurrence: template.recurrence || 'weekly',
        targetWeeks: template.targetWeeks,
        targetMonths: template.targetMonths,
        weekId: weekId,
        createdAt: new Date().toISOString()
      }));
      
      if (instances.length > 0) {
        // Save the instances to the week
        const saveResult = await this.saveWeekGoals(userId, year, weekId, instances);
        
        if (saveResult.success) {
          console.log(`✅ Created and saved ${instances.length} goal instances for ${weekId}`);
          return ok(instances);
        } else {
          return saveResult;
        }
      }
      
      // No templates, return empty array
      return ok([]);
    } catch (error) {
      console.error('❌ Error loading or creating week goals:', error);
      return fail(ErrorCodes.LOAD_ERROR, error.message || 'Failed to load or create week goals');
    }
  }
}

// Create and export singleton instance
export const weekService = new WeekService();
export default weekService;
