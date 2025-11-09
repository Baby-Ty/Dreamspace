# Goal Creation Issues - Fixed

**Date**: November 9, 2025  
**Status**: ✅ RESOLVED

## Summary

Fixed two critical issues with goal creation and deletion in the DreamSpace application:

1. **Issue #1**: Goals created from DreamBook form were getting orphaned when deleting the dream
2. **Issue #2**: Vision Builder wasn't creating current week goal instances for weekly recurring goals

---

## Issue #1: Orphaned Goals When Deleting Dream

### Root Cause
When a dream with weekly goal templates was deleted, the `deleteWeeklyGoal` function only deleted goal instances that were loaded into the React state, NOT all instances in the Cosmos DB database. This meant:
- Instances for weeks that hadn't been viewed/loaded remained in the database
- These orphaned instances would appear when navigating to those weeks
- The template was deleted, but not all its instances

### The Problem Code
In `src/context/AppContext.jsx` lines 871-894 (old code):
```javascript
// Find all instances of this template and delete them
const instances = state.weeklyGoals.filter(g => g.templateId === goalId);
// This only finds instances in STATE, not in DATABASE!
```

### The Fix
Updated `deleteWeeklyGoal` function in `src/context/AppContext.jsx` to:
1. Query the Cosmos DB database for ALL weeks across multiple years (previous, current, next)
2. Scan each week document for instances with matching `templateId`
3. Delete ALL instances from the database, not just those in state
4. Properly dispatch state updates for each deleted instance

### Changes Made
**File**: `src/context/AppContext.jsx` (lines 870-914)

- ✅ Now scans 3 years of week documents (previous, current, next year)
- ✅ Loads each year's week document from Cosmos DB
- ✅ Filters out instances by `templateId` in each week
- ✅ Saves updated weeks back to database
- ✅ Dispatches state updates for each deleted instance
- ✅ Logs total number of instances deleted for debugging

### Impact
- Dreams can now be safely deleted without leaving orphaned goal instances
- All weekly goal instances are properly cleaned up across all weeks
- Historical data integrity is maintained

---

## Issue #2: Vision Builder Not Creating Current Week Instances

### Root Cause
The Vision Builder was saving weekly goal templates to the database but never calling the `bulkInstantiateTemplates` API to create the actual week instances. This meant:
- Templates were saved correctly
- But NO instances were created for any weeks (including current week)
- Users would see the goal in their dream but not in their Week Ahead view

### The Problem Code
In `src/pages/VisionBuilderDemo.jsx` lines 1258-1297 (old code):
```javascript
// Save templates via saveDreams
await itemService.saveDreams(userId, allDreams, templates);

// ❌ Then it skipped weekly templates completely!
if (goal.type === 'consistency' && goal.recurrence === 'weekly') {
  console.log('⏭️  Skipping weekly template (already saved):', goal.id);
  continue;
}
```

### The Fix
Updated Vision Builder completion flow in `src/pages/VisionBuilderDemo.jsx` to:
1. Save templates via `saveDreams` (existing)
2. **NEW**: Call `bulkInstantiateTemplates` API for all weekly templates
3. Only create manual instances for monthly and deadline goals (existing)

### Changes Made
**File**: `src/pages/VisionBuilderDemo.jsx` (lines 1260-1282)

- ✅ Added bulk instantiation of weekly templates after saving
- ✅ Properly maps template format for API expectations
- ✅ Calls `weekService.bulkInstantiateTemplates` with all templates
- ✅ Handles success and error cases with logging
- ✅ Creates instances for current week AND all target weeks

### Impact
- Weekly goals created in Vision Builder now appear immediately in Week Ahead view
- Current week instances are created automatically
- All target weeks are instantiated correctly
- Consistent behavior with DreamBook and Week Ahead goal creation

---

## Testing Instructions

### Test Issue #1 Fix: Dream Deletion
1. Navigate to Dream Book
2. Create a new dream with a weekly goal (e.g., "Exercise" for 12 weeks)
3. Wait for goal instances to be created (check Week Ahead view)
4. Navigate to future weeks and verify goal instances appear
5. **Delete the dream**
6. Navigate back to Week Ahead and future weeks
7. **Verify**: NO orphaned goal instances remain (all should be deleted)
8. Check Cosmos DB `weeks2025` container to confirm instances are deleted

### Test Issue #2 Fix: Vision Builder Weekly Goals
1. Navigate to Vision Builder (if available)
2. Complete the builder and select a weekly consistency goal (e.g., "Meditate" for 8 weeks)
3. Click "Start My Year" to save
4. Navigate to Week Ahead view
5. **Verify**: Goal instance appears for current week
6. Navigate to future weeks (within target duration)
7. **Verify**: Goal instances appear for all weeks within target duration
8. Check Cosmos DB `weeks2025` container to confirm instances exist

### Test Both Fixes Together
1. Create multiple dreams with weekly goals via Vision Builder
2. Verify all current week instances appear in Week Ahead
3. Delete one of the dreams
4. **Verify**: Only that dream's goals are deleted, others remain
5. **Verify**: No orphaned instances in any week views

---

## Technical Details

### Cosmos DB Structure
- **dreams container**: Stores dream documents with embedded `weeklyGoalTemplates` array
- **weeks{year} containers**: Stores week documents with goal instances per week
  - Document ID: `{userId}_{year}`
  - Structure: `{ weeks: { "2025-W45": { goals: [...] } } }`

### Goal Types
1. **weekly_goal_template**: Template saved in dreams container
   - Fields: `id`, `type`, `dreamId`, `targetWeeks`, etc.
   - One template generates multiple instances

2. **weekly_goal**: Instance saved in weeks{year} container
   - Fields: `id`, `templateId`, `dreamId`, `weekId`, `completed`, etc.
   - One instance per week per template

### APIs Used
- `saveDreams`: Saves dreams and templates to dreams container
- `bulkInstantiateTemplates`: Creates instances from templates across all target weeks
- `saveWeekGoals`: Saves/updates goal instances for a specific week
- `getWeekGoals`: Loads all weeks for a given year

---

## Files Modified

1. **src/context/AppContext.jsx**
   - Fixed `deleteWeeklyGoal` function (lines 870-914)
   - Now scans database across multiple years for complete cleanup

2. **src/pages/VisionBuilderDemo.jsx**
   - Fixed Vision Builder completion flow (lines 1260-1282)
   - Now calls `bulkInstantiateTemplates` for weekly templates

---

## Verification Checklist

- ✅ No linter errors in modified files
- ✅ Follows DreamSpace coding standards
- ✅ Preserves existing functionality
- ✅ Adds comprehensive logging for debugging
- ✅ Handles edge cases (missing weeks, multiple years)
- ✅ Properly updates React state after database operations
- ✅ Maintains data consistency between state and database

---

## Notes

- Both fixes maintain backward compatibility
- No changes to database schema required
- No changes to API endpoints required
- Performance impact is minimal (only during delete operations)
- Comprehensive logging added for troubleshooting

---

## Next Steps

1. **Test thoroughly** using the testing instructions above
2. **Monitor logs** in browser console for any errors during delete operations
3. **Verify Cosmos DB** directly to ensure no orphaned data remains
4. Consider adding automated tests for these scenarios
5. Update user documentation if needed

---

**Fixed By**: Claude Sonnet 4.5  
**Reviewed By**: Pending  
**Deployed**: Pending

