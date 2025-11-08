# Dashboard Dream ID Bug Fix - November 8, 2025

## Problem

Goals created from the dashboard weren't being linked to the selected dream. The goals would show in "This Week's Goals" but when opening the dream detail modal, the goal wouldn't appear because the `dreamId` wasn't being set correctly.

## Root Cause

**The Bug**: Dream IDs are **strings** like `"dream_1234567890"`, but the dashboard code was trying to parse them as integers!

```javascript
// WRONG (before fix):
const dreamId = newGoal.dreamId ? parseInt(newGoal.dreamId, 10) : null;
// Result: parseInt("dream_1234567890", 10) returns NaN
```

### Why This Failed

1. User selects a dream from dropdown → `newGoal.dreamId = "dream_1234567890"` ✅
2. Code tries to parse string → `parseInt("dream_1234567890", 10) = NaN` ❌
3. Find dream by ID → `dream.id === NaN` → Always fails ❌
4. Result: `selectedDream = undefined`
5. Template created with:
   - `dreamId: NaN` ❌
   - `dreamTitle: ''` ❌
   - `dreamCategory: ''` ❌
6. Goal not linked to any dream ❌

### Impact

- Goals appeared in weekly view ✅
- Goals did NOT appear in dream detail modal ❌
- Users thought goals weren't being saved properly

---

## Solution

Remove the `parseInt` since dream IDs are already strings:

```javascript
// CORRECT (after fix):
const dreamId = newGoal.dreamId || null;
// Result: "dream_1234567890" (keeps the string as-is)
```

Now:
1. User selects dream → `newGoal.dreamId = "dream_1234567890"` ✅
2. No parsing → `dreamId = "dream_1234567890"` ✅
3. Find dream → `dream.id === "dream_1234567890"` → Success! ✅
4. Result: `selectedDream = { id: "dream_1234567890", title: "...", ... }`
5. Template created with:
   - `dreamId: "dream_1234567890"` ✅
   - `dreamTitle: "Read a Book a Month"` ✅
   - `dreamCategory: "Growth & Learning"` ✅
6. Goal properly linked to dream ✅

---

## Changes Made

### File: `src/hooks/useDashboardData.js`

**Line 161-163** (previously 162-163):
```javascript
// BEFORE:
// Convert dreamId to number for comparison (select returns string)
const dreamId = newGoal.dreamId ? parseInt(newGoal.dreamId, 10) : null;
const selectedDream = currentUser?.dreamBook?.find(dream => dream.id === dreamId);

// AFTER:
// Dream IDs are strings like "dream_1234567890", don't parseInt!
const dreamId = newGoal.dreamId || null;
const selectedDream = currentUser?.dreamBook?.find(dream => dream.id === dreamId);
```

**Line 169-174** (previously 169):
```javascript
// BEFORE:
console.log('📝 Adding goal from dashboard with consistency:', newGoal.consistency);

// AFTER:
console.log('📝 Adding goal from dashboard:', {
  consistency: newGoal.consistency,
  dreamId: dreamId,
  selectedDream: selectedDream?.title,
  hasDream: !!selectedDream
});
```

---

## Testing

### Test Scenario 1: Create Goal with Dream Selected

**Steps**:
1. Open dashboard
2. Click "+ Add New Goal"
3. Enter title: "Test from dash"
4. Select dream: "Read a Book a Month"
5. Choose frequency: "Weekly"
6. Set duration: 12 weeks
7. Click "Add Goal"

**Expected Result**:
- ✅ Goal appears in "This Week's Goals"
- ✅ Goal appears in dream detail modal under "Goals" tab
- ✅ Goal shows dream title badge
- ✅ Goal is linked to correct dream

### Test Scenario 2: Create Goal Without Dream

**Steps**:
1. Open dashboard
2. Click "+ Add New Goal"
3. Enter title: "Generic goal"
4. Leave dream dropdown as "Select a dream (optional)"
5. Click "Add Goal"

**Expected Result**:
- ✅ Goal appears in "This Week's Goals"
- ✅ Goal has `dreamId: null`
- ✅ No error occurs

---

## Why This Bug Existed

The comment said "Convert dreamId to number for comparison (select returns string)", which suggests the developer thought dream IDs were numbers. This was incorrect - dream IDs are generated as strings:

```javascript
// Dream creation in DreamBookLayout.jsx:
id: `dream_${Date.now()}`

// Example: "dream_1699999999999"
```

The select dropdown returns the value as-is (a string), and it should stay a string throughout the flow.

---

## Related Files

- `src/hooks/useDashboardData.js` - **FIXED**: Removed parseInt
- `src/pages/dream-book/DreamBookLayout.jsx` - Dream creation with string ID
- `src/pages/VisionBuilderDemo.jsx` - Dream creation with string ID
- `src/pages/dashboard/WeekGoalsWidget.jsx` - Dream selector dropdown (no changes needed)

---

## Summary

✅ **Dashboard goals now correctly link to selected dreams**  
✅ **Goals appear in both dashboard AND dream detail modal**  
✅ **Dream metadata (title, category) properly saved**  
✅ **No more NaN dreamIds**  
✅ **Improved logging for debugging**

This was a simple but critical bug - assuming IDs were numbers when they're actually strings. The fix ensures the data flow works correctly from form → template → display.

