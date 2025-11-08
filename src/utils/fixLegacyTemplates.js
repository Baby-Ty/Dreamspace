// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

/**
 * One-time migration utility to fix legacy weekly goal templates with missing dreamId
 * 
 * This fixes templates that have dreamTitle but no dreamId by matching them
 * to dreams in the user's dreamBook.
 * 
 * Usage:
 * 1. Import this in your component
 * 2. Call fixLegacyTemplates() once
 * 3. Remove this file after migration is complete
 */

import itemService from '../services/itemService.js';
import { logger } from './logger.js';

/**
 * Fix legacy templates that are missing dreamId
 * @param {string} userId - User ID
 * @param {Array} weeklyGoals - Array of all weekly goals (templates + instances)
 * @param {Array} dreamBook - Array of user's dreams
 * @returns {Promise<{fixed: number, errors: number, total: number}>}
 */
export async function fixLegacyTemplates(userId, weeklyGoals, dreamBook) {
  logger.info('migration', 'Starting legacy template dreamId fix', { userId });
  
  // Find templates with missing dreamId but present dreamTitle
  const templatesNeedingFix = weeklyGoals.filter(g => 
    g.type === 'weekly_goal_template' && 
    !g.dreamId && 
    g.dreamTitle
  );
  
  if (templatesNeedingFix.length === 0) {
    logger.info('migration', 'No templates need fixing', { userId });
    return { fixed: 0, errors: 0, total: 0 };
  }
  
  logger.info('migration', `Found ${templatesNeedingFix.length} templates to fix`, {
    templates: templatesNeedingFix.map(t => ({ id: t.id, title: t.title, dreamTitle: t.dreamTitle }))
  });
  
  let fixedCount = 0;
  let errorCount = 0;
  const fixedTemplates = [];
  
  for (const template of templatesNeedingFix) {
    try {
      // Find matching dream by title
      const dream = dreamBook.find(d => d.title === template.dreamTitle);
      
      if (!dream) {
        logger.warn('migration', `No dream found for template "${template.title}"`, {
          templateId: template.id,
          dreamTitle: template.dreamTitle
        });
        errorCount++;
        continue;
      }
      
      logger.info('migration', `Fixing template "${template.title}"`, {
        templateId: template.id,
        dreamId: dream.id,
        dreamTitle: dream.title
      });
      
      // Update template with dreamId
      const updatedTemplate = {
        ...template,
        dreamId: dream.id,
        updatedAt: new Date().toISOString()
      };
      
      fixedTemplates.push(updatedTemplate);
      fixedCount++;
      
    } catch (error) {
      logger.error('migration', `Failed to fix template "${template.title}"`, {
        templateId: template.id,
        error: error.message
      });
      errorCount++;
    }
  }
  
  // Save all fixed templates in one batch
  if (fixedTemplates.length > 0) {
    logger.info('migration', `Saving ${fixedTemplates.length} fixed templates`, { userId });
    
    // Get all current dreams and templates (including fixed ones)
    const allTemplates = weeklyGoals
      .filter(g => g.type === 'weekly_goal_template')
      .map(t => {
        // Replace old template with fixed version if it exists
        const fixed = fixedTemplates.find(f => f.id === t.id);
        return fixed || t;
      });
    
    const result = await itemService.saveDreams(userId, dreamBook, allTemplates);
    
    if (!result.success) {
      logger.error('migration', 'Failed to save fixed templates', {
        error: result.error,
        userId
      });
      return { fixed: 0, errors: fixedCount, total: templatesNeedingFix.length };
    }
    
    logger.info('migration', 'Successfully saved fixed templates', {
      fixed: fixedCount,
      total: templatesNeedingFix.length
    });
  }
  
  const summary = {
    fixed: fixedCount,
    errors: errorCount,
    total: templatesNeedingFix.length
  };
  
  logger.info('migration', 'Migration complete', summary);
  
  return summary;
}

/**
 * Check if any templates need fixing (without actually fixing them)
 * @param {Array} weeklyGoals - Array of all weekly goals
 * @returns {Array} Templates that need fixing
 */
export function checkLegacyTemplates(weeklyGoals) {
  const templatesNeedingFix = weeklyGoals.filter(g => 
    g.type === 'weekly_goal_template' && 
    !g.dreamId && 
    g.dreamTitle
  );
  
  return templatesNeedingFix;
}

