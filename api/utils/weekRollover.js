/**
 * Shared week rollover logic
 * Can be called from timer OR client trigger
 * Idempotent - safe to run multiple times
 */

const { getCosmosProvider } = require('./cosmosProvider');
const { 
  getCurrentIsoWeek, 
  parseIsoWeek, 
  getWeekRange, 
  getWeeksBetween, 
  getNextWeekId, 
  getMonthId, 
  monthsToWeeks, 
  getWeeksUntilDate 
} = require('./weekDateUtils');
const { calculateScore } = require('./goalScoring');
const { fetchDreamsWithConsistencyRetry } = require('./cosmosConsistencyHelper');
const {
  buildWeeklyGoalInstance,
  buildMonthlyGoalInstance,
  buildDeadlineGoalInstance,
  buildWeeklyConsistencyGoalInstance,
  buildMonthlyConsistencyGoalInstance
} = require('./goalInstanceBuilder');
const {
  filterActiveTemplates,
  processTemplateUpdates,
  processDreamGoalUpdates
} = require('./goalTemplateProcessor');

/**
 * Perform week rollover for a single user
 * @param {string} userId - User ID
 * @param {object} context - Azure Function context (for logging)
 * @param {boolean} simulate - Force simulation mode (always use nextWeekId, ignore system date)
 * @returns {Promise<{success: boolean, rolled: boolean, message: string}>}
 */
async function rolloverWeekForUser(userId, context = null, simulate = false) {
  const log = context?.log || console.log;
  
  try {
    const cosmosProvider = getCosmosProvider();
    
    // 1. Get current week document
    const currentWeekDoc = await cosmosProvider.getCurrentWeekDocument(userId);
    
    // 2. Check if rollover needed
    if (!currentWeekDoc) {
      log(`ℹ️ ${userId}: No current week document, skipping rollover`);
      return { success: true, rolled: false, message: 'No current week' };
    }
    
    // Determine target week: use system date for real rollover, or next week for simulation
    const systemWeekId = getCurrentIsoWeek();
    const nextWeekId = getNextWeekId(currentWeekDoc.weekId);
    
    // Use next week if simulating OR if system date hasn't changed, otherwise use system date
    const actualWeekId = (simulate || systemWeekId === currentWeekDoc.weekId) ? nextWeekId : systemWeekId;
    
    if (currentWeekDoc.weekId === actualWeekId) {
      log(`✅ ${userId}: Already on current week (${actualWeekId})`);
      return { success: true, rolled: false, message: 'Already current' };
    }
    
    // 3. ROLLOVER NEEDED
    const isSimulated = simulate || systemWeekId === currentWeekDoc.weekId;
    log(`🔄 ${userId}: Rolling over from ${currentWeekDoc.weekId} to ${actualWeekId}${isSimulated ? ' (simulated)' : ''}`);
    
    // Calculate weeks to archive (in case user missed multiple weeks)
    const weeksToArchive = getWeeksBetween(currentWeekDoc.weekId, actualWeekId);
    
    // 4. Archive each missed week
    for (const weekId of weeksToArchive) {
      if (weekId === currentWeekDoc.weekId) {
        // Archive the actual current week with real stats
        const summary = {
          totalGoals: currentWeekDoc.goals?.length || 0,
          completedGoals: currentWeekDoc.goals?.filter(g => g.completed).length || 0,
          skippedGoals: currentWeekDoc.goals?.filter(g => g.skipped).length || 0,
          score: calculateScore(currentWeekDoc.goals || []),
          weekStartDate: currentWeekDoc.weekStartDate,
          weekEndDate: currentWeekDoc.weekEndDate
        };
        
        await cosmosProvider.archiveWeekToPastWeeks(userId, weekId, summary);
        log(`📦 ${userId}: Archived ${weekId} (${summary.completedGoals}/${summary.totalGoals} goals)`);
      } else {
        // Archive missed weeks with empty stats
        const { start, end } = getWeekRange(weekId);
        const summary = {
          totalGoals: 0,
          completedGoals: 0,
          skippedGoals: 0,
          score: 0,
          weekStartDate: start.toISOString().split('T')[0],
          weekEndDate: end.toISOString().split('T')[0]
        };
        
        await cosmosProvider.archiveWeekToPastWeeks(userId, weekId, summary);
        log(`📦 ${userId}: Archived missed week ${weekId}`);
      }
    }
    
    // 5. Check for recently completed deadline goals that might need time to propagate
    // If any deadline goals were completed in the current week, add a delay
    // to allow Cosmos DB eventual consistency to catch up
    const hasCompletedDeadlineGoals = (currentWeekDoc.goals || []).some(g => 
      g.type === 'deadline' && g.completed === true
    );
    
    if (hasCompletedDeadlineGoals) {
      log(`⏳ ${userId}: Detected completed deadline goal(s) in current week - waiting 1000ms for Cosmos DB eventual consistency...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      log(`✅ ${userId}: Delay complete, proceeding with rollover`);
    }
    
    // 6. Create new current week from templates
    const newGoals = await createGoalsFromTemplates(
      userId, 
      actualWeekId, 
      currentWeekDoc.goals, // Pass old goals for monthly persistence
      context
    );
    
    // 6. Save new current week
    await cosmosProvider.upsertCurrentWeek(userId, actualWeekId, newGoals);
    
    log(`✅ ${userId}: Rollover complete! Now on ${actualWeekId} (${newGoals.length} goals)`);
    
    return { 
      success: true, 
      rolled: true, 
      message: `Rolled over ${weeksToArchive.length} week(s)`,
      fromWeek: currentWeekDoc.weekId,
      toWeek: actualWeekId,
      goalsCount: newGoals.length
    };
    
  } catch (error) {
    const logError = context?.log?.error || console.error;
    logError(`❌ ${userId}: Rollover failed:`, error);
    return { 
      success: false, 
      rolled: false, 
      message: error.message 
    };
  }
}

/**
 * Create goals from templates for new week
 */
async function createGoalsFromTemplates(userId, weekId, previousGoals = [], context = null) {
  const cosmosProvider = getCosmosProvider();
  const log = context?.log || console.log;
  
  // 1. Get user's dreams and templates with retry mechanism for eventual consistency
  const { dreams, templates, dreamsDoc } = await fetchDreamsWithConsistencyRetry(
    userId, 
    previousGoals, 
    { maxRetries: 3, context }
  );
  
  if (!dreamsDoc) {
    return [];
  }
  const newGoals = [];
  const newGoalIds = new Set(); // Track goal IDs to prevent duplicates
  const templateUpdates = new Map(); // Track template updates by ID
  
  // 2. Filter active templates
  const activeTemplates = filterActiveTemplates(templates, dreams, context);
  
  log(`📋 ${userId}: Found ${activeTemplates.length} active templates (filtered from ${templates.length} total templates)`);
  
  // Log details about filtered templates for debugging
  if (templates.length > activeTemplates.length) {
    const filteredCount = templates.length - activeTemplates.length;
    log(`📋 ${userId}: Filtered out ${filteredCount} inactive/completed template(s)`);
  }
  
  // 3. Create instances from templates
  for (const template of activeTemplates) {
    const dream = dreams.find(d => d.id === template.dreamId);
    const previousInstance = previousGoals.find(g => g.templateId === template.id);
    
    let result;
    if (template.recurrence === 'weekly') {
      result = buildWeeklyGoalInstance(template, dream, weekId, previousInstance);
    } else if (template.recurrence === 'monthly') {
      result = buildMonthlyGoalInstance(template, dream, weekId, previousInstance);
    }
    
    if (result && result.instance) {
      // Check for duplicate before adding
      if (!newGoalIds.has(result.instance.id)) {
        newGoals.push(result.instance);
        newGoalIds.add(result.instance.id);
        
        // Track template update for next rollover
        if (template.weeksRemaining !== result.weeksRemaining) {
          const existingUpdate = templateUpdates.get(template.id) || template;
          templateUpdates.set(template.id, {
            ...existingUpdate,
            weeksRemaining: result.weeksRemaining
          });
        }
      } else {
        log(`⚠️ ${userId}: Skipping duplicate instance: ${result.instance.id}`);
      }
    }
  }
  
  // 4. Also add consistency and deadline goals from dreams.goals[]
  // BUT skip goals that already have templates (templates are processed in step 3)
  const dreamGoalUpdates = new Map(); // Track goal updates by dreamId -> goalId
  const templateIds = new Set(templates.map(t => t.id)); // Track template IDs to avoid duplicates
  
  log(`📋 ${userId}: Processing ${dreams.length} dream(s) for consistency/deadline goals`);
  log(`📋 ${userId}: Found ${templateIds.size} template(s) - will skip goals that match template IDs`);
  
  for (const dream of dreams) {
    if (dream.completed) {
      log(`⏭️ ${userId}: Skipping completed dream "${dream.title}"`);
      continue;
    }
    
    const allDreamGoals = dream.goals || [];
    log(`🔍 ${userId}: Dream "${dream.title}" has ${allDreamGoals.length} goal(s)`);
    
    // Log all goals for debugging
    allDreamGoals.forEach(g => {
      log(`   📋 Goal: "${g.title}" (type: ${g.type}, active: ${g.active}, completed: ${g.completed}, id: ${g.id})`);
    });
    
    // Separate deadline goals (skip if completed or inactive)
    // IMPORTANT: Check both completed flag and active flag (including undefined/null)
    const deadlineGoals = allDreamGoals.filter(g => {
      if (g.type !== 'deadline') return false;
      
      // Skip if completed
      if (g.completed === true) {
        log(`   ⏭️ Skipping deadline goal "${g.title}" (${g.id}) - completed: true`);
        return false;
      }
      
      // Skip if not explicitly active (only process if active === true)
      // For deadline goals, we only want to process if active is explicitly true
      // This catches false, undefined, null, or any other falsy value
      if (g.active !== true) {
        log(`   ⏭️ Skipping deadline goal "${g.title}" (${g.id}) - not active (active: ${g.active}, type: ${typeof g.active})`);
        return false;
      }
      
      if (templateIds.has(g.id)) {
        log(`   ⏭️ Skipping deadline goal "${g.title}" (${g.id}) - already has template`);
        return false;
      }
      log(`   ✅ Including deadline goal "${g.title}" (${g.id}) - active: ${g.active}, completed: ${g.completed}`);
      return true;
    });
    
    log(`📋 ${userId}: Found ${deadlineGoals.length} active deadline goal(s) in "${dream.title}" (after filtering)`);
    
    const dreamGoals = allDreamGoals.filter(g => {
      // For consistency goals, skip if completed
      if (g.type === 'consistency' && g.completed) {
        log(`   ⏭️ Skipping completed consistency goal: "${g.title}"`);
        return false;
      }
      // For deadline goals, we'll process them separately (they need weeksRemaining update even if completed)
      if (g.type === 'deadline') {
        return false; // Processed separately above
      }
      if (g.type !== 'consistency' && g.type !== 'deadline') {
        log(`   ⏭️ Skipping goal type "${g.type}": "${g.title}"`);
        return false;
      }
      // Skip if this goal already has a template (template was processed in step 3)
      if (templateIds.has(g.id)) {
        log(`   ⏭️ Skipping goal "${g.title}" - already has template (will be created from template)`);
        return false;
      }
      log(`   ✅ Processing goal: "${g.title}" (type: ${g.type}, recurrence: ${g.recurrence})`);
      return true;
    });
    
    // Process deadline goals like consistency goals (decrement weeksRemaining, don't recalculate)
    for (const goal of deadlineGoals) {
      const previousInstance = previousGoals.find(g => g.templateId === goal.id);
      const result = buildDeadlineGoalInstance(goal, dream, weekId, previousInstance);
      
      if (!result) {
        log(`⚠️ ${userId}: Skipping deadline goal "${goal.title}" - no targetWeeks or targetDate`);
        continue;
      }
      
      const { instance, weeksRemaining: newWeeksRemaining, targetWeeks } = result;
      
      log(`📅 ${userId}: Processing deadline goal "${goal.title}" (targetWeeks: ${targetWeeks}, new weeksRemaining: ${newWeeksRemaining})`);
      
      // Always update weeksRemaining in dreams container (even if completed)
      if (!dreamGoalUpdates.has(dream.id)) {
        dreamGoalUpdates.set(dream.id, []);
      }
      dreamGoalUpdates.get(dream.id).push({
        ...goal,
        targetWeeks: targetWeeks, // Ensure targetWeeks is set
        weeksRemaining: newWeeksRemaining
      });
      
      log(`✅ ${userId}: Queued deadline goal "${goal.title}" update: weeksRemaining → ${newWeeksRemaining}${goal.completed ? ' (completed)' : ''}`);
      
      // Add instance if created
      if (instance) {
        if (!newGoalIds.has(instance.id)) {
          newGoals.push(instance);
          newGoalIds.add(instance.id);
          log(`✨ ${userId}: Added deadline goal "${goal.title}" (${newWeeksRemaining} weeks remaining)`);
        } else {
          log(`⚠️ ${userId}: Skipping duplicate deadline goal instance: ${instance.id}`);
        }
      } else {
        if (goal.completed) {
          log(`⏭️ ${userId}: Skipping completed deadline goal "${goal.title}" (weeksRemaining updated to ${newWeeksRemaining})`);
        } else if (goal.active === false) {
          log(`⏭️ ${userId}: Skipping inactive deadline goal "${goal.title}" (weeksRemaining: ${newWeeksRemaining})`);
        } else {
          log(`⏭️ ${userId}: Skipping past deadline goal "${goal.title}" (weeksRemaining: ${newWeeksRemaining})`);
        }
      }
    }
    
    log(`📋 ${userId}: Found ${dreamGoals.length} active consistency/deadline goal(s) in "${dream.title}" (after filtering templates)`);
    
    // Process consistency goals (deadline goals already processed above)
    for (const goal of dreamGoals) {
      if (goal.type === 'consistency' && goal.recurrence) {
        const previousInstance = previousGoals.find(g => g.templateId === goal.id);
        let result;
        
        if (goal.recurrence === 'weekly' && goal.targetWeeks) {
          log(`   📅 Processing weekly consistency goal: "${goal.title}"`);
          result = buildWeeklyConsistencyGoalInstance(goal, dream, weekId, previousInstance);
        } else if (goal.recurrence === 'monthly' && goal.targetMonths) {
          log(`   📅 Processing monthly consistency goal: "${goal.title}"`);
          result = buildMonthlyConsistencyGoalInstance(goal, dream, weekId, previousInstance);
        }
        
        if (result) {
          const { instance, weeksRemaining: newWeeksRemaining } = result;
          
          // Track goal update for saving back to dreams container
          if (!dreamGoalUpdates.has(dream.id)) {
            dreamGoalUpdates.set(dream.id, []);
          }
          dreamGoalUpdates.get(dream.id).push({
            ...goal,
            weeksRemaining: newWeeksRemaining
          });
          
          if (instance) {
            // Check for duplicate before adding
            if (!newGoalIds.has(instance.id)) {
              newGoals.push(instance);
              newGoalIds.add(instance.id);
              log(`✨ ${userId}: Added consistency goal "${goal.title}" (${newWeeksRemaining} weeks remaining)`);
            } else {
              log(`⚠️ ${userId}: Skipping duplicate consistency goal instance: ${instance.id}`);
            }
          } else {
            log(`⏭️ ${userId}: Skipping completed consistency goal "${goal.title}" (weeksRemaining: ${newWeeksRemaining}) - will mark inactive`);
          }
        }
      }
    }
  }
  
  // Save updated templates back to Cosmos DB if any were modified
  await processTemplateUpdates(userId, templates, templateUpdates, dreamsDoc, context);
  
  // Save updated goals from dream.goals[] back to Cosmos DB if any were modified
  await processDreamGoalUpdates(userId, dreams, dreamGoalUpdates, dreamsDoc, context);
  
  return newGoals;
}

/**
 * Create missing goal instances for the current week
 * 
 * This is a lighter version of createGoalsFromTemplates that:
 * - Does NOT decrement weeksRemaining (same week, just missing instance)
 * - Does NOT need previousInstance logic (not crossing weeks)
 * - Only creates instances for templates/goals that don't have one yet
 * 
 * Used by syncCurrentWeek endpoint when user creates new templates/goals mid-week
 * 
 * @param {string} userId - User ID
 * @param {string} weekId - Current ISO week string
 * @param {object} currentWeekDoc - Existing current week document (may be null)
 * @param {object} context - Azure Function context (for logging)
 * @returns {Promise<{weekId: string, goals: Array, created: number, stats: object}>}
 */
async function createMissingGoalInstances(userId, weekId, currentWeekDoc = null, context = null) {
  const cosmosProvider = getCosmosProvider();
  const log = context?.log || console.log;
  
  log(`📋 ${userId}: Creating missing goal instances for ${weekId}`);
  
  // 1. Get existing goals (or empty array if no doc)
  const existingGoals = currentWeekDoc?.goals || [];
  const existingGoalIds = new Set(existingGoals.map(g => g.id));
  const existingTemplateIds = new Set(existingGoals.map(g => g.templateId).filter(Boolean));
  
  log(`📋 ${userId}: Found ${existingGoals.length} existing goals`);
  
  // 2. Get user's dreams and templates
  const dreamsDoc = await cosmosProvider.getDreamsDocument(userId);
  if (!dreamsDoc) {
    log(`ℹ️ ${userId}: No dreams document found`);
    return { 
      weekId, 
      goals: existingGoals, 
      created: 0,
      stats: { totalGoals: existingGoals.length, completedGoals: 0, score: 0 }
    };
  }
  
  const dreams = dreamsDoc.dreamBook || dreamsDoc.dreams || [];
  const templates = dreamsDoc.weeklyGoalTemplates || [];
  
  log(`📋 ${userId}: Found ${dreams.length} dreams and ${templates.length} templates`);
  
  // 3. Find active templates that need instances
  const newInstances = [];
  const templateIds = new Set(templates.map(t => t.id));
  
  // Filter active templates
  const activeTemplates = filterActiveTemplates(templates, dreams, context);
  
  for (const template of activeTemplates) {
    const instanceId = `${template.id}_${weekId}`;
    
    // Skip if instance already exists
    if (existingGoalIds.has(instanceId) || existingTemplateIds.has(template.id)) {
      continue;
    }
    
    const dream = dreams.find(d => d.id === template.dreamId);
    
    // Create instance WITHOUT decrementing weeksRemaining (same week)
    // Use the template's current weeksRemaining value directly
    const instance = {
      id: instanceId,
      templateId: template.id,
      type: template.recurrence === 'monthly' ? 'monthly_goal' : 'weekly_goal',
      title: template.title,
      description: template.description || '',
      dreamId: template.dreamId,
      dreamTitle: dream?.title || template.dreamTitle || '',
      dreamCategory: dream?.category || template.dreamCategory || '',
      recurrence: template.recurrence,
      completed: false,
      completedAt: null,
      skipped: false,
      weekId: weekId,
      createdAt: new Date().toISOString(),
      targetWeeks: template.targetWeeks,
      weeksRemaining: template.weeksRemaining !== undefined 
        ? template.weeksRemaining 
        : (template.targetWeeks || (template.targetMonths ? monthsToWeeks(template.targetMonths) : undefined)),
      frequency: template.frequency || (template.recurrence === 'monthly' ? 2 : 1),
      completionCount: 0,
      completionDates: [],
    };
    
    // Add monthId for monthly goals
    if (template.recurrence === 'monthly') {
      instance.monthId = getMonthId(weekId);
      instance.targetMonths = template.targetMonths;
    }
    
    newInstances.push(instance);
    log(`✨ ${userId}: Creating instance for template "${template.title}"`);
  }
  
  // 4. Find active dream goals (deadline and consistency) that need instances
  for (const dream of dreams) {
    if (dream.completed) continue;
    
    for (const goal of (dream.goals || [])) {
      // Skip completed or inactive goals
      if (goal.completed || goal.active === false) continue;
      
      // Skip goals that already have templates (processed above)
      if (templateIds.has(goal.id)) continue;
      
      const instanceId = `${goal.id}_${weekId}`;
      
      // Skip if instance already exists
      if (existingGoalIds.has(instanceId) || existingTemplateIds.has(goal.id)) continue;
      
      // Handle deadline goals
      if (goal.type === 'deadline' && goal.active === true) {
        const weeksRemaining = goal.weeksRemaining !== undefined 
          ? goal.weeksRemaining 
          : (goal.targetWeeks !== undefined 
              ? goal.targetWeeks 
              : (goal.targetDate ? getWeeksUntilDate(goal.targetDate, weekId) : -1));
        
        // Only create if deadline hasn't passed
        if (weeksRemaining >= 0) {
          const instance = {
            id: instanceId,
            templateId: goal.id,
            type: 'deadline',
            title: goal.title,
            description: goal.description || '',
            dreamId: dream.id,
            dreamTitle: dream.title,
            dreamCategory: dream.category,
            targetWeeks: goal.targetWeeks || weeksRemaining,
            targetDate: goal.targetDate,
            weeksRemaining: weeksRemaining,
            completed: false,
            completedAt: null,
            skipped: false,
            weekId: weekId,
            createdAt: new Date().toISOString()
          };
          newInstances.push(instance);
          log(`✨ ${userId}: Creating instance for deadline goal "${goal.title}"`);
        }
      }
      
      // Handle consistency goals
      if (goal.type === 'consistency' && goal.recurrence) {
        const weeksRemaining = goal.weeksRemaining !== undefined 
          ? goal.weeksRemaining 
          : (goal.targetWeeks || (goal.targetMonths ? monthsToWeeks(goal.targetMonths) : undefined));
        
        // Only create if not expired
        if (weeksRemaining === undefined || weeksRemaining >= 0) {
          const instance = {
            id: instanceId,
            templateId: goal.id,
            type: goal.recurrence === 'monthly' ? 'monthly_goal' : 'weekly_goal',
            title: goal.title,
            description: goal.description || '',
            dreamId: dream.id,
            dreamTitle: dream.title,
            dreamCategory: dream.category,
            recurrence: goal.recurrence,
            targetWeeks: goal.targetWeeks || (goal.targetMonths ? monthsToWeeks(goal.targetMonths) : undefined),
            targetMonths: goal.targetMonths,
            weeksRemaining: weeksRemaining,
            frequency: goal.frequency || (goal.recurrence === 'monthly' ? 2 : 1),
            completionCount: 0,
            completionDates: [],
            completed: false,
            completedAt: null,
            skipped: false,
            weekId: weekId,
            createdAt: new Date().toISOString()
          };
          
          if (goal.recurrence === 'monthly') {
            instance.monthId = getMonthId(weekId);
          }
          
          newInstances.push(instance);
          log(`✨ ${userId}: Creating instance for consistency goal "${goal.title}"`);
        }
      }
    }
  }
  
  // 5. Combine existing and new goals
  const allGoals = [...existingGoals, ...newInstances];
  
  // 6. Save if we created new instances
  if (newInstances.length > 0) {
    log(`💾 ${userId}: Saving ${newInstances.length} new instance(s)`);
    await cosmosProvider.upsertCurrentWeek(userId, weekId, allGoals);
  }
  
  // 7. Calculate stats
  const stats = {
    totalGoals: allGoals.length,
    completedGoals: allGoals.filter(g => g.completed).length,
    skippedGoals: allGoals.filter(g => g.skipped).length,
    score: calculateScore(allGoals)
  };
  
  log(`✅ ${userId}: Sync complete. ${newInstances.length} new, ${allGoals.length} total goals`);
  
  return { 
    weekId, 
    goals: allGoals, 
    created: newInstances.length,
    stats 
  };
}

module.exports = {
  rolloverWeekForUser,
  createGoalsFromTemplates,
  createMissingGoalInstances
};

