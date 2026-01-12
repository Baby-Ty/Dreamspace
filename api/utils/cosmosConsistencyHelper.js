/**
 * Cosmos DB Eventual Consistency Helper
 * 
 * Cosmos DB has eventual consistency, which means updates may not be immediately
 * visible across all reads. This helper provides retry logic with exponential
 * backoff to wait for data consistency.
 * 
 * Common use case: After completing a deadline goal, the dreams document may
 * still show it as active for a short period. We retry until consistency is achieved.
 */

const { getCosmosProvider } = require('./cosmosProvider');

/**
 * Fetch dreams document with retry logic for eventual consistency
 * Specifically handles the case where deadline goals were just completed
 * and need time to propagate through Cosmos DB
 * 
 * @param {string} userId - User ID
 * @param {Array} previousGoals - Goals from previous week (to detect recently completed deadline goals)
 * @param {object} options - Configuration options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.baseDelayMs - Initial delay in ms (default: 800)
 * @param {number} options.backoffFactor - Exponential backoff multiplier (default: 2)
 * @param {object} options.context - Azure Function context (for logging)
 * @returns {Promise<{dreams: Array, templates: Array, dreamsDoc: object}>}
 */
async function fetchDreamsWithConsistencyRetry(userId, previousGoals = [], options = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 800,
    backoffFactor = 2,
    context = null
  } = options;
  
  const log = context?.log || console.log;
  const cosmosProvider = getCosmosProvider();
  
  // 1. Initial fetch
  let dreamsDoc = await cosmosProvider.getDreamsDocument(userId);
  if (!dreamsDoc) {
    log(`⚠️ ${userId}: No dreams document found`);
    return { dreams: [], templates: [], dreamsDoc: null };
  }
  
  let dreams = dreamsDoc.dreamBook || dreamsDoc.dreams || [];
  let retryCount = 0;
  
  // Check if previousGoals contains completed deadline goals (indicates recent completion)
  // This is a signal that we should verify all deadline goals are consistent
  const hasCompletedDeadlinesInPreviousWeek = previousGoals.some(g => 
    g.type === 'deadline' && g.completed === true
  );
  
  // Retry loop for eventual consistency
  while (retryCount <= maxRetries) {
    let hasStaleData = false;
    let staleGoalDetails = null;
    
    // Check 1: Previous week's completed goals
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
    const delayMs = baseDelayMs * Math.pow(backoffFactor, retryCount);
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
  
  return { dreams, templates, dreamsDoc };
}

module.exports = {
  fetchDreamsWithConsistencyRetry
};
