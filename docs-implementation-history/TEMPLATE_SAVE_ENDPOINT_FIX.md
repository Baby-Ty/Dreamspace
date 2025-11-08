# Template Save Endpoint Fix - November 8, 2025

## Problem

Goals created from WeekAhead weren't appearing anywhere. The console showed a 400 error:

```
❌ Error saving item: {
  error: 'Invalid endpoint for saving dreams/templates',
  details: 'Dreams and weekly goal templates must be saved together...'
}
```

## Root Cause

The backend API was updated to enforce the 6-container architecture, where dreams and templates are stored together in a single document per user in the `dreams` container.

**The Issue**:
- Frontend was calling `itemService.saveItem(userId, 'weekly_goal_template', template)` ❌
- Backend rejects this with 400 error ❌
- Backend requires using `/saveDreams` endpoint instead ✅

### Why This Architecture?

The 6-container architecture specifies:
- **Dreams container**: One document per user containing:
  - `dreams` array (all user's dreams)
  - `weeklyGoalTemplates` array (all goal templates)
- **Weeks containers**: Separate documents for goal instances by week

This ensures atomic operations when saving dreams and templates together.

---

## Solution

Updated `AppContext.jsx` to use `itemService.saveDreams(userId, dreams, templates)` instead of `saveItem` for all template operations.

### Changes Made

**File**: `src/context/AppContext.jsx`

#### 1. `addWeeklyGoal` - Create Template (Lines 591-620)

**Before**:
```javascript
// WRONG: Trying to save template individually
const result = await itemService.saveItem(userId, 'weekly_goal_template', template);
```

**After**:
```javascript
// CORRECT: Save all dreams and templates together
const dreams = state.currentUser?.dreamBook || [];
const existingTemplates = state.weeklyGoals?.filter(g => g.type === 'weekly_goal_template') || [];
const allTemplates = [...existingTemplates, template];

const result = await itemService.saveDreams(userId, dreams, allTemplates);
```

**Logic**:
1. Create new template object
2. Get all current dreams from state
3. Get all existing templates from state
4. Add new template to templates array
5. Save everything together via `saveDreams`
6. Then bulk instantiate across weeks

#### 2. `updateWeeklyGoal` - Update Template (Lines 769-790)

**Before**:
```javascript
// WRONG: Trying to update template individually
const result = await itemService.saveItem(userId, 'weekly_goal_template', goal);
```

**After**:
```javascript
// CORRECT: Save all dreams and templates together
const dreams = state.currentUser?.dreamBook || [];
const allTemplates = state.weeklyGoals?.filter(g => g.type === 'weekly_goal_template') || [];

const result = await itemService.saveDreams(userId, dreams, allTemplates);
```

**Logic**:
1. Update template in state (dispatch)
2. Get all current dreams
3. Get all templates (including updated one from state)
4. Save everything together

#### 3. `deleteWeeklyGoal` - Delete Template (Lines 819-835)

**Before**:
```javascript
// WRONG: Trying to delete template individually
const result = await itemService.deleteItem(userId, goalId);
```

**After**:
```javascript
// CORRECT: Save all dreams and templates (excluding deleted one)
const dreams = state.currentUser?.dreamBook || [];
const allTemplates = state.weeklyGoals?.filter(g => 
  g.type === 'weekly_goal_template' && g.id !== goalId
) || [];

const result = await itemService.saveDreams(userId, dreams, allTemplates);
```

**Logic**:
1. Get all current dreams
2. Get all templates EXCEPT the one being deleted
3. Save updated arrays (deletion by omission)
4. Then delete instances from weeks container

#### 4. `deleteDream` - Delete Dream (Lines 562-586)

**Before**:
```javascript
// WRONG: Passing empty templates array
const result = await itemService.saveDreams(userId, updatedDreams, []);
```

**After**:
```javascript
// CORRECT: Keep templates not tied to deleted dream
const updatedDreams = state.currentUser.dreamBook.filter(d => d.id !== dreamId);
const remainingTemplates = state.weeklyGoals?.filter(g => 
  g.type === 'weekly_goal_template' && g.dreamId !== dreamId
) || [];

const result = await itemService.saveDreams(userId, updatedDreams, remainingTemplates);
```

**Logic**:
1. Remove dream from dreams array
2. Keep templates that don't belong to deleted dream
3. Save updated arrays

---

## Backend Validation

**File**: `api/saveItem/index.js` (Lines 60-72)

The backend explicitly rejects template saves:

```javascript
if (type === 'dream' || type === 'weekly_goal_template') {
  context.res = {
    status: 400,
    body: JSON.stringify({ 
      error: 'Invalid endpoint for saving dreams/templates',
      details: `Dreams and weekly goal templates must be saved together using the saveDreams endpoint...`
    }),
    headers
  };
  return;
}
```

**Why?**
- Ensures atomic operations
- Prevents data inconsistency
- Enforces 6-container architecture
- One document per user in dreams container

---

## API Endpoint Details

### `/saveDreams` (POST)

**Request Body**:
```json
{
  "userId": "user@example.com",
  "dreams": [
    {
      "id": "dream_123",
      "title": "Read a Book a Month",
      "description": "...",
      "goals": [...],
      ...
    }
  ],
  "weeklyGoalTemplates": [
    {
      "id": "goal_456",
      "type": "weekly_goal_template",
      "title": "Weekly from dreamview",
      "dreamId": "dream_123",
      "recurrence": "weekly",
      "targetWeeks": 12,
      ...
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "id": "user@example.com",
  "dreamsCount": 5,
  "templatesCount": 3
}
```

---

## Data Flow After Fix

### Creating Goal from WeekAhead

1. **User creates goal**
   - Selects dream
   - Sets title, frequency, duration
   - Clicks "Add Goal"

2. **Frontend** (`DreamsWeekAhead.jsx`):
   - Creates template object with `dreamId`
   - Calls `addWeeklyGoal(template)`

3. **AppContext** (`addWeeklyGoal`):
   - Adds template to state
   - Gets all dreams and templates
   - Calls `itemService.saveDreams(userId, dreams, allTemplates)` ✅

4. **Backend** (`/saveDreams`):
   - Validates request
   - Upserts dreams document with dreams + templates arrays ✅
   - Returns success

5. **AppContext** (continued):
   - Bulk instantiates template across all target weeks
   - Creates instances in weeks container

6. **Result**:
   - Template saved in dreams container ✅
   - Instances created in weeks container ✅
   - Goal appears in Week Ahead ✅
   - Goal appears in Dream Book (via dreamId filter) ✅

---

## Testing Checklist

### Test 1: Create Goal from WeekAhead

**Steps**:
1. Open Week Ahead
2. Click "+ Add New Goal"
3. Enter title: "weekly from dreamview"
4. Select dream: "Read a Book a Month"
5. Choose frequency: "Weekly"
6. Set duration: 12 weeks
7. Click "Add Goal"

**Expected**:
- ✅ No 400 error in console
- ✅ Template saved successfully (check console logs)
- ✅ Goal appears in "This Week's Goals"
- ✅ Goal appears in selected dream's Goals tab
- ✅ Goal has dreamId set correctly

### Test 2: Create Goal from Dashboard

**Steps**:
1. Open Dashboard
2. Click "+ Add New Goal"
3. Enter title and select dream
4. Click "Add Goal"

**Expected**:
- ✅ Goal saved with dreamId
- ✅ Goal appears in dashboard
- ✅ Goal appears in dream detail modal

### Test 3: Update Template

**Steps**:
1. Open dream detail modal
2. Edit a goal (change title)
3. Save changes

**Expected**:
- ✅ Template updated in dreams container
- ✅ Changes persist after page reload

### Test 4: Delete Template

**Steps**:
1. Open dream detail modal
2. Delete a goal
3. Confirm deletion

**Expected**:
- ✅ Template removed from dreams container
- ✅ Instances removed from weeks container
- ✅ Goal disappears from all views

### Test 5: Delete Dream

**Steps**:
1. Delete a dream that has goals
2. Check other dreams' goals are intact

**Expected**:
- ✅ Dream deleted
- ✅ Templates tied to that dream deleted
- ✅ Other templates remain intact

---

## Architecture Benefits

### Before (Broken)
- ❌ Trying to save templates individually
- ❌ Backend rejects with 400 error
- ❌ Goals don't save
- ❌ User experience broken

### After (Fixed)
- ✅ Templates saved with dreams in single document
- ✅ Atomic operations (all or nothing)
- ✅ Follows 6-container architecture
- ✅ No data inconsistency
- ✅ Goals save reliably

### Data Structure

**Dreams Container** (one document per user):
```json
{
  "id": "user@example.com",
  "userId": "user@example.com",
  "dreams": [...],
  "weeklyGoalTemplates": [...],
  "createdAt": "2025-11-08T...",
  "updatedAt": "2025-11-08T..."
}
```

**Weeks Container** (one document per user per year):
```json
{
  "id": "user@example.com_2025",
  "userId": "user@example.com",
  "year": 2025,
  "weeks": {
    "2025-W45": {
      "goals": [
        {
          "id": "goal_456_2025-W45",
          "templateId": "goal_456",
          "title": "Weekly from dreamview",
          "completed": false,
          ...
        }
      ]
    }
  }
}
```

---

## Summary

✅ **Templates now save correctly from WeekAhead**  
✅ **Using proper `saveDreams` endpoint**  
✅ **Follows 6-container architecture**  
✅ **Atomic operations for dreams + templates**  
✅ **All CRUD operations updated**  
✅ **Ready for production**

The fix ensures that all template operations (create, update, delete) use the correct endpoint that saves dreams and templates together as a single atomic operation in the dreams container.

---

## Files Modified

1. **src/context/AppContext.jsx**
   - `addWeeklyGoal` - Use `saveDreams` for templates
   - `updateWeeklyGoal` - Use `saveDreams` for templates
   - `deleteWeeklyGoal` - Use `saveDreams` (omit deleted)
   - `deleteDream` - Pass remaining templates

---

## Related Documents

- `COSMOS_DB_REDESIGN_SUMMARY.md` - 6-container architecture
- `DASHBOARD_DREAMID_FIX.md` - Dashboard dreamId parseInt fix
- `DREAM_GOALS_DISPLAY_FIX.md` - Dream Book goals display fix

