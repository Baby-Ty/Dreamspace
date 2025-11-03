import { getCurrentIsoWeek, parseIsoWeek } from './dateUtils';

/**
 * Check if a template should be active for a given week
 * @param {Object} template - The goal template
 * @param {string} weekIso - ISO week string (e.g., "2025-W44")
 * @param {Object} milestone - Optional milestone object if template is milestone-based
 * @returns {boolean}
 */
export const isTemplateActiveForWeek = (template, weekIso, milestone = null) => {
  // Check if template is marked inactive
  if (template.active === false) {
    return false;
  }
  
  // Check start date
  if (template.startDate) {
    const startDate = new Date(template.startDate);
    const startWeekIso = getCurrentIsoWeek(startDate);
    
    // Extract week numbers for comparison
    const startWeekNum = parseInt(startWeekIso.split('-W')[1]);
    const currentWeekNum = parseInt(weekIso.split('-W')[1]);
    const startYear = parseInt(startWeekIso.split('-W')[0]);
    const currentYear = parseInt(weekIso.split('-W')[0]);
    
    // Don't show if current week is before start week
    if (currentYear < startYear || (currentYear === startYear && currentWeekNum < startWeekNum)) {
      return false;
    }
  }
  
  // Check duration type
  switch (template.durationType) {
    case 'unlimited':
      return true;
      
    case 'weeks':
      if (!template.durationWeeks || !template.startDate) {
        return true; // Fallback to unlimited if duration not properly set
      }
      
      const startDate = new Date(template.startDate);
      const startWeekIso = getCurrentIsoWeek(startDate);
      const weeksElapsed = getWeeksBetween(startWeekIso, weekIso);
      
      return weeksElapsed < template.durationWeeks;
      
    case 'milestone':
      // Check if linked milestone is complete
      if (milestone && milestone.completed) {
        return false;
      }
      return true;
      
    default:
      return true;
  }
};

/**
 * Calculate weeks between two ISO week strings
 */
function getWeeksBetween(startWeekIso, endWeekIso) {
  const startYear = parseInt(startWeekIso.split('-W')[0]);
  const startWeek = parseInt(startWeekIso.split('-W')[1]);
  const endYear = parseInt(endWeekIso.split('-W')[0]);
  const endWeek = parseInt(endWeekIso.split('-W')[1]);
  
  if (startYear === endYear) {
    return endWeek - startWeek;
  }
  
  // Approximate: 52 weeks per year
  const yearsDiff = endYear - startYear;
  return (yearsDiff * 52) + endWeek - startWeek;
}

/**
 * Auto-deactivate templates that have expired
 */
export const checkAndDeactivateExpiredTemplates = (templates, currentWeekIso, milestones = []) => {
  return templates.map(template => {
    // Find associated milestone if any
    const milestone = template.milestoneId 
      ? milestones.find(m => m.id === template.milestoneId)
      : null;
    
    const isActive = isTemplateActiveForWeek(template, currentWeekIso, milestone);
    
    // If template should not be active, mark it
    if (!isActive && template.active !== false) {
      return { ...template, active: false };
    }
    
    return template;
  });
};


