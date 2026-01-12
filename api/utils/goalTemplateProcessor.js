/**
 * Goal Template Processor
 * 
 * Handles filtering of active templates and updating template/goal state
 * in the dreams document after rollover processing.
 */

const { getCosmosProvider } = require('./cosmosProvider');
const { monthsToWeeks } = require('./weekDateUtils');

/**
 * Filter templates to find those that should create instances this week
 * @param {Array} templates - All templates
 * @param {Array} dreams - All dreams
 * @param {object} context - Azure Function context (for logging)
 * @returns {Array} Active templates that should create instances
 */
function filterActiveTemplates(templates, dreams, context = null) {
  const log = context?.log || console.log;
  
  const activeTemplates = templates.filter(t => {
    // Skip if not active
    if (t.active === false) {
      log(`   ⏭️ Skipping template "${t.title}" - inactive`);
      return false;
    }
    
    // Skip if template is completed (for deadline goals)
    if (t.completed === true) {
      log(`   ⏭️ Skipping template "${t.title}" - completed`);
      return false;
    }
    
    // Skip if dream is completed
    const dream = dreams.find(d => d.id === t.dreamId);
    if (dream?.completed) {
      log(`   ⏭️ Skipping template "${t.title}" - dream completed`);
      return false;
    }
    
    // CRITICAL: Also check the corresponding goal in dreams.goals[] for deadline goals
    // This ensures we're using the most up-to-date state even if template is stale
    if (t.goalType === 'deadline' || t.type === 'deadline') {
      const goal = dream?.goals?.find(g => g.id === t.id || g.id === t.goalId);
      if (goal && goal.type === 'deadline') {
        // If the goal in dreams.goals[] is completed or inactive, skip the template
        if (goal.completed === true) {
          log(`   ⏭️ Skipping template "${t.title}" - corresponding goal in dreams.goals[] is completed`);
          return false;
        }
        if (goal.active === false || goal.active === undefined || goal.active === null) {
          log(`   ⏭️ Skipping template "${t.title}" - corresponding goal in dreams.goals[] is inactive (active: ${goal.active})`);
          return false;
        }
      }
    }
    
    // Skip if duration expired (monthly goals now tracked in weeks)
    if (t.recurrence === 'weekly' && t.weeksRemaining !== undefined && t.weeksRemaining <= 0) {
      return false;
    }
    if (t.recurrence === 'monthly') {
      // Check weeksRemaining if available, otherwise convert from targetMonths
      const weeksRemaining = t.weeksRemaining !== undefined
        ? t.weeksRemaining
        : (t.targetWeeks || (t.targetMonths ? monthsToWeeks(t.targetMonths) : undefined));
      if (weeksRemaining !== undefined && weeksRemaining <= 0) {
        return false;
      }
    }
    
    return true;
  });
  
  return activeTemplates;
}

/**
 * Process template updates and save back to Cosmos DB
 * @param {string} userId - User ID
 * @param {Array} templates - Original templates array
 * @param {Map} templateUpdates - Map of template ID to updated template
 * @param {object} dreamsDoc - Original dreams document
 * @param {object} context - Azure Function context (for logging)
 * @returns {Promise<void>}
 */
async function processTemplateUpdates(userId, templates, templateUpdates, dreamsDoc, context = null) {
  const log = context?.log || console.log;
  const cosmosProvider = getCosmosProvider();
  
  if (templateUpdates.size === 0) {
    return; // Nothing to update
  }
  
  log(`💾 ${userId}: Updating ${templateUpdates.size} template(s) with new weeksRemaining/monthsRemaining values`);
  
  try {
    // Build updated templates array (apply updates, keep others unchanged)
    const updatedTemplates = templates.map(template => {
      const update = templateUpdates.get(template.id);
      if (update) {
        // Mark template as inactive when weeksRemaining goes negative (after final week)
        // This prevents new instances from being created in future weeks
        const newWeeksRemaining = update.weeksRemaining !== undefined ? update.weeksRemaining : template.weeksRemaining;
        const shouldMarkInactive = newWeeksRemaining < 0 && !template.completed;
        if (shouldMarkInactive) {
          log(`   🔒 Marking template "${template.title}" as inactive (weeksRemaining: ${newWeeksRemaining})`);
          return { 
            ...template, 
            ...update, 
            active: false,
            completedAt: new Date().toISOString()
          };
        }
        return update;
      }
      return template;
    });
    
    // Update dreams document with new template values
    const updatedDreamsDoc = {
      ...dreamsDoc,
      weeklyGoalTemplates: updatedTemplates,
      updatedAt: new Date().toISOString()
    };
    await cosmosProvider.upsertDreamsDocument(userId, updatedDreamsDoc);
    log(`✅ ${userId}: Templates updated in Cosmos DB`);
  } catch (error) {
    log(`⚠️ ${userId}: Failed to update templates (non-critical):`, error.message);
    // Non-critical - continue with rollover even if template update fails
  }
}

/**
 * Process dream goal updates and save back to Cosmos DB
 * @param {string} userId - User ID
 * @param {Array} dreams - Original dreams array
 * @param {Map} dreamGoalUpdates - Map of dream ID to array of updated goals
 * @param {object} dreamsDoc - Original dreams document
 * @param {object} context - Azure Function context (for logging)
 * @returns {Promise<void>}
 */
async function processDreamGoalUpdates(userId, dreams, dreamGoalUpdates, dreamsDoc, context = null) {
  const log = context?.log || console.log;
  const cosmosProvider = getCosmosProvider();
  
  if (dreamGoalUpdates.size === 0) {
    return; // Nothing to update
  }
  
  log(`💾 ${userId}: Updating ${dreamGoalUpdates.size} dream(s) with new goal weeksRemaining/monthsRemaining values`);
  
  try {
    // Build updated dreams array (apply goal updates, keep other goals unchanged)
    const updatedDreams = dreams.map(dream => {
      const goalUpdates = dreamGoalUpdates.get(dream.id);
      if (!goalUpdates || goalUpdates.length === 0) {
        return dream;
      }
      
      // Update goals in this dream
      const updatedGoals = (dream.goals || []).map(goal => {
        const update = goalUpdates.find(u => u.id === goal.id);
        if (update) {
          const oldWeeksRemaining = goal.weeksRemaining;
          const newWeeksRemaining = update.weeksRemaining;
          log(`   🔄 Updating goal "${goal.title}" (${goal.id}): weeksRemaining ${oldWeeksRemaining} → ${newWeeksRemaining}`);
          
          // Mark goal as inactive when weeksRemaining goes negative (after final week)
          // This prevents the goal from appearing in future weeks
          const shouldMarkInactive = newWeeksRemaining < 0 && !goal.completed;
          if (shouldMarkInactive) {
            log(`   🔒 Marking goal "${goal.title}" as inactive (weeksRemaining: ${newWeeksRemaining})`);
            return { 
              ...goal, 
              ...update, 
              active: false,
              completedAt: new Date().toISOString()
            };
          }
          
          // Merge update to preserve any other fields that might have changed
          return { ...goal, ...update };
        }
        return goal;
      });
      
      // Also add any new goals that weren't in the original array (shouldn't happen, but safety check)
      const existingGoalIds = new Set((dream.goals || []).map(g => g.id));
      const newGoalsToAdd = goalUpdates.filter(u => !existingGoalIds.has(u.id));
      if (newGoalsToAdd.length > 0) {
        log(`   ⚠️ Found ${newGoalsToAdd.length} goal(s) in updates that weren't in original dream - this shouldn't happen`);
        updatedGoals.push(...newGoalsToAdd);
      }
      
      log(`   📝 Dream "${dream.title}": Updated ${goalUpdates.length} goal(s) out of ${dream.goals?.length || 0} total`);
      
      return {
        ...dream,
        goals: updatedGoals
      };
    });
    
    // Update dreams document with new goal values
    // Use the same field name as the original document (dreams or dreamBook)
    const dreamsFieldName = dreamsDoc.dreamBook ? 'dreamBook' : 'dreams';
    
    // Verify updates were applied
    for (const dream of updatedDreams) {
      const goalUpdates = dreamGoalUpdates.get(dream.id);
      if (goalUpdates && goalUpdates.length > 0) {
        for (const update of goalUpdates) {
          const updatedGoal = dream.goals?.find(g => g.id === update.id);
          if (updatedGoal && updatedGoal.weeksRemaining !== update.weeksRemaining) {
            log(`   ⚠️ WARNING: Goal "${update.title}" (${update.id}) weeksRemaining mismatch: expected ${update.weeksRemaining}, got ${updatedGoal.weeksRemaining}`);
          }
        }
      }
    }
    
    const updatedDreamsDoc = {
      ...dreamsDoc,
      [dreamsFieldName]: updatedDreams,
      updatedAt: new Date().toISOString()
    };
    await cosmosProvider.upsertDreamsDocument(userId, updatedDreamsDoc);
    log(`✅ ${userId}: Dream goals updated in Cosmos DB (${dreamGoalUpdates.size} dream(s) with updated goals)`);
  } catch (error) {
    log(`⚠️ ${userId}: Failed to update dream goals (non-critical):`, error.message);
    // Non-critical - continue with rollover even if goal update fails
  }
}

module.exports = {
  filterActiveTemplates,
  processTemplateUpdates,
  processDreamGoalUpdates
};
