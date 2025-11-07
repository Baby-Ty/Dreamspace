# Vision Builder - Weekly Goals Fix

## Critical Issue Found

### ❌ **Problem: Incorrect Weekly Goal Creation**

The Vision Builder was creating weekly goals incorrectly, causing:
1. **Multiple duplicate goals showing in Week Ahead** (12 copies of same goal)
2. **Only one goal showing on Dashboard** (instead of dream's goals)
3. **Wrong data structure** (adding to global weeklyGoals array instead of weeks container)

### Root Cause

The Vision Builder was following the **WRONG pattern** for creating weekly entries:

```javascript
// ❌ WRONG: Vision Builder was doing this
dream.goals.forEach(goal => {
  // Creating 12 separate weekly goal objects in weeklyGoals array
  weeksToCreate.forEach((weekId) => {
    const weeklyGoal = {
      id: `weeklygoal_${goal.id}_${weekId}`,
      // ... 
    };
    addWeeklyGoal(weeklyGoal); // ❌ Adds to global array!
  });
});
```

**Why this was wrong:**
- `addWeeklyGoal()` adds items to the global `state.weeklyGoals` array
- This creates 12 separate goal objects, not weekly entries
- The Week Ahead page loads ALL goals from `weeklyGoals`, so it shows 12 copies
- The Dashboard only shows goals from the dream object, which only has 1 goal

---

## ✅ Correct Pattern (from Dream Book)

### How Dream Book Creates Weekly Entries

When you add a goal in Dream Book, it follows this pattern:

```javascript
// 1. Add goal to dream's goals array
const goal = {
  id: `goal_${Date.now()}`,
  title: 'Gym 3x/week',
  type: 'consistency',
  targetWeeks: 12,
  // ...
};
await addGoal(dreamId, goal);

// 2. Populate weekly ENTRIES in weeks container
await populateWeeklyEntries(dreamId, goal);
```

**populateWeeklyEntries implementation:**
```javascript
const populateWeeklyEntries = async (dreamId, goal) => {
  const currentWeekIso = getCurrentIsoWeek();
  const weeksToPopulate = getNextNWeeks(currentWeekIso, goal.targetWeeks);
  
  for (const weekId of weeksToPopulate) {
    const weekYear = parseInt(weekId.split('-')[0]); 
    const weekEntry = {
      id: `${goal.id}_${weekId}`,      // Single entry per week
      goalId: goal.id,                  // Links back to dream's goal
      dreamId: dreamId,
      dreamTitle: localDream.title,
      dreamCategory: localDream.category,
      goalTitle: goal.title,
      weekId: weekId,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    // ✅ Save directly to weeks container
    await weekService.saveWeekGoals(userId, weekYear, weekId, [weekEntry]);
  }
};
```

### Key Differences

| Aspect | ❌ Old Vision Builder | ✅ Dream Book Pattern |
|--------|----------------------|----------------------|
| **Goal Storage** | Global `weeklyGoals` array | Weeks container by week |
| **Method** | `addWeeklyGoal()` | `weekService.saveWeekGoals()` |
| **Structure** | 12 separate goal objects | 12 week entries referencing 1 goal |
| **Goal Reference** | Each is a standalone goal | Each references `goalId` |
| **Week Ahead** | Shows all 12 as separate goals | Shows 1 entry per week |
| **Dashboard** | Shows dream's goals (1) | Shows dream's goals (1) |

---

## ✅ Fixed Implementation

### Updated Vision Builder Code

```javascript
// Import required services
import { getCurrentIsoWeek, getNextNWeeks } from '../utils/dateUtils';
import weekService from '../services/weekService';

// Changed from addWeeklyGoal to currentUser
const { addDream, currentUser } = useApp();

// Updated save logic
onClick={async () => {
  const userId = currentUser?.id;
  if (!userId) {
    alert('⚠️ You must be logged in to save dreams');
    return;
  }

  // Step 1: Add all dreams to Dream Book
  for (const dream of dreamsForApp) {
    addDream(dream);
    console.log(`✅ Added Dream: ${dream.title}`);
  }
  
  // Step 2: Populate weekly entries for consistency goals
  const currentWeekIso = getCurrentIsoWeek();
  
  for (const dream of dreamsForApp) {
    for (const goal of dream.goals) {
      if (goal.type === 'consistency') {
        const weeksToCreate = getNextNWeeks(currentWeekIso, goal.targetWeeks || 12);
        
        // Create weekly entries for each week
        for (const weekId of weeksToCreate) {
          const weekYear = parseInt(weekId.split('-')[0]);
          const weekEntry = {
            id: `${goal.id}_${weekId}`,
            goalId: goal.id,              // ✅ Links to dream's goal
            dreamId: dream.id,
            dreamTitle: dream.title,
            dreamCategory: dream.category,
            goalTitle: goal.title,
            weekId: weekId,
            completed: false,
            createdAt: new Date().toISOString()
          };
          
          // ✅ Save to weeks container, not global array
          await weekService.saveWeekGoals(userId, weekYear, weekId, [weekEntry]);
        }
        
        console.log(`✅ Populated ${weeksToCreate.length} weekly entries for: ${dream.title}`);
      }
    }
  }
  
  navigate('/');
}}
```

---

## Data Structure Comparison

### Dreams Container (Both Correct)

```json
{
  "userId": "Tyler.Stewart@netsurit.com",
  "type": "dreams",
  "dreams": [
    {
      "id": "dream_1762109793276_0",
      "title": "Run 5 5Ks this year",
      "category": "Health",
      "goals": [
        {
          "id": "goal_1762109793276_0",
          "title": "Run 5 5Ks this year",
          "type": "consistency",
          "recurrence": "weekly",
          "targetWeeks": 12,
          "active": true,
          "completed": false
        }
      ]
    }
  ]
}
```

### Weeks Container

**❌ Old (Wrong) - No entries created properly:**
```json
// weeklyGoals array had 12 objects, but they weren't saved to weeks container
```

**✅ New (Correct) - One entry per week:**
```json
{
  "userId": "Tyler.Stewart@netsurit.com",
  "type": "week",
  "year": 2025,
  "weekId": "2025-W44",
  "goals": [
    {
      "id": "goal_1762109793276_0_2025-W44",
      "goalId": "goal_1762109793276_0",    // ✅ References dream's goal
      "dreamId": "dream_1762109793276_0",
      "dreamTitle": "Run 5 5Ks this year",
      "dreamCategory": "Health",
      "goalTitle": "Run 5 5Ks this year",
      "weekId": "2025-W44",
      "completed": false,
      "createdAt": "2025-11-02T..."
    }
  ]
}
```

---

## How Week Ahead Loads Goals

```javascript
// Week Ahead loads goals from weeks container
const goals = await weekService.getWeekGoals(userId, year, weekId);

// Returns array of week entries for that specific week
// Each entry has a goalId that links back to the dream's goal
```

**Before Fix:**
- Loaded 12 separate goals from `weeklyGoals` array
- All 12 showed up for current week (duplicates)

**After Fix:**
- Loads 1 entry per week from weeks container
- Each week shows only that week's entry
- Each entry references the same goal via `goalId`

---

## Testing Steps

### 1. Clean Up Old Test Data

Delete from Cosmos DB:
- Any dreams created by Vision Builder with old structure
- Any weekly goals with IDs like `goal_goal_...` or `weeklygoal_goal_...`
- Any week documents that have multiple duplicate entries

### 2. Run Vision Builder

1. Complete the Vision Builder flow
2. Choose consistency goals for all 3 dreams
3. Check browser console for logs:
   ```
   ✅ Added Dream: Run 5 5Ks this year
   📅 Populating 12 weeks for goal "Run 5 5Ks this year"
   ✅ Populated 12 weekly entries for: Run 5 5Ks this year
   ```

### 3. Verify in Cosmos DB

#### Check Dreams Container
```sql
SELECT * FROM c WHERE c.type = 'dreams' AND c.userId = 'Tyler.Stewart@netsurit.com'
```

Verify:
- ✅ Dreams have `goals` array
- ✅ Each goal has proper structure with `id`, `type`, `recurrence`, etc.
- ✅ No duplicate goals

#### Check Weeks Container
```sql
SELECT * FROM c WHERE c.type = 'week' AND c.userId = 'Tyler.Stewart@netsurit.com' AND c.weekId = '2025-W44'
```

Verify for current week:
- ✅ ONE entry per goal (not 12 duplicate goals)
- ✅ Each entry has `goalId` pointing to dream's goal
- ✅ Entry has proper structure with `weekId`, `dreamId`, etc.

### 4. Verify in UI

#### Dashboard
- ✅ Shows 3 dreams
- ✅ Each dream shows its title and progress
- ✅ "This Week's Goals" shows 1 goal per dream (not 12 copies)

#### Week Ahead
- ✅ Shows 1 goal per dream for current week
- ✅ Can check/uncheck goals
- ✅ Switching weeks shows appropriate goals
- ✅ No duplicate goals

#### Dream Book
- ✅ Click on a dream
- ✅ Goals tab shows the goal(s) for that dream
- ✅ Progress tracking works
- ✅ Weekly completion logs work

---

## Files Modified

1. **src/pages/VisionBuilderDemo.jsx**
   - Line 27: Added `getNextNWeeks` import
   - Line 28: Added `weekService` import
   - Line 32: Changed from `addWeeklyGoal` to `currentUser`
   - Line 1102: Made onClick async
   - Lines 1114-1175: Completely rewrote save logic to use weeks container

---

## Related Files

- `src/hooks/useDreamTracker.js` - Contains correct `populateWeeklyEntries` pattern
- `src/services/weekService.js` - Week entry management
- `src/utils/dateUtils.js` - Week calculations (`getNextNWeeks`, `getCurrentIsoWeek`)

---

## Status

✅ **Fixed** - Vision Builder now correctly:
1. Creates dreams with goals array
2. Populates weekly entries in weeks container (not global array)
3. Uses `weekService.saveWeekGoals()` (not `addWeeklyGoal()`)
4. Creates one entry per week that references the dream's goal
5. Results in proper display in both Dashboard and Week Ahead

**Date:** November 2, 2025  
**Issue:** Duplicate goals in Week Ahead, incorrect weekly goal creation pattern  
**Resolution:** Match Dream Book's `populateWeeklyEntries` pattern




