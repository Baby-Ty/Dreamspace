import { buildInstanceFromTemplate } from '../../../utils/goalInstanceBuilder';
import { logger } from '../../../utils/logger';

/**
 * Create goal instances from active templates
 * 
 * @param {Array} templates - Filtered active templates
 * @param {string} currentWeekIso - Current ISO week string
 * @returns {Array} New goal instances
 */
export function createTemplateInstances(templates, currentWeekIso) {
  const newInstances = [];
  
  for (const template of templates) {
    // Create instance for current week using centralized builder
    const instance = buildInstanceFromTemplate(template, currentWeekIso);
    newInstances.push(instance);
    logger.debug('createTemplateInstances', 'Auto-creating instance from template', { 
      title: template.title 
    });
  }
  
  return newInstances;
}
