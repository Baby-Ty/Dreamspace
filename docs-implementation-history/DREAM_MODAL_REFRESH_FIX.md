# Dream Modal Refresh Fix - November 8, 2025

## Problem

The Goals tab in the Dream Tracker modal wasn't loading goals properly. While goals were showing up (templates were being saved correctly), there were issues with:
1. Goals not refreshing when added/deleted from the modal
2. Dashboard not updating when changes were made in the modal
3. Missing callback for parent component refresh

## Root Cause

The Dashboard component was missing the required `onUpdate` callback when rendering the `DreamTrackerModal`. This callback is used to:
1. Refresh the parent component when goals are deleted
2. Update the dream data when the Save button is clicked
3. Ensure dashboard data stays in sync with modal changes

**The Issue**:
```javascript
// BEFORE (broken):
<DreamTrackerModal
  dream={selectedDream}
  onClose={() => setSelectedDream(null)}
  // ❌ Missing onUpdate callback!
/>
```

According to `DreamTrackerModal.propTypes`, the `onUpdate` prop is **required**, but it wasn't being passed.

---

## Solution

Added the `onUpdate` callback to the Dashboard's `DreamTrackerModal` component to properly refresh data when the modal makes changes.

### Changes Made

**File**: `src/pages/dashboard/DashboardLayout.jsx`

#### 1. Import `loadCurrentWeekGoals` (Line 32)

```javascript
const {
  isLoadingWeekGoals,
  currentWeekGoals,
  stats,
  weeklyProgress,
  showAddGoal,
  setShowAddGoal,
  newGoal,
  setNewGoal,
  handleToggleGoal,
  handleAddGoal,
  loadCurrentWeekGoals,  // ✅ Added
  getCurrentWeekRange,
} = useDashboardData();
```

#### 2. Create Update Handler (Lines 60-65)

```javascript
const handleDreamUpdate = useCallback(() => {
  // Refresh dashboard data when dream is updated
  console.log('🔄 Dream updated, refreshing dashboard...');
  // Force refresh of current week goals
  loadCurrentWeekGoals();
}, [loadCurrentWeekGoals]);
```

#### 3. Pass Callback to Modal (Line 171)

```javascript
// AFTER (fixed):
<DreamTrackerModal
  dream={selectedDream}
  onClose={() => setSelectedDream(null)}
  onUpdate={handleDreamUpdate}  // ✅ Added
/>
```

---

## Additional Improvements

**File**: `src/hooks/useDreamTracker.js`

Added detailed logging to help debug goal loading issues:

```javascript
const dreamGoals = useMemo(() => {
  console.log(`🔍 Loading goals for dream "${dream.title}" (${dream.id})`);
  
  const templates = weeklyGoals.filter(g => 
    g.type === 'weekly_goal_template' && 
    g.dreamId === dream.id
  );
  console.log(`  📋 Found ${templates.length} templates from weeklyGoals`);
  
  const legacyGoals = (dream.goals || []).filter(g => g && g.id);
  console.log(`  📋 Found ${legacyGoals.length} legacy goals from dream.goals`);
  
  const combined = [...templates, ...uniqueLegacyGoals];
  console.log(`  ✅ Total goals for this dream: ${combined.length}`);
  
  return combined;
}, [weeklyGoals, dream.id, dream.goals, dream.title]);
```

This logging helps identify:
- When goals are loaded for a dream
- How many templates vs legacy goals are found
- Total goal count for debugging

---

## How the Callback Works

### When Goals Are Deleted

**File**: `src/hooks/useDreamTracker.js` (Lines 283-285)

```javascript
const handleDeleteGoal = useCallback(async (goalId) => {
  // ... delete goal logic ...
  
  // Trigger parent refresh to update dashboard/week ahead views
  if (onUpdate) {
    onUpdate();
  }
  
  // Also dispatch event for other listeners
  window.dispatchEvent(new CustomEvent('goals-updated'));
}, [/* ... */]);
```

**Flow**:
1. User clicks delete on a goal in the modal
2. Goal deleted from database
3. `onUpdate()` callback called → Dashboard refreshes
4. 'goals-updated' event dispatched → Other components refresh
5. Dashboard shows updated goal list

### When Dream Is Saved

**File**: `src/hooks/useDreamTracker.js` (Lines 393-396)

```javascript
const handleSave = useCallback(() => {
  onUpdate(localDream);
  setHasChanges(false);
}, [localDream, onUpdate]);
```

**Flow**:
1. User clicks "Save" button in modal
2. `onUpdate(localDream)` called with updated dream data
3. Parent component receives updated dream
4. Dashboard can update its local state

---

## Comparison: Dashboard vs Dream Book

### Dream Book (Already Correct)

**File**: `src/pages/dream-book/DreamBookLayout.jsx`

```javascript
{viewingDream && (
  <DreamTrackerModal
    dream={viewingDream}
    onClose={handleCloseDreamModal}
    onUpdate={handleUpdateDream}  // ✅ Already had this
  />
)}
```

The Dream Book was already passing the `onUpdate` callback correctly, which is why it worked properly.

### Dashboard (Now Fixed)

**File**: `src/pages/dashboard/DashboardLayout.jsx`

```javascript
{selectedDream && (
  <DreamTrackerModal
    dream={selectedDream}
    onClose={() => setSelectedDream(null)}
    onUpdate={handleDreamUpdate}  // ✅ Now added
  />
)}
```

The Dashboard now matches the Dream Book pattern.

---

## Testing

### Test 1: Delete Goal from Modal

**Steps**:
1. Open dream from Dashboard
2. Go to Goals tab
3. Delete a goal
4. Close modal

**Expected**:
- ✅ Console shows "🔄 Dream updated, refreshing dashboard..."
- ✅ Dashboard week goals widget refreshes
- ✅ Deleted goal no longer appears
- ✅ No need to manually refresh page

### Test 2: Add Goal from Modal

**Steps**:
1. Open dream from Dashboard
2. Go to Goals tab
3. Click "+ Add New Goal"
4. Fill in goal details
5. Save goal

**Expected**:
- ✅ Goal appears in Goals tab immediately
- ✅ Console shows goal loading logs
- ✅ Goal count updates

### Test 3: Console Logging

**Steps**:
1. Open dream modal
2. Check browser console

**Expected Console Output**:
```
🔍 Loading goals for dream "Read a Book a Month" (dream_123)
  📋 Found 1 templates from weeklyGoals
  📋 Found 0 legacy goals from dream.goals
  ✅ Total goals for this dream: 1
```

This helps debug any loading issues.

---

## Benefits

### Before Fix
- ❌ No callback when goals deleted
- ❌ Dashboard didn't refresh after modal changes
- ❌ Had to close/reopen modal or refresh page
- ❌ Unclear why goals weren't appearing

### After Fix
- ✅ Proper callback triggers refresh
- ✅ Dashboard auto-updates after changes
- ✅ Smooth user experience
- ✅ Detailed logging for debugging

---

## Related Files

1. **src/pages/dashboard/DashboardLayout.jsx** - Added onUpdate callback
2. **src/hooks/useDreamTracker.js** - Added debug logging
3. **src/hooks/useDashboardData.js** - Exports loadCurrentWeekGoals
4. **src/components/DreamTrackerModal.jsx** - Defines onUpdate prop requirement

---

## Architecture Notes

### Callback Pattern

The `onUpdate` callback follows React's "lift state up" pattern:
1. Child component (modal) makes changes
2. Child calls parent callback
3. Parent refreshes its data
4. Parent re-renders with fresh data
5. Child receives updated props if still open

This ensures:
- Single source of truth (parent owns data)
- Predictable data flow
- Easy to reason about state changes

### Event-Driven Updates

The modal also dispatches custom events:
```javascript
window.dispatchEvent(new CustomEvent('goals-updated'));
```

This allows multiple components to listen and refresh:
- Dashboard listens and refreshes
- WeekAhead listens and refreshes
- Any other component can subscribe

This provides loose coupling between components.

---

## Summary

✅ **Dashboard modal now properly refreshes**  
✅ **Added required onUpdate callback**  
✅ **Dashboard data stays in sync with modal changes**  
✅ **Added debugging logs for troubleshooting**  
✅ **Matches Dream Book pattern**  
✅ **Ready for production**

The fix ensures that when users make changes in the Dream Tracker modal from the Dashboard, those changes properly propagate back to the Dashboard view, eliminating the need for manual page refreshes and providing a seamless user experience.

