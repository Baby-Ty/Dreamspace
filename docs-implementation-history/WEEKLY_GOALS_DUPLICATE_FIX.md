# Weekly Goals Duplicate and Visibility Fix

**Date**: November 7, 2025  
**Status**: ✅ Completed  
**Issue**: Weekly goals showing duplicates and not appearing immediately after adding

---

## Problems Identified

### 1. Duplicate Goals Display
**Symptom**: Sometimes weekly goals would appear twice in the Week Ahead view, but disappear after refresh

**Root Cause**: 
- For the current week, the `visibleGoals` logic was showing both:
  - Active templates (to display as if they're goals for the week)
  - Current week instances (actual goal instances from the weeks container)
- When an instance was created from a template, both the template and its instance would display
- No deduplication logic existed to filter out instances that matched visible templates

### 2. Goals Not Appearing Immediately
**Symptom**: After adding a goal, sometimes user needs to refresh or navigate away and back before it shows

**Root Cause**:
- Race condition in the save/load flow:
  1. `addWeeklyGoal()` optimistically updates state
  2. Backend save happens asynchronously
  3. `loadWeekGoals()` was called immediately after
  4. If the load completed before the save, the new goal would disappear temporarily
  5. This created a flicker effect where the goal appeared, disappeared, then reappeared

---

## Solutions Implemented

### Fix 1: Deduplicate Visible Goals
**File**: `src/pages/DreamsWeekAhead.jsx` (lines 716-725)

Added deduplication logic to filter out instance goals that are duplicates of visible templates:

```javascript
// Create a set of template IDs that are being shown
const visibleTemplateIds = new Set(validTemplates.map(t => t.id));

// Filter out instances that are duplicates of visible templates
// An instance is a duplicate if it has a templateId that matches a visible template
const uniqueInstances = currentWeekInstances.filter(instance => 
  !instance.templateId || !visibleTemplateIds.has(instance.templateId)
);

return [...validTemplates, ...uniqueInstances];
```

**How It Works**:
- Creates a Set of all template IDs that are being displayed
- Filters instances to exclude any that have a `templateId` matching a visible template
- Only shows the template OR its instance, never both

### Fix 2: Remove Redundant Reload Calls
**File**: `src/pages/DreamsWeekAhead.jsx` (lines 434-435, 469-470)

Removed the `loadWeekGoals()` calls after adding new goals:

**Before**:
```javascript
await addWeeklyGoal(newGoal);

// Force reload goals for the active week
if (activeWeek) {
  loadedWeeksRef.current.delete(activeIsoWeek);
  await loadWeekGoals(activeWeek);
}
```

**After**:
```javascript
await addWeeklyGoal(newGoal);

// Note: Removed redundant loadWeekGoals call - state is already updated optimistically
// This prevents race conditions where reload happens before save completes
```

**Why This Works**:
- `addWeeklyGoal()` already updates state optimistically (before backend save)
- The UI reflects the new goal immediately from state
- No need to reload from backend since state is already correct
- Eliminates the race condition entirely

---

## Technical Details

### State Management Flow
1. **Templates** (type: `weekly_goal_template`):
   - Stored in dreams container
   - Loaded once at app initialization
   - Displayed for current week if active

2. **Instances** (type: `weekly_goal`, has `weekId` and `templateId`):
   - Stored in weeks container
   - Created from templates or as one-time goals
   - Linked to template via `templateId` field

3. **Display Logic** (current week):
   - Show valid templates (filtered by duration, start date, etc.)
   - Show current week instances that DON'T match visible templates
   - Result: User sees each goal once, not twice

### Optimistic Updates
- When adding a goal, state is updated immediately
- Backend save happens asynchronously
- No reload is needed since state is already correct
- If backend save fails, error handling would need to revert state (already exists in AppContext)

---

## Testing Recommendations

1. **Add One-Time Goal**: 
   - Add a new one-time goal
   - Verify it appears immediately without flicker
   - Refresh page and verify it's still there

2. **Add Recurring Goal**:
   - Add a new weekly recurring goal
   - Verify it appears immediately in current week
   - Navigate to future weeks and verify instances appear

3. **Check for Duplicates**:
   - Create a recurring goal with current week in range
   - Verify only ONE instance appears in Week Ahead
   - Complete the goal and verify only one is marked complete
   - Refresh and verify still only one goal shows

4. **Navigation**:
   - Add goal to current week
   - Navigate away (to Dreams or Dashboard)
   - Navigate back to Week Ahead
   - Verify goal is still visible

---

## Files Modified

1. **src/pages/DreamsWeekAhead.jsx**:
   - Lines 716-725: Added deduplication logic for visible goals
   - Lines 434-435: Removed redundant reload for recurring goals
   - Lines 469-470: Removed redundant reload for one-time goals

---

## Related Issues

- **Optimistic Updates**: AppContext already implements optimistic updates correctly
- **Week Loading**: `loadedWeeksRef` prevents redundant week loads
- **Template Validation**: `isTemplateActiveForWeek()` properly filters templates by duration

---

## Notes

- The fix maintains the existing optimistic update pattern
- No changes to backend APIs required
- No changes to data structure or storage
- Purely a frontend display and timing issue


