// Week service for managing weekly goals in the 6-container architecture
import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';
import { parseIsoWeek } from '../utils/dateUtils.js';

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
   * Get week goals document for a user/year
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getWeekGoals(userId, year) {
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
        const error = await response.json();
        console.error('❌ Error loading week goals:', error);
        return fail(ErrorCodes.LOAD_ERROR, error.error || 'Failed to load week goals');
      }
    } catch (error) {
      console.error('❌ Error loading week goals:', error);
      return fail(ErrorCodes.LOAD_ERROR, error.message || 'Failed to load week goals');
    }
  }

  /**
   * Save week goals for a specific week
   * Handles missing week documents gracefully by creating them first
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @param {string} weekId - Week ID (e.g., "2025-W43")
   * @param {array} goals - Array of goal objects for this week
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async saveWeekGoals(userId, year, weekId, goals) {
    try {
      console.log('💾 Saving week goals:', { userId, year, weekId, goalsCount: goals.length });

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
          console.log(`✅ Week goals saved for ${weekId}`);
          return ok(result);
        } catch (parseError) {
          console.error('❌ Invalid JSON response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, 'Invalid JSON response from API');
        }
      } else {
        // Check if the error is due to missing document (404)
        try {
          const error = responseText ? JSON.parse(responseText) : { error: 'Unknown error' };
          
          // If document doesn't exist, create it and retry
          if (response.status === 404 || (error.error && error.error.includes('not found'))) {
            console.log('📅 Week document not found, initializing...');
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
   * Get active weekly goal templates for a user
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  async getWeekTemplates(userId) {
    try {
      const encodedUserId = encodeURIComponent(userId);
      const url = `${this.apiBase}/getWeekTemplates/${encodedUserId}`;

      console.log('📂 Loading week templates for user:', userId);

      const response = await fetch(url);

      if (response.ok) {
        const templates = await response.json();
        console.log(`✅ Loaded ${templates.length} week templates`);
        return ok(templates);
      } else {
        const error = await response.json();
        console.error('❌ Error loading week templates:', error);
        return fail(ErrorCodes.LOAD_ERROR, error.error || 'Failed to load week templates');
      }
    } catch (error) {
      console.error('❌ Error loading week templates:', error);
      return fail(ErrorCodes.LOAD_ERROR, error.message || 'Failed to load week templates');
    }
  }

  /**
   * Create a week instance from a template
   * Client-side helper function
   * @param {object} template - Template object
   * @param {string} weekId - Week ID (e.g., "2025-W43")
   * @returns {object} - Goal instance
   */
  createWeekInstanceFromTemplate(template, weekId) {
    return {
      id: `${template.id}_${weekId}`,
      templateId: template.id,
      dreamId: template.dreamId,
      milestoneId: template.milestoneId,
      title: template.title,
      description: template.description || '',
      dreamTitle: template.dreamTitle,
      dreamCategory: template.dreamCategory,
      completed: false,
      recurrence: template.recurrence || 'weekly',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Check if a template should create an instance for a given week
   * Based on durationType, startDate, targetMonths, etc.
   * @param {object} template - Template object
   * @param {string} weekId - Week ID (e.g., "2025-W43")
   * @returns {boolean} - Whether to create instance
   */
  shouldCreateInstance(template, weekId) {
    if (!template.active) {
      return false;
    }

    // Parse week ID to get week number and year
    const { year: weekYear, week: weekNumber } = parseIsoWeek(weekId);
    
    // Check if template has started
    if (template.startDate) {
      const startDate = new Date(template.startDate);
      const weekDate = new Date(weekYear, 0, 1 + (weekNumber - 1) * 7);
      
      if (weekDate < startDate) {
        return false;
      }
    }

    // Handle monthly goals with targetMonths
    if (template.recurrence === 'monthly' && template.targetMonths) {
      if (!template.startDate) return true;
      
      const startDate = new Date(template.startDate);
      const startMonthIndex = startDate.getFullYear() * 12 + startDate.getMonth();
      
      // Get month for the week
      const weekDate = new Date(weekYear, 0, 1 + (weekNumber - 1) * 7);
      const weekMonthIndex = weekDate.getFullYear() * 12 + weekDate.getMonth();
      
      const monthsElapsed = weekMonthIndex - startMonthIndex;
      return monthsElapsed < template.targetMonths;
    }

    // Check duration type
    if (template.durationType === 'unlimited') {
      return true;
    }

    if (template.durationType === 'weeks' && template.durationWeeks) {
      // Calculate weeks since start
      if (!template.startDate) return true;
      
      const startDate = new Date(template.startDate);
      const { year: startYear, week: startWeek } = parseIsoWeek(startDate.toISOString());
      
      const weeksSinceStart = (weekYear - startYear) * 52 + (weekNumber - startWeek);
      
      return weeksSinceStart < template.durationWeeks;
    }

    // For milestone duration, need to check if milestone is complete
    // This should be handled by the caller since we don't have access to dream data here
    if (template.durationType === 'milestone') {
      return true; // Let caller determine based on milestone status
    }

    return true;
  }

  /**
   * Instantiate templates for a specific week
   * Creates goal instances from active templates that should apply to this week
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @param {string} weekId - Week ID (e.g., "2025-W43")
   * @param {array} templates - Array of template objects
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  async instantiateTemplatesForWeek(userId, year, weekId, templates) {
    try {
      console.log(`📋 Instantiating templates for ${weekId}:`, templates.length);

      // Filter active templates that should apply to this week
      const activeTemplates = templates.filter(template => 
        this.shouldCreateInstance(template, weekId)
      );

      console.log(`✅ ${activeTemplates.length} active templates for ${weekId}`);

      if (activeTemplates.length === 0) {
        // No templates to instantiate, but this is still successful
        return ok([]);
      }

      // Create instances from templates
      const instances = activeTemplates.map(template => ({
        id: `${template.id}_${weekId}`,
        type: 'weekly_goal', // Mark as instance, not template
        templateId: template.id,
        dreamId: template.dreamId,
        milestoneId: template.milestoneId,
        title: template.title,
        description: template.description || '',
        dreamTitle: template.dreamTitle,
        dreamCategory: template.dreamCategory,
        completed: false,
        recurrence: 'weekly',
        weekId: weekId,
        createdAt: new Date().toISOString()
      }));

      // Save all instances to the weeks container
      const result = await this.saveWeekGoals(userId, year, weekId, instances);
      
      if (result.success) {
        console.log(`✅ Created ${instances.length} goal instances for ${weekId}`);
        return ok(instances);
      } else {
        return result;
      }
    } catch (error) {
      console.error('❌ Error instantiating templates:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to instantiate templates');
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
          type: goal.type || 'weekly_goal', // Ensure type is set
          weekId: weekId
        }));
        
        return ok(goalsWithWeekId);
      }

      // Week doesn't exist yet, create from templates
      console.log(`📋 No goals found for ${weekId}, creating from ${templates.length} templates`);
      
      const instantiateResult = await this.instantiateTemplatesForWeek(userId, year, weekId, templates);
      
      return instantiateResult;
    } catch (error) {
      console.error('❌ Error loading or creating week goals:', error);
      return fail(ErrorCodes.LOAD_ERROR, error.message || 'Failed to load or create week goals');
    }
  }

  /**
   * Bulk instantiate templates for all applicable weeks (typically full year)
   * Creates goal instances for all weeks based on template duration settings
   * @param {string} userId - User ID
   * @param {number} year - Year (e.g., 2025)
   * @param {array} templates - Array of template objects (weekly_goal_template)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async bulkInstantiateTemplates(userId, year, templates) {
    try {
      console.log(`🔄 Bulk instantiating ${templates.length} templates for year ${year}`);

      const response = await fetch(`${this.apiBase}/bulkInstantiateTemplates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          year,
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
}

// Create singleton instance
const weekService = new WeekService();
export default weekService;

