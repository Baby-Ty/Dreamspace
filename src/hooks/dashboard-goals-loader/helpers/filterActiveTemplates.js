import { monthsToWeeks } from '../../../utils/dateUtils';
import { logger } from '../../../utils/logger';

/**
 * Filter active templates that should be instantiated for the current week
 * 
 * @param {Array} templates - Weekly goal templates
 * @param {Set} existingDreamIds - Set of existing dream IDs
 * @param {Set} existingTemplateIds - Set of template IDs that already have instances
 * @param {Set} existingGoalIds - Set of existing goal IDs
 * @param {Set} skippedTemplateIds - Set of template IDs that are skipped this week
 * @returns {Array} Filtered templates ready for instantiation
 */
export function filterActiveTemplates(templates, existingDreamIds, existingTemplateIds, existingGoalIds, skippedTemplateIds = new Set()) {
  const activeTemplates = [];
  
  for (const template of templates) {
    // Verify dream still exists before creating instance
    if (!existingDreamIds.has(template.dreamId)) {
      logger.warn('filterActiveTemplates', 'Skipping template - dream no longer exists', {
        templateId: template.id,
        dreamId: template.dreamId
      });
      continue;
    }
    
    // Filter out inactive templates
    if (template.active === false) {
      logger.debug('filterActiveTemplates', 'Skipping inactive template', { title: template.title });
      continue;
    }
    
    // Filter out templates with weeksRemaining <= 0
    const templateWeeksRemaining = template.weeksRemaining !== undefined 
      ? template.weeksRemaining 
      : (template.targetWeeks || (template.targetMonths ? monthsToWeeks(template.targetMonths) : undefined));
    
    if (templateWeeksRemaining !== undefined && templateWeeksRemaining < 0) {
      logger.debug('filterActiveTemplates', 'Skipping expired template', {
        title: template.title,
        weeksRemaining: templateWeeksRemaining
      });
      continue;
    }
    
    // Skip templates that are already skipped this week (don't recreate skipped goals)
    if (skippedTemplateIds.has(template.id)) {
      logger.debug('filterActiveTemplates', 'Skipping template - already skipped this week', { title: template.title });
      continue;
    }
    
    // Check if instance already exists (by templateId or by id match)
    const hasInstance = existingTemplateIds.has(template.id) || existingGoalIds.has(template.id);
    
    if (!hasInstance) {
      activeTemplates.push(template);
      logger.debug('filterActiveTemplates', 'Template needs instance', { title: template.title });
    }
  }
  
  return activeTemplates;
}
