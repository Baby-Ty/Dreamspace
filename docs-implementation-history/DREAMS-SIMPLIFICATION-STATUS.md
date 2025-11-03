# Dreams Simplification Implementation Status

## ✅ Completed

### 1. Backend/Schema Changes (Complete)
- ✅ Updated `src/schemas/dream.js` - replaced `MilestoneSchema` with `GoalSchema`
- ✅ Updated `src/schemas/item.js` - replaced `milestoneId` with `goalId` in WeeklyGoalTemplateSchema
- ✅ Updated `src/schemas/person.js` - replaced `milestoneId` with `goalId` in WeeklyGoalSchema
- ✅ Updated `DreamSchema` to have `goals` array instead of `milestones`
- ✅ Updated `HistorySchema` to use 'goal' type instead of 'milestone'

### 2. API Changes (Complete)
- ✅ Re-enabled `api/saveDreams/index.js` as primary save method (one doc per user)
- ✅ Updated to use `goals` instead of `milestones` in dream structure
- ✅ Changed `milestoneId` to `goalId` in weeklyGoalTemplates
- ✅ Added structured logging
- ✅ Updated `api/saveItem/index.js` to reject 'dream' type (use saveDreams instead)

### 3. Frontend Service Changes (Complete)
- ✅ Updated `src/services/itemService.js` - reverted `saveDreams()` to bulk save
- ✅ Now saves entire dreams array in one document per user

### 4. Context Changes (Complete)
- ✅ Updated `src/context/AppContext.jsx`:
  - ✅ ADD_DREAM reducer - uses `goals` instead of `milestones`
  - ✅ UPDATE_MILESTONE_STREAK - deprecated (goals track completion directly)
  - ✅ `addDream()` - saves entire dreams array, creates templates from consistency goals
  - ✅ `updateDream()` - saves entire dreams array
  - ✅ `deleteDream()` - saves entire dreams array
  - ✅ `updateDreamProgress()` - saves entire dreams array
  - ✅ Added `addGoal()`, `updateGoal()`, `deleteGoal()` methods
  - ✅ `toggleWeeklyGoal()` - uses `goalId` instead of `milestoneId`
  - ✅ `logWeeklyCompletion()` - updated to work with goals
  - ✅ Auto-deactivate templates check - uses goals instead of milestones

## ⚠️ Remaining Work

### UI Components (NOT YET UPDATED)
The following UI components still reference milestones and need to be updated to work with goals:

#### `src/components/DreamTrackerModal.jsx` (1173 lines)
**Current state:** Still uses milestones throughout

**Required changes:**
1. Replace all `milestone` references with `goal` references
2. Update state management:
   - `milestones` → `goals`
   - `newMilestone` → `newGoal`
   - `editingMilestone` → `editingGoal`
   - `milestoneEditData` → `goalEditData`
3. Update functions:
   - `addMilestone()` → `addGoal()`
   - `toggleMilestone()` → `toggleGoal()`
   - `deleteMilestone()` → `deleteGoal()`
   - `startEditingMilestone()` → `startEditingGoal()`
   - etc.
4. Update tab name from "Milestones" to "Goals"
5. Update goal form to include:
   - Type: consistency, deadline, general
   - For consistency: recurrence (daily/weekly/monthly), targetWeeks, startDate
   - For deadline: targetDate
6. Remove `MilestonesTab` component and replace with `GoalsTab`
7. Update `handleSaveGoal()` to use `addGoal()`, `updateGoal()` from context
8. Remove `MilestoneAccordion` dependency (or update it to work with goals)

#### `src/components/MilestoneAccordion.jsx`
**Status:** Need to check if this exists and update it to `GoalAccordion.jsx`

#### `src/pages/DreamBook.jsx`
**Status:** Need to check for milestone references

#### Other potential files:
- Any other components in `src/pages/dreams/` or `src/components/` that reference milestones

## New Goal Structure

```javascript
{
  id: "goal_123",
  title: "Gym 3x a week",
  description: "Strength training sessions",
  type: "consistency", // or "deadline", "general"
  // For consistency goals:
  recurrence: "weekly",
  targetWeeks: 12,
  startDate: "2025-10-31",
  // For deadline goals:
  targetDate: "2025-12-01",
  // Status:
  active: true,
  completed: false,
  completedAt: "2025-11-15T10:00:00Z",
  createdAt: "2025-10-01T10:00:00Z"
}
```

## Dreams Container Structure (New)

```json
{
  "id": "user@email.com",
  "userId": "user@email.com",
  "dreams": [
    {
      "id": "dream_123",
      "title": "Get Fit",
      "category": "Health",
      "description": "Improve overall fitness",
      "progress": 0,
      "goals": [...],
      "notes": [...],
      "history": [...],
      "createdAt": "2025-10-01T10:00:00Z",
      "updatedAt": "2025-10-31T10:00:00Z"
    }
  ],
  "weeklyGoalTemplates": [...],
  "createdAt": "2025-10-01T10:00:00Z",
  "updatedAt": "2025-10-31T10:00:00Z"
}
```

## Testing Checklist

After UI updates:
- [ ] Create dream with consistency goal → saved in one doc per user
- [ ] Create dream with deadline goal → saved in one doc per user
- [ ] Update dream → entire doc updated, not individual dream
- [ ] Delete dream → removed from array, doc updated
- [ ] Add goal to dream → array updated in dreams doc
- [ ] Complete weekly goal → tracked by goalId
- [ ] Check Cosmos DB → one doc per user in dreams container
- [ ] Verify no individual dream docs created
- [ ] Verify goals UI works (add, edit, delete goals)
- [ ] Verify week ahead linking works with goalId

## Migration Notes

- Old data with separate dream documents needs to be manually cleaned up
- User should delete old individual dream documents from Cosmos DB
- Users can recreate dreams with new structure (one doc per user with goals)

