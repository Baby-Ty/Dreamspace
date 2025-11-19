# Deadline Goals Rollover Issue - Root Cause Analysis

**Issue**: Completed deadline goals still appear in new weeks after rollover, even though they're marked `completed: true` and `active: false` in the dreams document.

**Symptoms**:
- ✅ Marking a deadline goal complete on dashboard works (updates dreams document)
- ✅ Goal tab in dream view reflects completion
- ✅ Dashboard auto-instantiation correctly skips completed goals
- ❌ First rollover creates instances for completed deadline goals
- ✅ Second rollover correctly excludes them

## Root Cause: Cosmos DB Eventual Consistency

The issue occurs because of **Cosmos DB's eventual consistency model** and a gap in the retry logic.

### Current Flow

1. **User completes deadline goal on Dashboard** (`useDashboardData.js` lines 409-463):
   ```javascript
   // Updates currentWeek container
   await currentWeekService.toggleGoalCompletion(...)
   
   // Updates parent goal in dreams document
   await updateGoal(dreamId, {
     ...parentGoal,
     completed: true,
     active: false,      // ← This is key!
     completedAt: new Date().toISOString()
   })
   ```

2. **Rollover is triggered** (manually or automatically)

3. **Rollover reads dreams document** (`api/utils/weekRollover.js` line 135):
   ```javascript
   let dreamsDoc = await cosmosProvider.getDreamsDocument(userId);
   ```
   **Problem**: Due to eventual consistency, this might return **stale data** where the goal is still `completed: false`, `active: true`

4. **Retry mechanism** (lines 148-194) checks for stale data:
   ```javascript
   const hasStaleData = previousGoals.some(g => {
     if (g.type === 'deadline' && g.completed && g.templateId) {
       // Find goal in dreams document
       const goal = dream.goals?.find(dg => dg.id === g.templateId);
       // If completed in previousGoals but NOT in dreams doc, we have stale data
       if (!goal.completed || goal.active !== false) {
         return true; // Stale data detected
       }
     }
   });
   ```
   
   **Gap**: This only detects stale data if a goal is `completed: true` in `previousGoals` (the currentWeekDoc.goals being archived). But if the user completed the goal via Dashboard and the currentWeekDoc hasn't been updated yet, `previousGoals` won't have the completed status either!

5. **Goals are filtered** (lines 389-411):
   ```javascript
   const deadlineGoals = allDreamGoals.filter(g => {
     if (g.completed === true) return false;  // ← Checks stale data!
     if (g.active !== true) return false;      // ← Checks stale data!
     return true;
   });
   ```
   Because the dreams document is stale, `g.completed === false` and `g.active === true`, so the goal passes the filter.

6. **Instance is created** (lines 476-515) for the completed goal ❌

7. **Second rollover**: By now, Cosmos DB has propagated the changes, so the dreams document correctly shows `completed: true`, `active: false`, and the goal is filtered out ✅

## Why Dashboard Auto-Instantiation Works

Dashboard auto-instantiation (`useDashboardData.js` lines 143-148) works because:

```javascript
if (goal.type === 'deadline') {
  // Checks completed/active status from the LIVE dreams document
  // that was just loaded from AppContext
  if (goal.completed || goal.active === false) {
    console.log(`   ⏭️ Skipping deadline goal - ${goal.completed ? 'completed' : 'inactive'}`);
    return false;
  }
  // ...
}
```

The dashboard loads the dreams document **after** all updates have settled, so it doesn't hit the eventual consistency window.

## Solution Options

### Option 1: Extend Retry Window (Recommended)
Increase the retry delay and max retries to give Cosmos DB more time to propagate:

**Current**:
- Initial delay: 800ms (line 88)
- Retry delays: 600ms, 1200ms (lines 182-183)
- Max retries: 2 (line 146)
- Total wait time: ~2.6 seconds

**Proposed**:
- Initial delay: 1000ms
- Retry delays: 800ms, 1600ms, 3200ms
- Max retries: 3
- Total wait time: ~6.6 seconds

### Option 2: Force Eventual Consistency Read
Use Cosmos DB's **strong consistency** for reads during rollover:

```javascript
const { resource } = await dreamsContainer
  .item(userId, userId)
  .read({ consistencyLevel: 'Strong' });
```

**Trade-off**: Higher latency and RU cost, but guarantees fresh data.

### Option 3: Improve Stale Data Detection
Enhance the retry logic to check for recently completed goals in **both** currentWeekDoc AND dreams document:

```javascript
// Check if ANY deadline goal in dreams doc is marked completed but wasn't in currentWeekDoc
const hasRecentCompletions = dreams.some(dream => 
  (dream.goals || []).some(g => 
    g.type === 'deadline' && 
    g.completed === true && 
    !previousGoals.some(pg => pg.templateId === g.id && pg.completed === true)
  )
);

if (hasRecentCompletions) {
  // Longer delay and more retries
}
```

## Recommended Fix

**Combination of Options 1 + 3**:

1. Increase retry window to 3 attempts with longer delays (1s, 1.6s, 3.2s)
2. Improve stale data detection to catch recently completed goals
3. Add explicit logging to help diagnose future issues

This balances performance (most rollovers won't need retries) with correctness (completed goals are reliably excluded).

## Files to Modify

- `api/utils/weekRollover.js` (lines 80-194): Extend retry logic
- `api/utils/cosmosProvider.js`: Optional - add strong consistency option

## Testing

1. Complete a deadline goal on Dashboard
2. Immediately trigger test rollover
3. Verify completed goal does NOT appear in new week
4. Check logs for retry messages
5. Repeat 5 times to ensure consistency

---

## SECOND ISSUE: Race Condition with Concurrent Writes (CRITICAL!)

### The Lost Update Problem

When you complete a deadline goal on Dashboard, **TWO sequential writes** happen to the **SAME Cosmos DB document**:

#### What Happens:

**Step 1** - `updateGoal` is called (`AppContext.jsx` lines 1163-1200):
```javascript
// Reads ALL templates from React state (including the un-updated template)
const templates = state.weeklyGoals?.filter(g => 
  g.type === 'weekly_goal_template'
) || [];

// Writes to dreams document: { dreamBook: [...], weeklyGoalTemplates: [...OLD templates...] }
await itemService.saveDreams(userId, updatedDreams, templates);
```

**Step 2** - `updateWeeklyGoal` is called (`AppContext.jsx` lines 712-733):
```javascript
// Reads ALL dreams from React state (might be OLD state before dispatch propagates!)
const dreams = state.currentUser?.dreamBook || [];

// Reads ALL templates from React state (now includes the updated template)
const allTemplates = state.weeklyGoals?.filter(g => g.type === 'weekly_goal_template') || [];

// Writes to dreams document: { dreamBook: [...OLD dreams...], weeklyGoalTemplates: [...new templates...] }
await itemService.saveDreams(userId, dreams, allTemplates);
```

**Result**: The second write **overwrites** the first write's changes!

### Why This Happens:

1. Both functions read from **React state** (`state.currentUser.dreamBook` and `state.weeklyGoals`)
2. React state updates are **asynchronous** - even though we dispatch before saving, the state might not be updated when the second function reads it
3. Both functions call `itemService.saveDreams()` which does an **UPSERT** (last write wins)
4. The dreams document and templates are stored **in the same Cosmos DB document**

### Proof:

Look at `useDashboardData.js` lines 429-456:

```javascript
// Update parent goal in dream
await updateGoal(toggledGoal.dreamId, updatedParentGoal);  // ← First write
console.log('✅ Parent deadline goal updated');

// Also update the template if it exists
const template = weeklyGoals?.find(...);
if (template) {
  const updatedTemplate = { ...template, completed: true, active: false };
  await updateWeeklyGoal(updatedTemplate);  // ← Second write (might overwrite first!)
  console.log('✅ Template updated');
}
```

Even though they're awaited sequentially, they both read from stale React state and overwrite each other.

### How This Causes the Rollover Bug:

1. User completes deadline goal → Two writes happen
2. Second write might revert the goal's `completed` and `active` flags to old values
3. Dreams document ends up with inconsistent state (template updated, but goal not)
4. Rollover reads this inconsistent document → Creates instance for "uncompleted" goal
5. Eventually consistency settles → Second rollover works correctly

### The Fix for Race Condition:

**Option A: Atomic Update (Recommended)**

Combine both updates into a **single write**:

```javascript
// In useDashboardData.js, instead of calling updateGoal then updateWeeklyGoal:
const updateDeadlineGoalCompletion = async (dreamId, goal, template) => {
  const userId = currentUser.id;
  
  // Build complete updated dreams array
  const updatedDreams = currentUser.dreamBook.map(d => {
    if (d.id === dreamId) {
      return {
        ...d,
        goals: (d.goals || []).map(g => g.id === goal.id ? goal : g)
      };
    }
    return d;
  });
  
  // Build complete updated templates array
  const updatedTemplates = weeklyGoals
    .filter(g => g.type === 'weekly_goal_template')
    .map(t => t.id === template.id ? template : t);
  
  // SINGLE atomic write
  await itemService.saveDreams(userId, updatedDreams, updatedTemplates);
};
```

**Option B: Optimistic Concurrency Control**

Use Cosmos DB **ETags** to detect conflicts:

```javascript
// In saveDreams API, check ETag before writing
const { resource, etag } = await dreamsContainer.item(userId, userId).read();

// Try to write with ETag check
try {
  await dreamsContainer.items.upsert(document, {
    accessCondition: { type: 'IfMatch', condition: etag }
  });
} catch (error) {
  if (error.code === 412) { // Precondition failed
    // Another write happened - retry
  }
}
```

**Option C: Queue Updates**

Use a queue to serialize writes to the same document:

```javascript
const pendingWrites = new Map();

const queuedSave = async (userId, dreams, templates) => {
  const key = `dreams_${userId}`;
  
  // Wait for pending write to complete
  if (pendingWrites.has(key)) {
    await pendingWrites.get(key);
  }
  
  // Execute this write
  const promise = itemService.saveDreams(userId, dreams, templates);
  pendingWrites.set(key, promise);
  
  await promise;
  pendingWrites.delete(key);
};
```

---

## Complete Solution

To fully fix the issue, we need **BOTH fixes**:

1. **Fix eventual consistency** (increase retry window in rollover)
2. **Fix race condition** (atomic updates for deadline goal completion)

### Priority:

1. **CRITICAL**: Fix race condition (Option A - atomic update)
2. **IMPORTANT**: Fix eventual consistency (increase retry window)

### Files to Modify:

**For Race Condition:**
- `src/hooks/useDashboardData.js` (lines 409-463): Combine updates into single write
- `src/context/AppContext.jsx`: Add atomic update function

**For Eventual Consistency:**
- `api/utils/weekRollover.js` (lines 80-194): Extend retry logic

---

**Next Steps**: 
1. Implement atomic update for deadline goal completion (prevents race condition)
2. Increase retry window in rollover (handles eventual consistency)
3. Test thoroughly with rapid completion + rollover scenario

