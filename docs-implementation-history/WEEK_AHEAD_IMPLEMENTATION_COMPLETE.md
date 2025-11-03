# Dreams Week Ahead - Implementation Complete

**Date**: October 31, 2025  
**Status**: ✅ **COMPLETE** - Ready for Testing

---

## Summary

Successfully implemented the Dreams Week Ahead page to properly integrate with the 6-container architecture. Weekly goals are now correctly loaded from and saved to the `weeks{YEAR}` containers, with automatic current week loading and proper progress tracking.

---

## Changes Made

### 1. ✅ Enhanced weekService (`src/services/weekService.js`)

Added three new methods for managing week goals:

**`instantiateTemplatesForWeek(userId, year, weekId, templates)`**
- Creates goal instances from active templates for a specific week
- Filters templates based on durationType, startDate, and active status
- Saves instances to the weeks container
- Returns array of created instances

**`loadOrCreateWeekGoals(userId, year, weekId, templates)`**
- Main method for loading week data
- Checks if week exists in weeks container
- If exists: loads and returns goals
- If not exists: creates from templates automatically
- Handles both templates and instances correctly

**Benefits:**
- On-demand goal instantiation
- No unnecessary API calls
- Proper separation of templates vs instances

### 2. ✅ Updated AppContext (`src/context/AppContext.jsx`)

**Added `setWeeklyGoals` action:**
```javascript
setWeeklyGoals: (goals) => {
  dispatch({ type: actionTypes.SET_WEEKLY_GOALS, payload: goals });
}
```

**Verified `toggleWeeklyGoal` function:**
- ✅ Correctly saves instances to weeks container
- ✅ Updates specific week's section in year document
- ✅ Maintains proper weekId association
- ✅ Adds scoring when goals are completed
- ✅ Handles both templates (dreams container) and instances (weeks container)

### 3. ✅ Fixed DreamsWeekAhead Page (`src/pages/DreamsWeekAhead.jsx`)

**Added `loadWeekGoals(weekObj)` function:**
- Fetches goals for specific weekId from weeks container
- Generates instances from active templates if week not initialized
- Updates state with week-specific goals using setWeeklyGoals
- Properly filters and combines templates with instances

**Updated useEffect hooks:**
- ✅ Initial mount: Sets current week as active
- ✅ Week change: Loads goals when activeWeek changes
- ✅ Removed redundant template instantiation useEffect

**Calendar Display:**
- ✅ Shows 0% progress for unvisited weeks
- ✅ Shows actual progress for weeks with goals
- ✅ Properly tracks progress per week

---

## Data Flow

### On Page Load (Current Week)
```
1. Component mounts
2. First useEffect: getCurrentWeek() → setActiveWeek(currentWeek)
3. Second useEffect triggered by activeWeek change:
   - loadWeekGoals(currentWeek) called
   - weekService.loadOrCreateWeekGoals() fetches from weeks{YEAR}
   - If week exists: loads goals
   - If not exists: instantiates from templates → saves to weeks{YEAR}
4. Goals displayed for current week
```

### On Week Selection (Calendar)
```
1. User clicks different week
2. setActiveWeek(selectedWeek)
3. Second useEffect triggered:
   - loadWeekGoals(selectedWeek) called
   - Fetches from weeks{YEAR} container
   - Creates from templates if needed
4. Goals displayed for selected week
```

### On Goal Toggle
```
1. User clicks checkbox
2. toggleWeeklyGoal(goalId) in AppContext
3. Finds goal and creates updatedGoal
4. If goal has weekId (instance):
   - Saves to weeks{YEAR} container via weekService.saveWeekGoals()
   - Updates specific week's section
   - Adds scoring if completed
5. Dispatches TOGGLE_WEEKLY_GOAL to update state
6. UI updates to show completed status
```

---

## Database Structure

### weeks{YEAR} Container (e.g., weeks2025)
```javascript
{
  id: "user@email.com_2025",
  userId: "user@email.com",
  year: 2025,
  weeks: {
    "2025-W44": {
      goals: [
        {
          id: "template_123_2025-W44",
          templateId: "template_123",
          title: "Exercise 3 times",
          dreamId: "dream_456",
          dreamTitle: "Get Healthy",
          completed: false,
          weekId: "2025-W44",
          ...
        }
      ]
    },
    "2025-W43": {
      goals: [...]
    }
  },
  createdAt: "2025-10-31T...",
  updatedAt: "2025-10-31T..."
}
```

### dreams Container (Templates)
```javascript
{
  id: "template_123",
  userId: "user@email.com",
  type: "weekly_goal_template",
  title: "Exercise 3 times",
  dreamId: "dream_456",
  recurrence: "weekly",
  active: true,
  durationType: "unlimited",
  startDate: "2025-10-01T...",
  ...
}
```

---

## Testing Checklist

### Manual Testing Steps

1. **Current Week Auto-Load**
   - [ ] Navigate to Dreams Week Ahead page
   - [ ] Verify current week is automatically selected
   - [ ] Verify goals from templates appear
   - [ ] Check browser console for "Loading goals for week 2025-W44" message

2. **Goal Completion**
   - [ ] Click checkbox on a goal
   - [ ] Verify goal shows as completed
   - [ ] Refresh page - verify goal stays completed
   - [ ] Check scoring points updated

3. **Week Navigation**
   - [ ] Click "Change Week" button
   - [ ] Select different week from calendar
   - [ ] Verify different goals load
   - [ ] Return to current week - verify goals are same

4. **Template Instantiation**
   - [ ] Create new recurring goal template
   - [ ] Navigate to current week
   - [ ] Verify new goal appears
   - [ ] Navigate to next week
   - [ ] Verify same goal appears for next week

5. **Progress Tracking**
   - [ ] Complete all goals in current week
   - [ ] Verify progress shows 100%
   - [ ] Navigate to calendar view
   - [ ] Verify current week shows correct progress
   - [ ] Verify other weeks show 0% or their actual progress

6. **Database Verification**
   - [ ] Check Azure Cosmos DB weeks2025 container
   - [ ] Verify document structure matches expected format
   - [ ] Verify each week has its own section
   - [ ] Verify completed goals saved correctly

---

## Key Features Implemented

✅ **On-Demand Loading**: Goals loaded only when week is accessed  
✅ **Auto-Instantiation**: Templates automatically create instances for new weeks  
✅ **Proper State Management**: Uses AppContext actions correctly  
✅ **Container Separation**: Templates in dreams, instances in weeks{YEAR}  
✅ **Progress Tracking**: Per-week progress calculation  
✅ **Calendar View**: Shows progress for all weeks  
✅ **Scoring Integration**: Points awarded when goals completed  
✅ **No Duplication**: Checks before creating instances  

---

## Files Modified

1. `src/services/weekService.js` - Added instantiation methods
2. `src/context/AppContext.jsx` - Added setWeeklyGoals action
3. `src/pages/DreamsWeekAhead.jsx` - Added loadWeekGoals function, updated useEffects

---

## Backend Verification

The backend APIs are already correctly implemented:

✅ `api/getWeekGoals/index.js` - Loads week document from weeks{YEAR}  
✅ `api/saveWeekGoals/index.js` - Saves week goals to weeks{YEAR}  
✅ `api/getUserData/index.js` - Flattens weeks structure on load  

No backend changes were needed.

---

## Next Steps

1. **Deploy and Test**: Deploy to staging/production and test manually
2. **Monitor Logs**: Check console logs for proper data flow
3. **Verify Database**: Ensure weeks{YEAR} containers are being populated
4. **User Testing**: Have users test the week planning workflow

---

## Notes

- The implementation follows the existing 6-container architecture
- All changes are backward compatible
- Templates remain in dreams container for easy management
- Week instances are properly isolated in yearly containers
- The page now fully supports the weekYear container structure as originally intended


