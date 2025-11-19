# Deadline Goals Implementation Plan

## Overview
Plan to implement deadline goals with consistent `weeksRemaining` calculation across all goal types, using the simplified `currentWeek` container tracking system.

## Current State

### How Goals Currently Work

**Weekly Consistency Goals:**
- Use `targetWeeks` field (e.g., 12)
- Have `weeksRemaining` field that decrements each week
- When `weeksRemaining` reaches 0, goal is complete
- Week rollover decrements `weeksRemaining`

**Monthly Consistency Goals:**
- Use `targetMonths` field (e.g., 6)
- Have `monthsRemaining` field calculated by `getMonthsRemaining(startDate, targetMonths)`
- When `monthsRemaining` reaches 0, goal is complete
- Uses `monthUtils.js` for calculations

**Deadline Goals (Current Implementation - INCOMPLETE):**
- Use `targetDate` field (ISO date string)
- Currently create instances for each week until deadline
- ❌ **Problem**: No `weeksRemaining` calculation
- ❌ **Problem**: Don't automatically stop showing when deadline passes
- ❌ **Problem**: Don't use consistent -1 pattern

## User Requirements

1. **Show on Each New Week**: Deadline goal should appear in `currentWeek` for every week until the deadline week
2. **Remove When Complete**: If marked complete before deadline, remove from future current weeks and mark complete in the dream
3. **Consistent Weeks Calculation**: Use same pattern as monthly goals (calculate remaining weeks)
4. **Unified -1 Logic**: All goal types should use -1 to indicate "complete" or "unlimited"

## Proposed Solution

### 1. Add Weeks Calculation Utility (`src/utils/dateUtils.js`)

Add new functions to calculate weeks between dates:

```javascript
/**
 * Calculate number of weeks between current week and target date
 * Similar to getMonthsRemaining but for weeks
 * @param {string} targetDate - ISO date string (e.g., "2025-12-31")
 * @param {string} currentWeekIso - Current week ID (optional, defaults to now)
 * @returns {number} Weeks remaining (0 or positive, -1 if past deadline)
 * @example
 * getWeeksUntilDate("2025-12-31", "2025-W47") // 7
 * getWeeksUntilDate("2025-11-15", "2025-W47") // 0 (past deadline)
 */
export function getWeeksUntilDate(targetDate, currentWeekIso = null) {
  const target = new Date(targetDate);
  const currentWeek = currentWeekIso || getCurrentIsoWeek();
  const { start: currentWeekStart } = getWeekRange(currentWeek);
  
  // Calculate days difference
  const daysDiff = Math.ceil((target - currentWeekStart) / (1000 * 60 * 60 * 24));
  
  // Convert to weeks (round up to include partial weeks)
  const weeksDiff = Math.ceil(daysDiff / 7);
  
  // Return -1 if deadline has passed, otherwise return weeks remaining
  return weeksDiff < 0 ? -1 : weeksDiff;
}

/**
 * Check if a deadline goal should still be shown
 * @param {string} targetDate - ISO date string
 * @param {string} currentWeekIso - Current week ID (optional)
 * @returns {boolean} True if deadline is in future or current week
 */
export function isDeadlineActive(targetDate, currentWeekIso = null) {
  const weeksRemaining = getWeeksUntilDate(targetDate, currentWeekIso);
  return weeksRemaining >= 0;
}
```

### 2. Update Goal Schema (`src/schemas/dream.js`)

Ensure deadline goals have consistent structure:

```javascript
// In GoalSchema
{
  id: z.string(),
  title: z.string(),
  type: z.enum(['consistency', 'deadline']).default('consistency'),
  
  // Consistency fields
  recurrence: z.enum(['weekly', 'monthly']).optional(),
  targetWeeks: z.number().optional(),
  targetMonths: z.number().optional(),
  
  // Deadline fields
  targetDate: z.string().optional(), // ISO date
  
  // Computed fields (calculated on load)
  weeksRemaining: z.number().optional(), // For ALL goal types
  monthsRemaining: z.number().optional(), // For monthly goals
  
  // Status
  active: z.boolean().default(true),
  completed: z.boolean().default(false),
  completedAt: z.string().optional(),
  startDate: z.string().optional(),
  createdAt: z.string()
}
```

### 3. Update Dashboard Data Hook (`src/hooks/useDashboardData.js`)

When loading deadline goals, calculate `weeksRemaining`:

```javascript
// In loadCurrentWeekGoals function, around line 209
if (dreamGoal.type === 'deadline') {
  // Calculate weeks remaining for deadline goal
  const weeksRemaining = getWeeksUntilDate(dreamGoal.targetDate, currentWeekIso);
  
  // Only create instance if deadline is still active
  if (weeksRemaining >= 0) {
    const instance = {
      id: `${goalId}_${currentWeekIso}`,
      templateId: goalId,
      type: 'deadline',
      title: dreamGoal.title,
      description: dreamGoal.description || '',
      dreamId: dreamGoal.dreamId,
      dreamTitle: dreamGoal.dreamTitle,
      dreamCategory: dreamGoal.dreamCategory,
      targetDate: dreamGoal.targetDate,
      weeksRemaining: weeksRemaining, // ← NEW: Add weeks remaining
      completed: dreamGoal.completed || false,
      completedAt: dreamGoal.completedAt || null,
      skipped: false,
      weekId: currentWeekIso,
      createdAt: new Date().toISOString()
    };
    newInstances.push(instance);
    console.log(`✨ Auto-creating deadline goal instance: "${dreamGoal.title}" (${weeksRemaining} weeks remaining)`);
  } else {
    console.log(`⏭️ Skipping past deadline goal: "${dreamGoal.title}"`);
  }
}
```

### 4. Update Week Rollover Logic (`api/utils/weekRollover.js`)

When rolling to new week, recalculate `weeksRemaining` for all goals:

```javascript
// In rolloverToNewWeek function
function calculateWeeksRemaining(goal, newWeekIso) {
  if (goal.type === 'deadline' && goal.targetDate) {
    // Deadline goal: calculate weeks until target date
    return getWeeksUntilDate(goal.targetDate, newWeekIso);
  } else if (goal.recurrence === 'monthly' && goal.targetMonths && goal.startDate) {
    // Monthly goal: use monthsRemaining (existing logic)
    return goal.monthsRemaining - 1; // Decrement by 1 month per rollover
  } else if (goal.targetWeeks) {
    // Weekly goal: decrement weeks
    return Math.max(0, (goal.weeksRemaining || goal.targetWeeks) - 1);
  }
  return -1; // Unlimited or unknown
}

// When creating new week instances
const updatedGoal = {
  ...goal,
  weekId: newWeekIso,
  weeksRemaining: calculateWeeksRemaining(goal, newWeekIso),
  // Don't copy if deadline has passed or weeks remaining is 0
};

// Only include if still active
if (goal.type === 'deadline') {
  if (updatedGoal.weeksRemaining < 0) {
    console.log(`⏭️ Deadline passed for "${goal.title}", not rolling over`);
    continue; // Skip this goal
  }
}
```

### 5. Update Goal Completion Logic (`src/hooks/useDashboardData.js`)

When completing a deadline goal, update parent dream and mark complete:

```javascript
// In handleToggleGoal, around line 358 (already partially implemented)
if (toggledGoal?.dreamId && toggledGoal.type === 'deadline') {
  console.log('📝 Updating parent goal in dream:', {
    dreamId: toggledGoal.dreamId,
    goalId: toggledGoal.templateId, // Use templateId to find parent
    completed: toggledGoal.completed
  });
  
  const parentDream = currentUser?.dreamBook?.find(d => d.id === toggledGoal.dreamId);
  if (parentDream) {
    const parentGoal = parentDream.goals?.find(g => g.id === toggledGoal.templateId);
    if (parentGoal) {
      const updatedParentGoal = {
        ...parentGoal,
        completed: toggledGoal.completed,
        completedAt: toggledGoal.completed ? new Date().toISOString() : null,
        weeksRemaining: toggledGoal.completed ? -1 : getWeeksUntilDate(parentGoal.targetDate)
      };
      
      await updateGoal(toggledGoal.dreamId, updatedParentGoal);
      console.log('✅ Parent deadline goal updated');
      
      // If completed, remove from future weeks (week rollover will handle this)
      if (toggledGoal.completed) {
        console.log('🎉 Deadline goal completed early! Will not appear in future weeks.');
      }
    }
  }
}
```

### 6. Update Dream Tracker (`src/hooks/useDreamTracker.js`)

When creating deadline goal, calculate initial `weeksRemaining`:

```javascript
// In handleAddGoal, around line 258
targetDate: newGoalData.type === 'deadline' ? newGoalData.targetDate : undefined,
weeksRemaining: newGoalData.type === 'deadline' 
  ? getWeeksUntilDate(newGoalData.targetDate) 
  : (newGoalData.type === 'consistency' && newGoalData.recurrence === 'weekly' 
      ? newGoalData.targetWeeks 
      : undefined),
```

### 7. Update UI Display Components

**Dashboard Widget (`src/pages/dashboard/WeekGoalsWidget.jsx`):**

Show weeks remaining for deadline goals:

```jsx
{goal.type === 'deadline' && (
  <div className="text-xs text-professional-gray-500 mt-1">
    <Clock className="inline-block w-3 h-3 mr-1" />
    {goal.weeksRemaining === 0 
      ? 'Due this week!' 
      : goal.weeksRemaining === 1 
        ? '1 week left' 
        : `${goal.weeksRemaining} weeks left`}
    {goal.targetDate && ` (${formatDate(goal.targetDate)})`}
  </div>
)}
```

**Goal Accordion (`src/components/GoalAccordion.jsx`):**

Display weeks remaining for deadline goals:

```jsx
// Around line 65-70
const weeksUntilDeadline = useMemo(() => {
  if (!isDeadline || !goal.targetDate) return null;
  return getWeeksUntilDate(goal.targetDate);
}, [isDeadline, goal.targetDate]);

// In render
{isDeadline && weeksUntilDeadline !== null && (
  <p className="text-sm text-professional-gray-600 mt-2">
    <Clock className="inline-block w-4 h-4 mr-1" />
    {weeksUntilDeadline === 0 
      ? <span className="text-netsurit-orange font-semibold">Due this week!</span>
      : weeksUntilDeadline === 1
        ? '1 week remaining'
        : `${weeksUntilDeadline} weeks remaining`}
  </p>
)}
```

## Implementation Checklist

### Phase 1: Core Utilities
- [ ] Add `getWeeksUntilDate()` to `src/utils/dateUtils.js`
- [ ] Add `isDeadlineActive()` to `src/utils/dateUtils.js`
- [ ] Add tests for new utility functions
- [ ] Update schema to include `weeksRemaining` for all goal types

### Phase 2: Dashboard & Current Week
- [ ] Update `useDashboardData.js` to calculate `weeksRemaining` for deadline goals
- [ ] Filter out deadline goals with `weeksRemaining < 0` when loading
- [ ] Update `handleToggleGoal` to sync completion with parent dream
- [ ] Test: Deadline goal appears in dashboard
- [ ] Test: Completed deadline goal updates parent dream

### Phase 3: Dream Book Integration
- [ ] Update `useDreamBook.js` to calculate initial `weeksRemaining` for new deadline goals
- [ ] Update `useDreamTracker.js` to calculate `weeksRemaining` when creating goals
- [ ] Ensure bidirectional sync (Dashboard ↔ Dream Book)
- [ ] Test: Creating deadline goal from Dream Book
- [ ] Test: Completing deadline goal from Dream Book

### Phase 4: Week Rollover
- [ ] Update `api/utils/weekRollover.js` to recalculate `weeksRemaining`
- [ ] Filter out deadline goals with `weeksRemaining < 0` during rollover
- [ ] Filter out completed deadline goals during rollover
- [ ] Test: Week rollover with active deadline goals
- [ ] Test: Week rollover skips past deadline goals
- [ ] Test: Week rollover skips completed deadline goals

### Phase 5: UI Updates
- [ ] Update `WeekGoalsWidget.jsx` to show weeks remaining for deadline goals
- [ ] Update `GoalAccordion.jsx` to show weeks remaining
- [ ] Add visual indicator for deadline urgency (e.g., red if 1 week left)
- [ ] Test: UI shows correct weeks remaining
- [ ] Test: UI updates when week changes

### Phase 6: Testing & Documentation
- [ ] Test full flow: Create → Show → Complete → Remove
- [ ] Test edge case: Deadline in past
- [ ] Test edge case: Deadline this week
- [ ] Test edge case: Deadline far future
- [ ] Update CONTEXT.md with deadline goals pattern
- [ ] Update .cursorrules if needed

## Unified -1 Logic Pattern

All goal types will use consistent `weeksRemaining` / `monthsRemaining` values:

| Goal Type | Field | Calculation | -1 Means | 0 Means | > 0 Means |
|-----------|-------|-------------|----------|---------|-----------|
| Weekly Consistency | `weeksRemaining` | `targetWeeks - weeksElapsed` | Complete | Last week | N weeks left |
| Monthly Consistency | `monthsRemaining` | `targetMonths - monthsElapsed` | Complete | Last month | N months left |
| Deadline | `weeksRemaining` | `getWeeksUntilDate(targetDate)` | Past deadline | Due this week | N weeks until deadline |

**Benefits:**
- ✅ All goals use same logic for "remaining time"
- ✅ Week rollover can use unified logic to decrement/recalculate
- ✅ UI can display remaining time consistently
- ✅ Filters can check `weeksRemaining >= 0` for all active goals

## Example Flow

### Creating a Deadline Goal

**User Action:** Create goal "Submit report" with deadline "2025-12-15"

**Current Week:** 2025-W47 (Nov 18-24, 2025)

**System Actions:**
1. Calculate initial `weeksRemaining`: `getWeeksUntilDate("2025-12-15", "2025-W47")` → 4 weeks
2. Create goal in dream with:
   ```json
   {
     "id": "goal_123",
     "type": "deadline",
     "title": "Submit report",
     "targetDate": "2025-12-15",
     "weeksRemaining": 4,
     "completed": false
   }
   ```
3. Create instance in `currentWeek` container:
   ```json
   {
     "id": "goal_123_2025-W47",
     "templateId": "goal_123",
     "type": "deadline",
     "title": "Submit report",
     "targetDate": "2025-12-15",
     "weeksRemaining": 4,
     "weekId": "2025-W47"
   }
   ```

### Week Rollover (2025-W47 → 2025-W48)

**System Actions:**
1. Load previous week goals
2. For deadline goal "Submit report":
   - Recalculate: `getWeeksUntilDate("2025-12-15", "2025-W48")` → 3 weeks
   - Create new instance: `goal_123_2025-W48` with `weeksRemaining: 3`
3. Goal appears in Dashboard for W48

### Completing Before Deadline (2025-W49)

**User Action:** Mark "Submit report" as complete in Dashboard

**Current Week:** 2025-W49 (Dec 2-8, 2025)

**System Actions:**
1. Update current week instance: `{ completed: true, completedAt: "2025-12-04T..." }`
2. Update parent goal in dream: `{ completed: true, completedAt: "2025-12-04T...", weeksRemaining: -1 }`
3. On next week rollover (W49 → W50):
   - Check: `goal.completed === true` → Skip creating new instance
   - Goal no longer appears in Dashboard

### Deadline Passes Without Completion (2025-W51)

**Current Week:** 2025-W51 (Dec 16-22, 2025)

**System Actions:**
1. Week rollover from W50 → W51
2. For "Submit report": `getWeeksUntilDate("2025-12-15", "2025-W51")` → -1 (past)
3. Check: `weeksRemaining < 0` → Don't create new instance
4. Goal no longer appears in Dashboard (deadline passed)

## Benefits of This Approach

### 1. **Consistency Across Goal Types**
- All goals use `weeksRemaining` or `monthsRemaining` fields
- Unified logic for filtering, displaying, and tracking
- Easier to maintain and understand

### 2. **Simplified Week Rollover**
- Single function to recalculate remaining time
- Automatically filters out completed and past-deadline goals
- No manual tracking of deadline weeks

### 3. **Bidirectional Sync**
- Deadline goals work in both Dashboard and Dream Book
- Completing in either location updates both
- No data inconsistencies

### 4. **Performance**
- Only active goals appear in `currentWeek` container
- Past/completed goals automatically excluded
- Efficient querying and rendering

### 5. **User Experience**
- Clear visual feedback on time remaining
- Consistent patterns across different goal types
- Goals disappear automatically when no longer relevant

## Technical Notes

### Week Calculation Logic

**Why use weeks instead of days?**
- Aligns with existing `currentWeek` container structure
- Consistent with weekly goal pattern
- Simpler mental model for users ("4 weeks left" vs "28 days left")

**Rounding:**
- Always round UP for partial weeks (`Math.ceil`)
- Example: 10 days until deadline → 2 weeks (not 1)
- Ensures goal appears until deadline week

**Edge Cases:**
- Deadline today → `weeksRemaining: 0` (due this week)
- Deadline tomorrow → `weeksRemaining: 0` or `1` (depends on week boundary)
- Deadline in past → `weeksRemaining: -1` (don't show)

### Container Strategy

**currentWeek Container:**
- Only stores goals for current week
- Recalculated on each week rollover
- Deadline goals auto-filtered by `weeksRemaining >= 0`

**dreams Container:**
- Stores master goal definition
- `weeksRemaining` is informational (recalculated on load)
- `completed` status is source of truth

**pastWeeks Container:**
- Historical summaries only
- No individual goal data

## Migration Considerations

### Existing Deadline Goals

**If deadline goals already exist:**
1. Add `weeksRemaining` field on load
2. Calculate using `getWeeksUntilDate(goal.targetDate)`
3. Filter out any with `weeksRemaining < 0`

**Migration Script (if needed):**
```javascript
// Run once to add weeksRemaining to existing deadline goals
async function migrateDeadlineGoals(userId) {
  const dreamsDoc = await getDreamsDocument(userId);
  const updated = dreamsDoc.dreamBook.map(dream => ({
    ...dream,
    goals: (dream.goals || []).map(goal => {
      if (goal.type === 'deadline' && goal.targetDate) {
        return {
          ...goal,
          weeksRemaining: getWeeksUntilDate(goal.targetDate)
        };
      }
      return goal;
    })
  }));
  await saveDreamsDocument(userId, updated);
}
```

## Summary

This implementation provides a **unified, consistent approach** to tracking all goal types using the same `weeksRemaining` pattern. Deadline goals will:

1. ✅ Automatically appear each week until deadline
2. ✅ Show weeks remaining (consistent with monthly goals)
3. ✅ Sync completion between Dashboard and Dream Book
4. ✅ Automatically stop showing when completed or past deadline
5. ✅ Use efficient `currentWeek` container pattern
6. ✅ Integrate seamlessly with week rollover logic

**Next Step:** Begin implementation with Phase 1 (Core Utilities).

