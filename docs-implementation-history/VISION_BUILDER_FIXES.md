# Vision Builder - Data Structure Fixes

## Issues Found

### 1. ❌ UI Text Still Referenced "Milestones"
**Location:** Welcome screen text (line 325)  
**Issue:** Text said "Dreams, Milestones, and Weekly Goals"  
**Fix:** Changed to "Dreams, Goals, and Weekly Plans"

### 2. ❌ Double Prefix on Weekly Goal IDs
**Location:** Save logic when creating weekly goal instances (line 1125)  
**Issue:** 
```javascript
// BEFORE (WRONG)
const baseGoalId = `goal_${goal.id}_${Date.now()}`;
// If goal.id = "goal_1762109793276_0"
// Result: "goal_goal_1762109793276_0_9876543210" ❌ DOUBLE PREFIX!
```

**Fix:**
```javascript
// AFTER (CORRECT)
const baseGoalId = `weeklygoal_${goal.id}`;
// If goal.id = "goal_1762109793276_0"
// Result: "weeklygoal_goal_1762109793276_0" ✅ Clean prefix
```

### 3. ✅ Improved Logging
Added JSON.stringify to dreams output for better debugging:
```javascript
console.log('Dreams:', JSON.stringify(dreamsForApp, null, 2));
```

---

## Correct Data Structure

### Dreams Created by Vision Builder
```json
{
  "id": "dream_1762109793276_0",
  "title": "Stick to gym routine",
  "category": "Health",
  "description": "Stay consistent with fitness",
  "image": "https://...",
  "progress": 0,
  "goals": [
    {
      "id": "goal_1762109793276_0",
      "title": "Stick to gym routine",
      "description": "Track 3x per week for 12 weeks",
      "type": "consistency",
      "active": true,
      "completed": false,
      "recurrence": "weekly",
      "targetWeeks": 12,
      "startDate": "2025-11-02T...",
      "frequency": 3,
      "period": "week",
      "createdAt": "2025-11-02T..."
    }
  ],
  "notes": [],
  "history": [],
  "createdAt": "2025-11-02T...",
  "updatedAt": "2025-11-02T..."
}
```

### Weekly Goals Created for Consistency Goals
```json
{
  "id": "weeklygoal_goal_1762109793276_0_2025-W44",
  "title": "3x per week",
  "description": "3x per week for 12 weeks",
  "weekId": "2025-W44",
  "dreamId": "dream_1762109793276_0",
  "dreamTitle": "Stick to gym routine",
  "dreamCategory": "Health",
  "completed": false,
  "goalId": "goal_1762109793276_0",
  "recurrence": "weekly",
  "templateId": "weeklygoal_goal_1762109793276_0",
  "active": true,
  "createdAt": "2025-11-02T..."
}
```

---

## How to Test

### Step 1: Clean Old Test Data
Delete any test dreams/goals from your Cosmos DB that were created with the old structure:
- Look for items with IDs containing "goal_goal_" (double prefix)
- These are from the old broken code

### Step 2: Run Vision Builder
1. Navigate to the Vision Builder (route: `/vision-builder`)
2. Complete all steps:
   - Select a vibe
   - Choose 2+ themes
   - Pick 2+ aspirations
   - Select 3 dream templates
   - Choose goal patterns for each dream
   - Review and submit

### Step 3: Verify in Console
Check the browser console for the output:
```
=== VISION BUILDER OUTPUT ===
Vision Bio: ...
Dreams: [
  {
    "id": "dream_...",
    "goals": [
      {
        "id": "goal_...",
        "type": "consistency",
        ...
      }
    ]
  }
]
```

Verify:
- ✅ Dreams have `goals` array (not `milestones`)
- ✅ Goals have proper structure matching `GoalSchema`
- ✅ Goal IDs start with `"goal_"` (single prefix)
- ✅ Weekly goal IDs start with `"weeklygoal_"` (not `"goal_goal_"`)

### Step 4: Verify in Database

#### Check dreams Container
Look for a document with `type: "dreams"` and verify it has:
```json
{
  "userId": "Tyler.Stewart@netsurit.com",
  "type": "dreams",
  "dreams": [
    {
      "id": "dream_...",
      "title": "...",
      "goals": [...]  // ✅ Goals array, not milestones
    }
  ]
}
```

#### Check weeks Container
Look for documents with `type: "week"` and verify weekly goals:
```json
{
  "userId": "Tyler.Stewart@netsurit.com",
  "type": "week",
  "year": 2025,
  "weekId": "2025-W44",
  "goals": [
    {
      "id": "weeklygoal_goal_...",  // ✅ Starts with "weeklygoal_", not "goal_goal_"
      "goalId": "goal_...",
      "dreamId": "dream_..."
    }
  ]
}
```

### Step 5: Verify in Dream Book UI
1. Navigate to Dream Book
2. Click on a dream created by the vision builder
3. Verify:
   - ✅ Dream displays correctly
   - ✅ Goals are shown (not milestones)
   - ✅ Goal progress tracking works
   - ✅ Weekly goals appear in Week Ahead view

---

## Files Modified

- `src/pages/VisionBuilderDemo.jsx`
  - Line 325: Updated welcome text
  - Line 1125: Fixed weekly goal ID generation
  - Line 1109: Improved logging

---

## Related Documentation

- `VISION_BUILDER_GOAL_UPDATE.md` - Original migration from milestones to goals
- `VISION_BUILDER_INTEGRATION.md` - Integration guide
- `src/schemas/dream.js` - Dream and Goal schemas

---

## Status

✅ **Fixed** - Vision Builder now correctly:
1. Uses "Goals" terminology throughout
2. Creates dreams with `goals` array matching `GoalSchema`
3. Generates weekly goals with clean ID prefixes
4. Logs data structure for debugging

**Date:** November 2, 2025  
**Related Issue:** Double "goal_" prefix in weekly goal IDs




