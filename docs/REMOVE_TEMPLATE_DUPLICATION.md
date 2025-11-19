# Remove Template Duplication - Refactoring Summary

## Problem
When creating goals via the Goals tab, the system was creating **duplicate data**:
1. Goal added to `dream.goals[]` array ✅
2. Template created in `weeklyGoalTemplates[]` array ❌
3. Template then duplicated back to `dream.goals[]` ❌ (same ID, duplicate data)

This caused:
- Data duplication (same goal stored twice)
- Potential sync issues
- Confusion about source of truth

## Solution
**`dream.goals[]` is now the single source of truth** for goals. Templates are kept for backward compatibility with existing data only.

### Changes Made

#### 1. **`src/context/AppContext.jsx`** (Lines 492-546)
- ✅ **Removed** duplication logic that added goals back to `dream.goals[]` when creating templates
- ✅ **Added** comment explaining templates are for backward compatibility only
- ✅ New goals should be added directly to `dream.goals[]`, not via templates

#### 2. **`src/hooks/useDreamTracker.js`**
- ✅ **Removed** `createWeeklyEntries()` function (no longer needed)
- ✅ **Removed** manual `currentWeek` container addition (dashboard auto-instantiation handles this)
- ✅ **Removed** `createWeeklyEntries()` call when adding goals
- ✅ **Removed** `createWeeklyEntries()` call when editing goals
- ✅ **Removed** unused imports (`addWeeklyGoal`, `addWeeklyGoalsBatch`)
- ✅ **Simplified** goal creation flow - just adds to `dream.goals[]`

## How It Works Now

### Goal Creation Flow
1. User adds goal via Goals tab
2. Goal added to `dream.goals[]` array only ✅
3. Dashboard auto-instantiation reads from `dream.goals[]` and creates weekly instances automatically ✅
4. No template creation, no duplication ✅

### Rollover Flow
- Rollover reads from **both** sources:
  - `weeklyGoalTemplates[]` (for backward compatibility with existing templates)
  - `dream.goals[]` (for new goals, single source of truth)
- Rollover checks for template IDs to avoid duplicates (line 424 in `weekRollover.js`)

### Dashboard Auto-Instantiation
- Reads from `dream.goals[]` to create instances for current week (lines 128-183 in `useDashboardData.js`)
- Also reads from templates for backward compatibility (lines 189-239)
- Automatically creates instances when goals don't exist for current week

## Benefits
1. ✅ **No duplication** - Goals stored once in `dream.goals[]`
2. ✅ **Simpler code** - Removed unnecessary template creation logic
3. ✅ **Clear source of truth** - `dream.goals[]` is the single source
4. ✅ **Backward compatible** - Existing templates still work
5. ✅ **Automatic instantiation** - Dashboard handles instance creation

## Testing Checklist
- [ ] Create new goal via Goals tab - should appear on dashboard
- [ ] Edit goal - should update correctly
- [ ] Complete goal - should mark inactive
- [ ] Rollover - should work with goals from `dream.goals[]`
- [ ] Existing templates - should still work (backward compatibility)

## Files Changed
1. `src/context/AppContext.jsx` - Removed duplication logic
2. `src/hooks/useDreamTracker.js` - Simplified goal creation flow

## Notes
- Templates are kept for backward compatibility with existing data
- New goals should be added directly to `dream.goals[]`
- Dashboard auto-instantiation handles creating weekly instances automatically
- Rollover works with both templates and `dream.goals[]` (checks for duplicates)

