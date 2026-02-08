/**
 * Shared week rollover logic
 * Can be called from timer OR client trigger
 * Idempotent - safe to run multiple times
 */

const { getCosmosProvider } = require('./cosmosProvider');
const { 
  getCurrentIsoWeek, 
  getWeekRange, 
  getWeeksBetween, 
  getNextWeekId 
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
  
  log(`📋 ${userId}: Processing ${activeTemplates.length} active templates (of ${templates.length} total)`);
  
  // 3. Create instances from templates
  let templateGoalsCreated = 0;
  for (const template of activeTemplates) {
    const dream = dreams.find(d => d.id === template.dreamId);
    const previousInstance = previousGoals.find(g => g.templateId === template.id);
    
    let result;
    if (template.recurrence === 'weekly') {
      result = buildWeeklyGoalInstance(template, dream, weekId, previousInstance);
    } else if (template.recurrence === 'monthly') {
      result = buildMonthlyGoalInstance(template, dream, weekId, previousInstance);
    }
    
    if (result && result.instance && !newGoalIds.has(result.instance.id)) {
      newGoals.push(result.instance);
      newGoalIds.add(result.instance.id);
      templateGoalsCreated++;
      
      // Track template update if weeksRemaining changed
      if (template.weeksRemaining !== result.weeksRemaining) {
        templateUpdates.set(template.id, {
          ...(templateUpdates.get(template.id) || template),
          weeksRemaining: result.weeksRemaining
        });
      }
    }
  }
  
  log(`📋 ${userId}: Created ${templateGoalsCreated} goals from templates`);
  
  // 4. Also add consistency and deadline goals from dreams.goals[]
  // BUT skip goals that already have templates (templates are processed in step 3)
  const dreamGoalUpdates = new Map(); // Track goal updates by dreamId -> goalId
  const templateIds = new Set(templates.map(t => t.id)); // Track template IDs to avoid duplicates
  
  // Counters for summary logging
  let deadlineCount = 0, consistencyCount = 0;
  
  for (const dream of dreams) {
    if (dream.completed) continue;
    
    const allDreamGoals = dream.goals || [];
    
    // Filter deadline goals: must be active, not completed, no existing template
    const deadlineGoals = allDreamGoals.filter(g => 
      g.type === 'deadline' && 
      g.active === true && 
      g.completed !== true && 
      !templateIds.has(g.id)
    );
    
    // Filter consistency goals: must not be completed, no existing template
    const consistencyGoals = allDreamGoals.filter(g => 
      g.type === 'consistency' && 
      !g.completed && 
      !templateIds.has(g.id)
    );
    
    // Process deadline goals
    for (const goal of deadlineGoals) {
      const previousInstance = previousGoals.find(g => g.templateId === goal.id);
      const result = buildDeadlineGoalInstance(goal, dream, weekId, previousInstance);
      
      if (!result) continue;
      
      const { instance, weeksRemaining: newWeeksRemaining, targetWeeks } = result;
      
      // Always update weeksRemaining in dreams container
      if (!dreamGoalUpdates.has(dream.id)) {
        dreamGoalUpdates.set(dream.id, []);
      }
      dreamGoalUpdates.get(dream.id).push({
        ...goal,
        targetWeeks: targetWeeks,
        weeksRemaining: newWeeksRemaining
      });
      
      // Add instance if created and not duplicate
      if (instance && !newGoalIds.has(instance.id)) {
        newGoals.push(instance);
        newGoalIds.add(instance.id);
        deadlineCount++;
      }
    }
    
    // Process consistency goals
    for (const goal of consistencyGoals) {
      if (!goal.recurrence) continue;
      
      const previousInstance = previousGoals.find(g => g.templateId === goal.id);
      let result;
      
      if (goal.recurrence === 'weekly' && goal.targetWeeks) {
        result = buildWeeklyConsistencyGoalInstance(goal, dream, weekId, previousInstance);
      } else if (goal.recurrence === 'monthly' && goal.targetMonths) {
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
        
        // Add instance if created and not duplicate
        if (instance && !newGoalIds.has(instance.id)) {
          newGoals.push(instance);
          newGoalIds.add(instance.id);
          consistencyCount++;
        }
      }
    }
  }
  
  // Summary logging
  if (deadlineCount > 0 || consistencyCount > 0) {
    log(`📋 ${userId}: Added ${deadlineCount} deadline + ${consistencyCount} consistency goals from dreams`);
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
  
  // Build options: don't decrement weeksRemaining for mid-week sync
  const buildOptions = { decrementWeeksRemaining: false };
  
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
  const templateIds = new Set(templates.map(t => t.id));
  
  log(`📋 ${userId}: Found ${dreams.length} dreams and ${templates.length} templates`);
  
  // 3. Find active templates that need instances
  const newInstances = [];
  const activeTemplates = filterActiveTemplates(templates, dreams, context);
  
  for (const template of activeTemplates) {
    const instanceId = `${template.id}_${weekId}`;
    
    // Skip if instance already exists
    if (existingGoalIds.has(instanceId) || existingTemplateIds.has(template.id)) {
      continue;
    }
    
    // Skip if goal is already skipped for this week (don't recreate skipped goals)
    const existingSkippedGoal = existingGoals.find(g => 
      g.templateId === template.id && g.skipped === true
    );
    if (existingSkippedGoal) {
      log(`⏭️ ${userId}: Skipping instance creation for "${template.title}" (already skipped this week)`);
      continue;
    }
    
    const dream = dreams.find(d => d.id === template.dreamId);
    
    // Use builders with decrementWeeksRemaining: false (same week, no decrement)
    let result;
    if (template.recurrence === 'weekly') {
      result = buildWeeklyGoalInstance(template, dream, weekId, null, buildOptions);
    } else if (template.recurrence === 'monthly') {
      result = buildMonthlyGoalInstance(template, dream, weekId, null, buildOptions);
    }
    
    if (result && result.instance) {
      newInstances.push(result.instance);
      log(`✨ ${userId}: Creating instance for template "${template.title}"`);
    }
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
      
      // Skip if goal is already skipped for this week (don't recreate skipped goals)
      const existingSkippedGoal = existingGoals.find(g => 
        g.templateId === goal.id && g.skipped === true
      );
      if (existingSkippedGoal) {
        log(`⏭️ ${userId}: Skipping instance creation for "${goal.title}" (already skipped this week)`);
        continue;
      }
      
      // Handle deadline goals
      if (goal.type === 'deadline' && goal.active === true) {
        const result = buildDeadlineGoalInstance(goal, dream, weekId, null, buildOptions);
        if (result && result.instance) {
          newInstances.push(result.instance);
          log(`✨ ${userId}: Creating instance for deadline goal "${goal.title}"`);
        }
      }
      
      // Handle consistency goals
      if (goal.type === 'consistency' && goal.recurrence) {
        let result;
        if (goal.recurrence === 'weekly') {
          result = buildWeeklyConsistencyGoalInstance(goal, dream, weekId, null, buildOptions);
        } else if (goal.recurrence === 'monthly') {
          result = buildMonthlyConsistencyGoalInstance(goal, dream, weekId, null, buildOptions);
        }
        
        if (result && result.instance) {
          newInstances.push(result.instance);
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

