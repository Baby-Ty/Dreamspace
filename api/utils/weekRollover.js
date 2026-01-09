/**
 * Shared week rollover logic
 * Can be called from timer OR client trigger
 * Idempotent - safe to run multiple times
 */

const { getCosmosProvider } = require('./cosmosProvider');

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
  // Cosmos DB has eventual consistency, so we may need to retry if we detect stale data
  let dreamsDoc = await cosmosProvider.getDreamsDocument(userId);
  if (!dreamsDoc) {
    log(`⚠️ ${userId}: No dreams document found`);
    return [];
  }
  
  // Check if we need to retry due to potential stale data (Cosmos DB eventual consistency)
  // IMPROVED: Check ALL deadline goals in dreams document, not just those in previousGoals
  // This catches cases where goals were just completed but weren't in the previous week
  let dreams = dreamsDoc.dreamBook || dreamsDoc.dreams || [];
  let retryCount = 0;
  const maxRetries = 3; // Increased from 2 to 3 for better reliability
  
  // Check if previousGoals contains completed deadline goals (indicates recent completion)
  // This is a signal that we should verify all deadline goals are consistent
  const hasCompletedDeadlinesInPreviousWeek = previousGoals.some(g => 
    g.type === 'deadline' && g.completed === true
  );
  
  // Note: We don't check dreams document for completed goals here because that would always trigger
  // if there are old completed goals. Instead, we rely on the check in the retry loop below
  // which only triggers if we had completed goals in previous week (indicating recent activity)
  
  while (retryCount <= maxRetries) {
    let hasStaleData = false;
    let staleGoalDetails = null;
    
    // Check 1: Previous week's completed goals (original check)
    const previousWeekStale = previousGoals.some(g => {
      if (g.type === 'deadline' && g.completed && g.templateId) {
        // Find the corresponding goal in the dreams document
        for (const dream of dreams) {
          const goal = dream.goals?.find(dg => dg.id === g.templateId);
          if (goal && goal.type === 'deadline') {
            // If the goal was completed in previous week but dreams document shows it as NOT completed or still active,
            // we have stale data (both conditions must be false for stale data)
            if (!goal.completed || goal.active !== false) {
              staleGoalDetails = `deadline goal "${goal.title}" (${goal.id}) was completed in previous week but dreams document shows active: ${goal.active}, completed: ${goal.completed}`;
              return true;
            }
          }
        }
      }
      return false;
    });
    
    // Check 2: If previous week had completed deadline goals, ALWAYS retry to wait for eventual consistency
    // This is critical because Cosmos DB may have stale data where goals still appear active
    // even though they were just completed. We must wait for the update to propagate.
    if (!previousWeekStale && hasCompletedDeadlinesInPreviousWeek && retryCount === 0) {
      // On first attempt, if previous week had completed deadline goals, ALWAYS wait
      // This ensures eventual consistency has caught up, even if dreams document still shows stale data
      staleGoalDetails = `Previous week had completed deadline goal(s) - waiting for Cosmos DB eventual consistency to ensure dreams document is up-to-date`;
      hasStaleData = true;
    } else if (previousWeekStale) {
      hasStaleData = true;
    }
    
    // If no stale data detected, break out of retry loop
    if (!hasStaleData) {
      if (retryCount > 0) {
        log(`✅ ${userId}: Dreams document is now consistent after ${retryCount} retry(ies)`);
      }
      break;
    }
    
    // Log stale data detection
    if (staleGoalDetails) {
      log(`⚠️ ${userId}: Detected stale data (attempt ${retryCount + 1}/${maxRetries + 1}) - ${staleGoalDetails}`);
    }
    
    // If we've hit max retries, log warning but continue
    if (retryCount >= maxRetries) {
      log(`⚠️ ${userId}: Max retries reached - proceeding with potentially stale data (goal may appear incorrectly)`);
      break;
    }
    
    // Wait with exponential backoff: 800ms, 1600ms, 3200ms
    const delayMs = 800 * Math.pow(2, retryCount);
    log(`⏳ ${userId}: Waiting ${delayMs}ms for Cosmos DB eventual consistency (retry ${retryCount + 1}/${maxRetries}), then retrying...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // Re-read dreams document
    dreamsDoc = await cosmosProvider.getDreamsDocument(userId);
    if (!dreamsDoc) {
      log(`⚠️ ${userId}: No dreams document found on retry ${retryCount + 1}`);
      break;
    }
    dreams = dreamsDoc.dreamBook || dreamsDoc.dreams || [];
    retryCount++;
  }
  
  // After retries, verify that completed deadline goals from previous week are reflected in dreams document
  // This is a final check to ensure we don't create instances for goals that should be skipped
  const completedDeadlineGoalIds = new Set(
    previousGoals
      .filter(g => g.type === 'deadline' && g.completed === true)
      .map(g => g.templateId || g.id)
  );
  
  if (completedDeadlineGoalIds.size > 0) {
    log(`🔍 ${userId}: Verifying ${completedDeadlineGoalIds.size} completed deadline goal(s) are reflected in dreams document...`);
    for (const dream of dreams) {
      if (dream.completed) continue;
      const deadlineGoals = dream.goals?.filter(g => g.type === 'deadline') || [];
      for (const goal of deadlineGoals) {
        const goalId = goal.id;
        if (completedDeadlineGoalIds.has(goalId)) {
          if (goal.completed !== true || goal.active !== false) {
            log(`⚠️ ${userId}: WARNING - Completed deadline goal "${goal.title}" (${goalId}) still shows as active: ${goal.active}, completed: ${goal.completed} in dreams document. This may cause the goal to appear incorrectly.`);
          } else {
            log(`✅ ${userId}: Verified completed deadline goal "${goal.title}" (${goalId}) is correctly marked as completed/inactive`);
          }
        }
      }
    }
  }
  
  const templates = dreamsDoc.weeklyGoalTemplates || [];
  const newGoals = [];
  const newGoalIds = new Set(); // Track goal IDs to prevent duplicates
  const templateUpdates = new Map(); // Track template updates by ID
  
  // 2. Filter active templates
  // IMPORTANT: Also check the corresponding goal in dreams.goals[] to ensure consistency
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
  
  log(`📋 ${userId}: Found ${activeTemplates.length} active templates (filtered from ${templates.length} total templates)`);
  
  // Log details about filtered templates for debugging
  if (templates.length > activeTemplates.length) {
    const filteredCount = templates.length - activeTemplates.length;
    log(`📋 ${userId}: Filtered out ${filteredCount} inactive/completed template(s)`);
  }
  
  // 3. Create instances from templates
  for (const template of activeTemplates) {
    const dream = dreams.find(d => d.id === template.dreamId);
    
    // Find previous week's instance (for monthly goals)
    const previousInstance = previousGoals.find(g => g.templateId === template.id);
    const currentMonthId = getMonthId(weekId);
    const previousMonthId = previousInstance?.weekId ? getMonthId(previousInstance.weekId) : null;
    const isSameMonth = currentMonthId === previousMonthId;
    
    const instance = {
      id: `${template.id}_${weekId}`,
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
      createdAt: new Date().toISOString()
    };
    
    // Handle weekly goals
    if (template.recurrence === 'weekly') {
      // Decrement counter if previous goal wasn't skipped
      const wasSkipped = previousInstance?.skipped || false;
      
      instance.targetWeeks = template.targetWeeks;
      const newWeeksRemaining = wasSkipped 
        ? template.weeksRemaining // Don't decrement if skipped
        : Math.max(0, (template.weeksRemaining || template.targetWeeks || 0) - 1);
      
      instance.weeksRemaining = newWeeksRemaining;
      
      // Handle frequency-based weekly goals (completion count resets each week)
      instance.frequency = template.frequency || 1; // Copy frequency from template (default to 1 if not set)
      // Reset completion count each week (unlike monthly which carries forward)
      instance.completionCount = 0;
      instance.completionDates = [];
      instance.completed = false;
      
      // Track template update for next rollover
      if (template.weeksRemaining !== newWeeksRemaining) {
        templateUpdates.set(template.id, {
          ...template,
          weeksRemaining: newWeeksRemaining
        });
      }
    }
    
    // Handle monthly goals (now tracked in weeks)
    if (template.recurrence === 'monthly') {
      instance.frequency = template.frequency || 2;
      instance.monthId = currentMonthId;
      
      // Carry forward counter if same month
      if (isSameMonth && previousInstance) {
        instance.completionCount = previousInstance.completionCount || 0;
        instance.completionDates = previousInstance.completionDates || [];
        // Ensure completed flag is set correctly based on completionCount
        const frequency = template.frequency || 2;
        instance.completed = (instance.completionCount >= frequency) || previousInstance.completed || false;
      } else {
        // New month - reset
        instance.completionCount = 0;
        instance.completionDates = [];
        instance.completed = false;
      }
      
      // Convert months to weeks for unified tracking
      // Initialize weeksRemaining if missing (convert from targetMonths)
      const currentWeeksRemaining = template.weeksRemaining !== undefined
        ? template.weeksRemaining
        : (template.targetWeeks || (template.targetMonths ? monthsToWeeks(template.targetMonths) : 0));
      
      // Decrement weeks remaining weekly (not monthly)
      const wasSkipped = previousInstance?.skipped || false;
      const newWeeksRemaining = wasSkipped
        ? currentWeeksRemaining
        : Math.max(0, currentWeeksRemaining - 1);
      
      instance.weeksRemaining = newWeeksRemaining;
      instance.targetWeeks = template.targetWeeks || (template.targetMonths ? monthsToWeeks(template.targetMonths) : undefined);
      instance.targetMonths = template.targetMonths; // Keep for display
      
      // Track template update for next rollover
      if (template.weeksRemaining !== newWeeksRemaining) {
        const existingUpdate = templateUpdates.get(template.id) || template;
        templateUpdates.set(template.id, {
          ...existingUpdate,
          weeksRemaining: newWeeksRemaining
        });
      }
    }
    
    // Check for duplicate before adding
    if (!newGoalIds.has(instance.id)) {
      newGoals.push(instance);
      newGoalIds.add(instance.id);
    } else {
      log(`⚠️ ${userId}: Skipping duplicate instance: ${instance.id}`);
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
      // Use targetWeeks if available, otherwise calculate from targetDate (backward compatibility)
      const targetWeeks = goal.targetWeeks !== undefined
        ? goal.targetWeeks
        : (goal.targetDate ? getWeeksUntilDate(goal.targetDate, weekId) : undefined);
      
      if (targetWeeks === undefined) {
        log(`⚠️ ${userId}: Skipping deadline goal "${goal.title}" - no targetWeeks or targetDate`);
        continue;
      }
      
      // Initialize weeksRemaining if missing (use targetWeeks)
      const currentWeeksRemaining = goal.weeksRemaining !== undefined
        ? goal.weeksRemaining
        : targetWeeks;
      
      // Decrement weeksRemaining weekly (same as consistency goals)
      const previousInstance = previousGoals.find(g => g.templateId === goal.id);
      const wasSkipped = previousInstance?.skipped || false;
      const newWeeksRemaining = wasSkipped
        ? currentWeeksRemaining
        : Math.max(-1, currentWeeksRemaining - 1);
      
      log(`📅 ${userId}: Processing deadline goal "${goal.title}" (targetWeeks: ${targetWeeks}, current weeksRemaining: ${currentWeeksRemaining}, new weeksRemaining: ${newWeeksRemaining})`);
      
      // Always update weeksRemaining in dreams container (even if completed)
      if (!dreamGoalUpdates.has(dream.id)) {
        dreamGoalUpdates.set(dream.id, []);
      }
      dreamGoalUpdates.get(dream.id).push({
        ...goal,
        targetWeeks: targetWeeks, // Ensure targetWeeks is set
        weeksRemaining: newWeeksRemaining
      });
      
      log(`✅ ${userId}: Queued deadline goal "${goal.title}" update: weeksRemaining ${currentWeeksRemaining} → ${newWeeksRemaining}${goal.completed ? ' (completed)' : ''}`);
      
      // Only create instance if deadline is still active and not completed
      // Check both completed and active flags to ensure completed goals don't get new instances
      // IMPORTANT: Use === true to be defensive against undefined/null values
      if (newWeeksRemaining >= 0 && !goal.completed && goal.active === true) {
        const instance = {
          id: `${goal.id}_${weekId}`,
          templateId: goal.id,
          type: 'deadline',
          title: goal.title,
          description: goal.description || '',
          dreamId: dream.id,
          dreamTitle: dream.title,
          dreamCategory: dream.category,
          targetWeeks: targetWeeks, // Use targetWeeks
          targetDate: goal.targetDate, // Keep for backward compatibility
          weeksRemaining: newWeeksRemaining,
          completed: false,
          completedAt: null,
          skipped: false,
          weekId: weekId,
          createdAt: new Date().toISOString()
        };
        
        // Check for duplicate before adding
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
        // Consistency goal: create instance and decrement weeksRemaining/monthsRemaining
        const previousInstance = previousGoals.find(g => g.templateId === goal.id);
        
        if (goal.recurrence === 'weekly' && goal.targetWeeks) {
          log(`   📅 Processing weekly consistency goal: "${goal.title}"`);
          
          // Initialize weeksRemaining if missing
          const currentWeeksRemaining = goal.weeksRemaining !== undefined 
            ? goal.weeksRemaining 
            : goal.targetWeeks;
          
          log(`   📊 Current weeksRemaining: ${currentWeeksRemaining} (from ${goal.weeksRemaining !== undefined ? 'goal.weeksRemaining' : 'goal.targetWeeks'})`);
          
          // Decrement if previous goal wasn't skipped
          const wasSkipped = previousInstance?.skipped || false;
          const newWeeksRemaining = wasSkipped
            ? currentWeeksRemaining
            : Math.max(0, currentWeeksRemaining - 1);
          
          log(`   🔢 New weeksRemaining: ${newWeeksRemaining} (wasSkipped: ${wasSkipped})`);
          
          // Only create instance if weeks remaining > 0
          if (newWeeksRemaining > 0) {
            log(`   ✅ Creating instance for week ${weekId} (${newWeeksRemaining} weeks remaining)`);
            const instance = {
              id: `${goal.id}_${weekId}`,
              templateId: goal.id,
              type: 'weekly_goal',
              title: goal.title,
              description: goal.description || '',
              dreamId: dream.id,
              dreamTitle: dream.title,
              dreamCategory: dream.category,
              recurrence: 'weekly',
              targetWeeks: goal.targetWeeks,
              frequency: goal.frequency || 1, // Copy frequency from dream goal (default to 1 if not set)
              completionCount: 0, // Reset completion count each week
              completionDates: [], // Reset completion dates each week
              weeksRemaining: newWeeksRemaining,
              completed: false,
              completedAt: null,
              skipped: false,
              weekId: weekId,
              createdAt: new Date().toISOString()
            };
            
            // Check for duplicate before adding
            if (!newGoalIds.has(instance.id)) {
              newGoals.push(instance);
              newGoalIds.add(instance.id);
              
              // Track goal update for saving back to dreams container
              if (!dreamGoalUpdates.has(dream.id)) {
                dreamGoalUpdates.set(dream.id, []);
              }
              dreamGoalUpdates.get(dream.id).push({
                ...goal,
                weeksRemaining: newWeeksRemaining
              });
              
              log(`✨ ${userId}: Added consistency goal "${goal.title}" (${newWeeksRemaining} weeks remaining)`);
            } else {
              log(`⚠️ ${userId}: Skipping duplicate consistency goal instance: ${instance.id}`);
            }
          } else {
            // Even when weeksRemaining <= 0, we need to update the goal to mark it inactive
            // This ensures the goal doesn't appear in future weeks
            if (!dreamGoalUpdates.has(dream.id)) {
              dreamGoalUpdates.set(dream.id, []);
            }
            dreamGoalUpdates.get(dream.id).push({
              ...goal,
              weeksRemaining: newWeeksRemaining
            });
            log(`⏭️ ${userId}: Skipping completed consistency goal "${goal.title}" (weeksRemaining: ${newWeeksRemaining}) - will mark inactive`);
          }
        } else if (goal.recurrence === 'monthly' && goal.targetMonths) {
          // Monthly goal: convert to weeks for unified tracking
          const currentMonthId = getMonthId(weekId);
          const previousMonthId = previousInstance?.weekId ? getMonthId(previousInstance.weekId) : null;
          const isSameMonth = currentMonthId === previousMonthId;
          
          // Initialize weeksRemaining if missing (convert from targetMonths)
          const currentWeeksRemaining = goal.weeksRemaining !== undefined
            ? goal.weeksRemaining
            : (goal.targetWeeks || (goal.targetMonths ? monthsToWeeks(goal.targetMonths) : 0));
          
          // Decrement weeks remaining weekly (not monthly)
          const wasSkipped = previousInstance?.skipped || false;
          const newWeeksRemaining = wasSkipped
            ? currentWeeksRemaining
            : Math.max(0, currentWeeksRemaining - 1);
          
          // Only create instance if weeks remaining > 0
          if (newWeeksRemaining > 0) {
            const instance = {
              id: `${goal.id}_${weekId}`,
              templateId: goal.id,
              type: 'monthly_goal',
              title: goal.title,
              description: goal.description || '',
              dreamId: dream.id,
              dreamTitle: dream.title,
              dreamCategory: dream.category,
              recurrence: 'monthly',
              targetWeeks: goal.targetWeeks || (goal.targetMonths ? monthsToWeeks(goal.targetMonths) : undefined),
              targetMonths: goal.targetMonths, // Keep for display
              weeksRemaining: newWeeksRemaining,
              frequency: goal.frequency || 2,
              monthId: currentMonthId,
              completionCount: isSameMonth && previousInstance ? (previousInstance.completionCount || 0) : 0,
              completionDates: isSameMonth && previousInstance ? (previousInstance.completionDates || []) : [],
              completed: isSameMonth && previousInstance ? ((previousInstance.completionCount || 0) >= (goal.frequency || 2)) || previousInstance.completed || false : false,
              completedAt: isSameMonth && previousInstance && previousInstance.completed ? (previousInstance.completedAt || null) : null,
              skipped: false,
              weekId: weekId,
              createdAt: new Date().toISOString()
            };
            
            // Check for duplicate before adding
            if (!newGoalIds.has(instance.id)) {
              newGoals.push(instance);
              newGoalIds.add(instance.id);
              
              // Track goal update for saving back to dreams container
              if (!dreamGoalUpdates.has(dream.id)) {
                dreamGoalUpdates.set(dream.id, []);
              }
              dreamGoalUpdates.get(dream.id).push({
                ...goal,
                weeksRemaining: newWeeksRemaining
              });
              
              log(`✨ ${userId}: Added monthly goal "${goal.title}" (${newWeeksRemaining} weeks remaining)`);
            } else {
              log(`⚠️ ${userId}: Skipping duplicate monthly goal instance: ${instance.id}`);
            }
          } else {
            // Even when weeksRemaining <= 0, we need to update the goal to mark it inactive
            // This ensures the goal doesn't appear in future weeks
            if (!dreamGoalUpdates.has(dream.id)) {
              dreamGoalUpdates.set(dream.id, []);
            }
            dreamGoalUpdates.get(dream.id).push({
              ...goal,
              weeksRemaining: newWeeksRemaining
            });
            log(`⏭️ ${userId}: Skipping completed monthly goal "${goal.title}" (weeksRemaining: ${newWeeksRemaining}) - will mark inactive`);
          }
        }
      }
    }
  }
  
  // Save updated templates back to Cosmos DB if any were modified
  if (templateUpdates.size > 0) {
    log(`💾 ${userId}: Updating ${templateUpdates.size} template(s) with new weeksRemaining/monthsRemaining values`);
    try {
      // Build updated templates array (apply updates, keep others unchanged)
      const updatedTemplates = templates.map(template => {
        const update = templateUpdates.get(template.id);
        if (update) {
          // 🎯 Mark template as inactive when weeksRemaining goes negative (after final week)
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
  
  // Save updated goals from dream.goals[] back to Cosmos DB if any were modified
  if (dreamGoalUpdates.size > 0) {
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
            
            // 🎯 Mark goal as inactive when weeksRemaining goes negative (after final week)
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
  
  return newGoals;
}

/**
 * Calculate score from goals
 */
function calculateScore(goals) {
  return goals.reduce((total, goal) => {
    if (goal.completed) {
      // Weekly goals: 3 points
      // Monthly goals: 5 points
      // Deadline goals: 5 points
      return total + (goal.recurrence === 'monthly' ? 5 : goal.type === 'deadline' ? 5 : 3);
    }
    return total;
  }, 0);
}

/**
 * Get month ID from ISO week (e.g., "2025-W48" -> "2025-11")
 */
function getMonthId(isoWeek) {
  const date = parseIsoWeek(isoWeek);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get the next week ID from a given week ID
 * @param {string} isoWeek - ISO week string (e.g., "2025-W47")
 * @returns {string} Next week ID (e.g., "2025-W48")
 */
function getNextWeekId(isoWeek) {
  const startDate = parseIsoWeek(isoWeek);
  const nextWeekDate = new Date(startDate);
  nextWeekDate.setDate(startDate.getDate() + 7);
  return getCurrentIsoWeek(nextWeekDate);
}

/**
 * Get weeks between two ISO week strings
 */
function getWeeksBetween(startWeekIso, endWeekIso) {
  const weeks = [];
  const start = parseIsoWeek(startWeekIso);
  const end = parseIsoWeek(endWeekIso);
  
  let current = new Date(start);
  while (current < end) {
    weeks.push(getCurrentIsoWeek(current));
    current.setDate(current.getDate() + 7);
  }
  
  return weeks;
}

/**
 * Parse ISO week to date
 */
function parseIsoWeek(isoWeek) {
  const [yearStr, weekStr] = isoWeek.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  
  // Get January 4th of the year (always in week 1)
  const jan4 = new Date(year, 0, 4);
  
  // Get start of week 1 (Monday)
  const startOfWeek1 = new Date(jan4);
  const dayOfWeek = jan4.getDay() || 7; // Convert Sunday (0) to 7
  startOfWeek1.setDate(jan4.getDate() - dayOfWeek + 1);
  
  // Add weeks
  const targetDate = new Date(startOfWeek1);
  targetDate.setDate(startOfWeek1.getDate() + (week - 1) * 7);
  
  return targetDate;
}

/**
 * Get current ISO week
 */
function getCurrentIsoWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Get week date range
 */
function getWeekRange(isoWeek) {
  const start = parseIsoWeek(isoWeek);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

/**
 * Convert months to weeks (approximately 4.33 weeks per month)
 * Used to convert monthly goals to weeks for unified tracking
 * @param {number} months - Number of months to convert
 * @returns {number} Number of weeks (rounded up)
 */
function monthsToWeeks(months) {
  // Average: 4.33 weeks per month (52 weeks / 12 months)
  return Math.ceil(months * 4.33);
}

/**
 * Calculate number of weeks between current week and target date
 * Similar to frontend getWeeksUntilDate
 * @param {string} targetDate - ISO date string (e.g., "2025-12-31")
 * @param {string} currentWeekIso - Current week ID (e.g., "2025-W47")
 * @returns {number} Weeks remaining (0 or positive, -1 if past deadline)
 */
function getWeeksUntilDate(targetDate, currentWeekIso) {
  if (!targetDate) return -1;
  
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) {
    return -1;
  }
  
  const { start: currentWeekStart } = getWeekRange(currentWeekIso);
  
  // Calculate days difference (round up to include partial weeks)
  const daysDiff = Math.ceil((target - currentWeekStart) / (1000 * 60 * 60 * 24));
  
  // Convert to weeks (round up to include partial weeks)
  // This ensures a goal due on Friday still shows as "due this week" on Monday
  const weeksDiff = Math.ceil(daysDiff / 7);
  
  // Return -1 if deadline has passed, otherwise return weeks remaining
  return weeksDiff < 0 ? -1 : weeksDiff;
}

module.exports = {
  rolloverWeekForUser,
  createGoalsFromTemplates,
  calculateScore,
  getCurrentIsoWeek,
  parseIsoWeek,
  getWeeksBetween,
  getWeekRange,
  getWeeksUntilDate,
  monthsToWeeks
};

