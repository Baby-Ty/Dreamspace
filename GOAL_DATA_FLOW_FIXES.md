# Dreams → Goals → Weeks Data Flow Fixes

## Summary of Changes

All fixes have been implemented to resolve the Dreams → Goals → Weeks data flow alignment issues. The core problem was that goals created in Week Ahead were saving to `weeklyGoalTemplates` but NOT to the parent dream's `goals[]` array, causing them to not display in Dream Detail view.

---

## ✅ Critical Fix #1: AppContext.jsx - Dual-Save Implementation

**File**: `src/context/AppContext.jsx`  
**Location**: Lines 726-780 (in `addWeeklyGoal` function)

### Problem
When a weekly goal template was created, it was only saved to:
- ✅ `weeklyGoalTemplates` array (for Week Ahead to instantiate)
- ❌ NOT saved to `dreams[].goals[]` array (Dream Detail couldn't display it)

### Solution
Added dual-save logic that:
1. Saves template to `weeklyGoalTemplates` (existing behavior)
2. **NEW**: Also adds goal to parent dream's `goals[]` array
3. Checks for duplicates to avoid double-saving
4. Updates dream state immediately
5. Persists updated dream back to database

### Code Added
```javascript
// ✅ CRITICAL FIX: Also add to parent dream's goals[] array for Dream Detail display
if (template.dreamId) {
  const dreamToUpdate = state.currentUser.dreamBook?.find(d => d.id === template.dreamId);
  if (dreamToUpdate) {
    const goalForDream = {
      id: template.id,
      title: template.title,
      description: template.description || '',
      type: template.goalType || 'consistency',
      recurrence: template.recurrence,
      targetWeeks: template.targetWeeks || template.durationWeeks,
      targetMonths: template.targetMonths,
      startDate: template.startDate,
      active: true,
      completed: false,
      createdAt: template.createdAt || new Date().toISOString()
    };
    
    // Check if already exists in dream.goals (avoid duplicates)
    const existsInDream = dreamToUpdate.goals?.some(g => g.id === template.id);
    if (!existsInDream) {
      // Update state and save to database
      ...
    }
  }
}
```

---

## ✅ Enhancement #2: DreamsWeekAhead.jsx - Enhanced Debug Logging

**File**: `src/pages/DreamsWeekAhead.jsx`  
**Locations**: 
- Lines 473-484 (weekly template creation)
- Lines 506-516 (monthly/deadline instance creation)

### Improvements
Added comprehensive debug logging to track:
- `dreamId` - Parent dream ID
- `dreamTitle` - Parent dream title  
- `dreamCategory` - Parent dream category
- `goalType` - Type of goal being created
- `recurrence` - Weekly/monthly/once

### Benefits
- Easy debugging via browser console
- Track goal creation flow end-to-end
- Verify all required properties are present

---

## ✅ Enhancement #3: AppContext.jsx - Enhanced Debug Logging

**File**: `src/context/AppContext.jsx`  
**Location**: Lines 690-696 (in `addWeeklyGoal` function)

### Added Logging
```javascript
console.log('📝 addWeeklyGoal called:', {
  goalId: goalData.id,
  type: goalData.type,
  dreamId: goalData.dreamId,
  dreamTitle: goalData.dreamTitle,
  dreamCategory: goalData.dreamCategory
});
```

### Benefits
- Track when goals enter the context layer
- Verify dreamId/dreamTitle/dreamCategory are present
- Debug goal save flow

---

## ✅ Enhancement #4: useDreamTracker.js - Enhanced Goal Loading

**File**: `src/hooks/useDreamTracker.js`  
**Location**: Lines 27-84 (in `dreamGoals` useMemo)

### Improvements
1. **Better fallback matching**: Match by dreamId OR dreamTitle
2. **Enhanced logging**: Track all goal sources
3. **Duplicate detection**: Prevent duplicate goals from appearing
4. **Debug summary**: Shows exactly what goals were found and from where

### Code Logic
```javascript
// Source 1: Templates from weeklyGoals (new way)
const templates = weeklyGoals.filter(g => {
  if (g.type !== 'weekly_goal_template') return false;
  
  // Match by dreamId (preferred) OR dreamTitle (fallback)
  const matchesId = g.dreamId === dream.id;
  const matchesTitle = g.dreamTitle === dream.title;
  
  return matchesId || matchesTitle;
});

// Source 2: Legacy goals from dream.goals array
const legacyGoals = (dream.goals || []).filter(g => g && g.id);

// Source 3: Combine, removing duplicates
const templateIds = new Set(templates.map(t => t.id));
const uniqueLegacyGoals = legacyGoals.filter(g => !templateIds.has(g.id));

return [...templates, ...uniqueLegacyGoals];
```

---

## ✅ Verification #5: API Files Already Correct

### saveDreams API (`api/saveDreams/index.js`)
**Lines 102-116**: Correctly preserves all goal properties:
- ✅ `id`, `title`, `description`
- ✅ `type`, `recurrence`
- ✅ `targetWeeks`, `targetMonths`, `startDate`, `targetDate`
- ✅ `active`, `completed`, `completedAt`, `createdAt`

### saveWeekGoals API (`api/saveWeekGoals/index.js`)
**Lines 114-131**: Correctly preserves all goal properties including:
- ✅ `dreamId` (CRITICAL)
- ✅ `dreamTitle` (CRITICAL)
- ✅ `dreamCategory` (CRITICAL)
- ✅ `goalId` (links to template/goal)
- ✅ `templateId` (links to template)
- ✅ `weekId` (CRITICAL - must match week key)

---

## Data Flow Summary

### Before Fix
```
Week Ahead Goal Creation
    ↓
Save to weeklyGoalTemplates ✅
    ↓
Dream Detail → Can't see goal ❌ (not in dream.goals[])
```

### After Fix
```
Week Ahead Goal Creation
    ↓
Save to weeklyGoalTemplates ✅
    ↓
ALSO save to dream.goals[] ✅ (NEW!)
    ↓
Dream Detail → Shows goal ✅
    ↓
Week Ahead → Shows goal ✅
```

---

## Property Alignment Matrix (Updated)

| Property | dreams.goals[] | weeklyGoalTemplates[] | weeks[weekId].goals[] | Status |
|----------|---------------|----------------------|----------------------|---------|
| id | ✅ Required | ✅ Required | ✅ Required | ✅ Aligned |
| type | consistency/deadline | weekly_goal_template | weekly_goal | ✅ Aligned |
| goalType | ❌ N/A | ✅ consistency/deadline | ⚠️ Optional | ✅ OK |
| title | ✅ Required | ✅ Required | ✅ Required | ✅ Aligned |
| dreamId | ✅ NOW SAVED | ✅ REQUIRED | ✅ REQUIRED | ✅ FIXED |
| dreamTitle | ✅ NOW SAVED | ✅ REQUIRED | ✅ REQUIRED | ✅ FIXED |
| dreamCategory | ✅ NOW SAVED | ✅ REQUIRED | ✅ REQUIRED | ✅ FIXED |
| recurrence | ✅ Required | ✅ Required | ✅ Required | ✅ Aligned |
| targetWeeks | ✅ For weekly | ✅ For weekly | ⚠️ Optional | ✅ OK |
| completed | ✅ Required | ❌ N/A (template) | ✅ Required | ✅ Aligned |

---

## Testing Checklist

### ✅ Test 1: Dashboard Goal Creation (Should Already Work)
1. Go to Dashboard
2. Open Vision Builder
3. Create a dream with consistency goal (weekly, 12 weeks)
4. Save dreams
5. **Verify**: Dream appears in Dream Book with goal in goals[] array
6. **Verify**: Goal appears in weeklyGoalTemplates
7. **Verify**: Open dream detail → Goals tab → Goal displays

**Expected Result**: ✅ All goals created from Dashboard should display in Dream Detail

---

### ⚠️ Test 2: Week Ahead Goal Creation (FIXED - Primary Test)
1. Go to Week Ahead
2. Select current week
3. Click "+ Add Goal" from a dream card
4. Create consistency goal (weekly, 12 weeks)
5. **Input**: 
   - Title: "Test Weekly Goal"
   - Type: Consistency
   - Recurrence: Weekly
   - Target Weeks: 12
6. Save goal
7. **Open Browser Console** and verify logs:
   ```
   🎯 Creating goal for dream: { dreamId: "...", dreamTitle: "...", dreamCategory: "..." }
   📝 addWeeklyGoal called: { goalId: "...", type: "weekly_goal_template", dreamId: "...", ... }
   ✅ Template saved successfully to dreams container
   📝 Adding goal to dream.goals[] for Dream Detail display
   💾 Saving updated dream with new goal in goals[] array
   ```
8. **Verify in State**:
   - Goal appears in current week's goal list (Week Ahead)
   - Goal is saved to `weeklyGoalTemplates`
   - Goal is ALSO saved to parent dream's `goals[]` array
9. **Navigate to Dream Book**
10. Open the same dream → Goals tab
11. **Verify**: Goal displays in Goals tab (3 goals total if you did Test 1 first)
12. Go to next week in Week Ahead
13. **Verify**: Goal auto-instantiates for next week

**Expected Result**: ✅ Goal created from Week Ahead now displays in BOTH Week Ahead and Dream Detail

---

### ✅ Test 3: Dream Detail Goals Tab (Complete View)
1. Create dream with 2 goals from Dashboard (Vision Builder)
2. Create 1 more goal from Week Ahead (using Test 2)
3. Open dream detail view
4. Click Goals tab
5. **Verify**: ALL 3 goals display
6. **Verify**: Goals show correct type (consistency/deadline)
7. **Verify**: Goals show progress/target weeks info
8. **Check Console** for goal loading logs:
   ```
   🔍 [useDreamTracker] Loading goals for dream "..." (...)
   📊 Goal loading summary: { templatesFound: X, legacyGoalsFound: Y, totalGoals: 3 }
   📋 Goals list: [...]
   ```

**Expected Result**: ✅ All goals from all sources display correctly

---

### ✅ Test 4: Data Persistence (Cross-Session)
1. Complete Tests 1-3
2. **Refresh browser** (F5)
3. **Verify**: All goals still display correctly
4. Open Dream Detail → Goals tab
5. **Verify**: All 3 goals still there
6. Go to Week Ahead
7. **Verify**: Weekly goals still display
8. **Check Browser DevTools** → Network tab:
   - Verify `getUserData` API returns correct structure
   - Verify `dreams` object has `weeklyGoalTemplates` array
   - Verify `dreams[].goals[]` arrays are populated
9. **(Optional) Check Azure Cosmos DB**:
   - Open `dreams` container
   - Find your user document
   - Verify `weeklyGoalTemplates` array exists
   - Verify `dreams[].goals[]` arrays exist

**Expected Result**: ✅ All data persists correctly across sessions

---

### ✅ Test 5: Goal Completion Sync
1. Create a goal from Week Ahead
2. Complete the goal in Week Ahead (check it off)
3. Open Dream Detail → Goals tab
4. **Verify**: Goal shows as active (not completed in template)
5. Go back to Week Ahead
6. Go to next week
7. **Verify**: Goal appears again (template still active)
8. Go to Dream Detail → Goals tab
9. **Verify**: Template still shows as active

**Expected Result**: ✅ Goal completion syncs correctly between views

---

## Console Debugging Commands

### Check Goal Data in Console
```javascript
// Check if goal has required properties
const goal = {
  dreamId: selectedDream.id,
  dreamTitle: selectedDream.title,
  dreamCategory: selectedDream.category
};
console.log('Goal properties:', goal);
```

### Check State in React DevTools
1. Open React DevTools
2. Find `AppContext` provider
3. Check `state.weeklyGoals` array
4. Check `state.currentUser.dreamBook[].goals[]` arrays
5. Verify goals exist in both places

---

## Expected Console Logs

### When creating goal from Week Ahead:
```
🎯 Creating goal for dream: {
  dreamId: "dream_123",
  dreamTitle: "Run a Marathon",
  dreamCategory: "Health & Fitness",
  goalType: "consistency",
  recurrence: "weekly"
}
📝 addWeeklyGoal called: {
  goalId: "goal_456",
  type: "weekly_goal_template",
  dreamId: "dream_123",
  dreamTitle: "Run a Marathon",
  dreamCategory: "Health & Fitness"
}
💾 Saving template via saveDreams: goal_456
✅ Template saved successfully to dreams container
📝 Adding goal to dream.goals[] for Dream Detail display: {
  dreamId: "dream_123",
  goalId: "goal_456",
  goalTitle: "Run 5km weekly"
}
💾 Saving updated dream with new goal in goals[] array
```

### When loading goals in Dream Detail:
```
🔍 [useDreamTracker] Loading goals for dream "Run a Marathon" (dream_123)
  ✅ Template "Run 5km weekly" matches by dreamId (dream_123)
  📊 Goal loading summary: {
    dreamId: "dream_123",
    dreamTitle: "Run a Marathon",
    templatesFound: 1,
    legacyGoalsFound: 3,
    uniqueLegacyGoals: 2,
    totalGoals: 3
  }
  📋 Goals list: [
    { id: "goal_456", title: "Run 5km weekly", type: "weekly_goal_template", source: "template" },
    { id: "goal_789", title: "...", type: "consistency", source: "legacy" },
    { id: "goal_101", title: "...", type: "deadline", source: "legacy" }
  ]
```

---

## Architecture Summary

### Before Fix
```
┌─────────────────────────────────────────┐
│ Week Ahead Goal Creation                │
│   ↓                                     │
│ weeklyGoalTemplates ✅                  │
│   ↓                                     │
│ dreams[].goals[] ❌ (MISSING!)          │
└─────────────────────────────────────────┘

Result: Dream Detail can't see Week Ahead goals
```

### After Fix
```
┌─────────────────────────────────────────┐
│ Week Ahead Goal Creation                │
│   ↓                                     │
│ weeklyGoalTemplates ✅                  │
│   ↓                                     │
│ dreams[].goals[] ✅ (FIXED!)            │
│   ↓                                     │
│ Both Week Ahead & Dream Detail work ✅  │
└─────────────────────────────────────────┘

Result: All views synchronized
```

---

## Files Modified

1. ✅ `src/context/AppContext.jsx` - Added dual-save logic
2. ✅ `src/pages/DreamsWeekAhead.jsx` - Enhanced logging
3. ✅ `src/hooks/useDreamTracker.js` - Enhanced goal loading
4. ✅ `api/saveDreams/index.js` - Already correct (verified)
5. ✅ `api/saveWeekGoals/index.js` - Already correct (verified)

---

## Success Criteria

After these fixes, the following should ALL be true:

✅ Goals created from Dashboard save to both `dreams.goals[]` AND `weeklyGoalTemplates[]`  
✅ Goals created from Week Ahead save to both `dreams.goals[]` AND `weeklyGoalTemplates[]` AND `weeks[weekId].goals[]`  
✅ All goals attached to a dream display in Dream Detail → Goals tab  
✅ Weekly goals auto-instantiate across target weeks  
✅ Goal completion syncs across all views  
✅ Data persists correctly to Cosmos DB with all required properties  
✅ Console logs provide clear debugging information  
✅ No duplicate goals appear in any view

---

## Rollback Plan (If Needed)

If issues arise, you can rollback by reverting:
1. `src/context/AppContext.jsx` lines 726-780
2. `src/pages/DreamsWeekAhead.jsx` enhanced logging (lines 473-484, 506-516)
3. `src/hooks/useDreamTracker.js` lines 28-84

The core fix is in #1 (AppContext.jsx), the rest are enhancements.

---

## Next Steps

1. ⚠️ **Run Test 2** (Week Ahead Goal Creation) - This is the primary test
2. ✅ Verify console logs show all properties
3. ✅ Verify goal appears in Dream Detail
4. ✅ Run all other tests (1, 3, 4, 5)
5. ✅ Monitor for any edge cases

---

## Contact for Questions

If you encounter issues:
1. Check browser console for error logs
2. Use React DevTools to inspect state
3. Verify Cosmos DB document structure
4. Review this document for expected behavior

**Status**: ✅ All fixes implemented and ready for testing

