# Atomic Updates for All Goal Types - Implementation Summary

## Problem Statement
1. **Race conditions**: Sequential writes to goals and templates could overwrite each other due to stale React state
2. **Goals appearing after completion**: Goals with `weeksRemaining = 0` were not being marked inactive, causing them to reappear in future weeks

## Solution Overview

### 1. Atomic Updates for Consistency Goals
Added atomic update functionality similar to deadline goals to prevent race conditions when consistency goals complete.

#### Changes Made

**`src/context/AppContext.jsx`**
- ✅ Added `updateConsistencyGoalAndTemplate()` function (lines 1291-1356)
  - Single atomic write for both goal and template
  - Matches templates by `id`, `goalId`, or `templateId`
  - Updates local state only after successful write

- ✅ Updated `logWeeklyCompletion()` to use atomic updates (lines 995-1057)
  - Made function `async` to support atomic updates
  - Marks goals as `completed: true, active: false` when target weeks reached
  - Uses atomic update to prevent race condition
  - Updates both dream goal and template in single write

### 2. Mark Goals Inactive When Weeks Expire

#### Changes Made

**`api/utils/weekRollover.js`**
- ✅ Mark goals inactive when `weeksRemaining <= 0` (lines 756-767)
  ```javascript
  const shouldMarkInactive = newWeeksRemaining <= 0 && !goal.completed;
  if (shouldMarkInactive) {
    log(`   🔒 Marking goal "${goal.title}" as inactive (weeksRemaining: ${newWeeksRemaining})`);
    return { 
      ...goal, 
      ...update, 
      active: false,
      completedAt: new Date().toISOString()
    };
  }
  ```

- ✅ Mark templates inactive when `weeksRemaining <= 0` (lines 721-733)
  ```javascript
  const shouldMarkInactive = newWeeksRemaining <= 0 && !template.completed;
  if (shouldMarkInactive) {
    log(`   🔒 Marking template "${template.title}" as inactive (weeksRemaining: ${newWeeksRemaining})`);
    return { 
      ...template, 
      ...update, 
      active: false,
      completedAt: new Date().toISOString()
    };
  }
  ```

**`src/hooks/useDashboardData.js`**
- ✅ Filter inactive templates (lines 188-201)
  - Skip templates with `active === false`
  - Skip templates with `weeksRemaining <= 0`

- ✅ Filter inactive consistency goals (lines 161-173)
  - Skip goals with `weeksRemaining <= 0`
  - Maintains existing `active !== false` check

## Testing Checklist

### Deadline Goals
- [ ] Create dream with deadline goal
- [ ] Mark goal complete on dashboard
- [ ] Trigger rollover
- [ ] Verify goal does NOT appear in new week
- [ ] Verify goal marked `completed: true, active: false` in dreams document

### Consistency Goals (Weekly)
- [ ] Create dream with weekly consistency goal (e.g., 4 weeks)
- [ ] Complete goal 4 times over 4 weeks
- [ ] Verify goal auto-completes and marks `active: false`
- [ ] Trigger rollover
- [ ] Verify completed goal does NOT appear in new week

### Consistency Goals (Monthly)
- [ ] Create dream with monthly consistency goal (e.g., 3 months)
- [ ] Complete goal sufficient times over multiple months
- [ ] Verify goal auto-completes when target reached
- [ ] Trigger rollover
- [ ] Verify completed goal does NOT appear in new week

### Goals Reaching Zero Weeks
- [ ] Create dream with weekly consistency goal (2 weeks)
- [ ] Do NOT complete it
- [ ] Trigger rollover 2 times
- [ ] After 2 weeks, verify goal marked `active: false` (expired)
- [ ] Verify expired goal does NOT appear in subsequent weeks

## Key Benefits

1. **No Race Conditions**: All goal types use atomic updates
2. **Clean Expiration**: Goals automatically marked inactive when weeks expire
3. **Dashboard Filtering**: Inactive and expired goals filtered from auto-instantiation
4. **Consistent Behavior**: All goal types (deadline, weekly, monthly) follow same pattern
5. **Server-Side Safety**: Rollover marks goals inactive automatically
6. **Client-Side Safety**: Dashboard filters inactive goals before creating instances

## Files Modified

### Frontend (2 files)
1. `src/context/AppContext.jsx` - Added atomic update for consistency goals
2. `src/hooks/useDashboardData.js` - Filter inactive goals in auto-instantiation

### Backend (1 file)
3. `api/utils/weekRollover.js` - Mark goals/templates inactive when `weeksRemaining <= 0`

## Deployment Notes

- ✅ No database schema changes required
- ✅ No data migration needed
- ✅ Backward compatible with existing data
- ✅ All changes are additive (no breaking changes)

## Monitoring After Deployment

Check logs for:
- `🔒 Marking goal ... as inactive (weeksRemaining: 0)` - Goals being marked inactive
- `⏭️ Skipping inactive template: ...` - Inactive templates filtered
- `⏭️ Skipping completed consistency goal: ...` - Completed goals filtered
- `💾 Atomically updating consistency goal and template` - Atomic updates working

## Summary

All goal types now:
1. ✅ Use atomic updates to prevent race conditions
2. ✅ Automatically marked inactive when `weeksRemaining <= 0`
3. ✅ Filtered from dashboard auto-instantiation when inactive
4. ✅ Never reappear after completion or expiration

