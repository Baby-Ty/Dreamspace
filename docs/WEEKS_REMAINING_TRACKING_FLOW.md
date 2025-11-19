# Weeks Remaining Tracking Flow - Complete Implementation

## Architecture Overview

The system now properly tracks `weeksRemaining` and `monthsRemaining` for goals stored in the **dreams container** (`dream.goals[]`), and updates them during week rollover.

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  dreams Container (dream.goals[])                          │
│  - Master goal definitions                                 │
│  - Contains: weeksRemaining, monthsRemaining                │
│  - Updated during rollover                                 │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ Week Rollover reads goals
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  currentWeek Container                                       │
│  - Creates instances from dream.goals[]                     │
│  - Decrements weeksRemaining by -1                         │
│  - Saves updated weeksRemaining back to dreams container    │
└─────────────────────────────────────────────────────────────┘
```

## Complete Flow

### 1. Goal Creation

**When creating a goal in Dream Book:**

**File**: `src/hooks/useDreamTracker.js` (line 249-275)

```javascript
// Initialize weeksRemaining/monthsRemaining
const weeksRemaining = newGoalData.type === 'deadline' && newGoalData.targetDate
  ? getWeeksUntilDate(newGoalData.targetDate, currentWeekIso)
  : (newGoalData.type === 'consistency' && newGoalData.recurrence === 'weekly'
      ? parseInt(newGoalData.targetWeeks)
      : undefined);

const monthsRemaining = newGoalData.type === 'consistency' && newGoalData.recurrence === 'monthly'
  ? parseInt(newGoalData.targetMonths)
  : undefined;

const goal = {
  id: `goal_${Date.now()}`,
  title: newGoalData.title.trim(),
  type: newGoalData.type,
  targetWeeks: ...,
  targetMonths: ...,
  weeksRemaining: weeksRemaining, // ← Initialized here
  monthsRemaining: monthsRemaining, // ← Initialized here
  ...
};
```

**Result**: Goal saved to `dream.goals[]` in dreams container with `weeksRemaining: 12` (or `targetWeeks` value)

### 2. Saving to Cosmos DB

**File**: `api/saveDreams/index.js` (line 102-118)

```javascript
goals: (dream.goals || []).map(goal => ({
  id: goal.id,
  title: goal.title,
  type: goal.type,
  targetWeeks: goal.targetWeeks,
  targetMonths: goal.targetMonths,
  weeksRemaining: goal.weeksRemaining, // ← NEW: Persisted to Cosmos DB
  monthsRemaining: goal.monthsRemaining, // ← NEW: Persisted to Cosmos DB
  ...
}))
```

**Result**: Goals in Cosmos DB now have `weeksRemaining` and `monthsRemaining` fields

### 3. Week Rollover Process

**File**: `api/utils/weekRollover.js` (line 233-385)

**Step 1: Read goals from dreams container**
```javascript
const dreams = dreamsDoc.dreamBook || [];
const dreamGoals = (dream.goals || []).filter(g => 
  !g.completed && 
  (g.type === 'consistency' || g.type === 'deadline')
);
```

**Step 2: Process consistency goals**
```javascript
if (goal.recurrence === 'weekly' && goal.targetWeeks) {
  // Initialize weeksRemaining if missing (backward compatibility)
  const currentWeeksRemaining = goal.weeksRemaining !== undefined 
    ? goal.weeksRemaining 
    : goal.targetWeeks;
  
  // Decrement by -1 (unless skipped)
  const wasSkipped = previousInstance?.skipped || false;
  const newWeeksRemaining = wasSkipped
    ? currentWeeksRemaining
    : Math.max(0, currentWeeksRemaining - 1);
  
  // Create instance for currentWeek container
  const instance = {
    id: `${goal.id}_${weekId}`,
    templateId: goal.id,
    type: 'weekly_goal',
    weeksRemaining: newWeeksRemaining, // ← Decremented value
    ...
  };
  
  // Track update for saving back to dreams container
  dreamGoalUpdates.get(dream.id).push({
    ...goal,
    weeksRemaining: newWeeksRemaining // ← Save decremented value back
  });
}
```

**Step 3: Save updated goals back to dreams container**
```javascript
if (dreamGoalUpdates.size > 0) {
  const updatedDreams = dreams.map(dream => {
    const goalUpdates = dreamGoalUpdates.get(dream.id);
    if (!goalUpdates) return dream;
    
    // Update goals in this dream
    const updatedGoals = (dream.goals || []).map(goal => {
      const update = goalUpdates.find(u => u.id === goal.id);
      return update || goal; // Use updated version if available
    });
    
    return {
      ...dream,
      goals: updatedGoals // ← Updated with new weeksRemaining
    };
  });
  
  // Save back to Cosmos DB
  await cosmosProvider.upsertDreamsDocument(userId, {
    ...dreamsDoc,
    dreamBook: updatedDreams,
    updatedAt: new Date().toISOString()
  });
}
```

## Example Flow

### Week 1: Create Goal
1. User creates goal "Run 5km" with `targetWeeks: 12`
2. Goal saved to `dream.goals[]` with `weeksRemaining: 12`
3. Instance created in `currentWeek` with `weeksRemaining: 12`

**Cosmos DB (dreams container)**:
```json
{
  "dreamBook": [{
    "goals": [{
      "id": "goal_123",
      "title": "Run 5km",
      "targetWeeks": 12,
      "weeksRemaining": 12  // ← Initialized
    }]
  }]
}
```

### Week 2: Rollover
1. Rollover reads `dream.goals[]` → finds `weeksRemaining: 12`
2. Creates instance with `weeksRemaining: 11` (12 - 1)
3. Updates `dream.goals[]` back to Cosmos DB with `weeksRemaining: 11`

**Cosmos DB (dreams container)** - AFTER ROLLOVER:
```json
{
  "dreamBook": [{
    "goals": [{
      "id": "goal_123",
      "title": "Run 5km",
      "targetWeeks": 12,
      "weeksRemaining": 11  // ← Updated! (was 12)
    }]
  }]
}
```

**Cosmos DB (currentWeek container)**:
```json
{
  "goals": [{
    "id": "goal_123_2025-W48",
    "templateId": "goal_123",
    "weeksRemaining": 11  // ← Instance for this week
  }]
}
```

### Week 3: Rollover
1. Rollover reads `dream.goals[]` → finds `weeksRemaining: 11`
2. Creates instance with `weeksRemaining: 10` (11 - 1)
3. Updates `dream.goals[]` back to Cosmos DB with `weeksRemaining: 10`

**Continues until `weeksRemaining: 0`, then goal stops appearing**

## Key Changes Made

### 1. Goal Creation (`src/hooks/useDreamTracker.js`)
- ✅ Initialize `weeksRemaining` for weekly consistency goals
- ✅ Initialize `monthsRemaining` for monthly consistency goals
- ✅ Calculate `weeksRemaining` for deadline goals using `getWeeksUntilDate()`

### 2. Goal Creation (`src/hooks/useDreamBook.js`)
- ✅ Initialize `weeksRemaining` when creating first goal with dream
- ✅ Initialize `monthsRemaining` for monthly goals

### 3. Saving Goals (`api/saveDreams/index.js`)
- ✅ Persist `weeksRemaining` field to Cosmos DB
- ✅ Persist `monthsRemaining` field to Cosmos DB

### 4. Week Rollover (`api/utils/weekRollover.js`)
- ✅ Read consistency goals from `dream.goals[]` (not just templates)
- ✅ Initialize `weeksRemaining` if missing (backward compatibility)
- ✅ Decrement `weeksRemaining` by -1 for weekly goals
- ✅ Decrement `monthsRemaining` by -1 for monthly goals (on month transition)
- ✅ Create instances in `currentWeek` container with decremented values
- ✅ **Save updated goals back to `dream.goals[]` in Cosmos DB**

## Testing Checklist

After deploying, verify:

1. **Create Goal**:
   - [ ] Create dream with consistency goal (`targetWeeks: 12`)
   - [ ] Check Cosmos DB: `dream.goals[0].weeksRemaining` should be `12`

2. **First Rollover**:
   - [ ] Simulate week rollover
   - [ ] Check Cosmos DB: `dream.goals[0].weeksRemaining` should be `11` ✅
   - [ ] Check `currentWeek` container: instance should have `weeksRemaining: 11`

3. **Second Rollover**:
   - [ ] Simulate another week rollover
   - [ ] Check Cosmos DB: `dream.goals[0].weeksRemaining` should be `10` ✅
   - [ ] Check `currentWeek` container: instance should have `weeksRemaining: 10`

4. **Completion**:
   - [ ] Continue until `weeksRemaining: 0`
   - [ ] Goal should stop appearing in Dashboard ✅

5. **Deadline Goals**:
   - [ ] Create deadline goal with `targetDate: "2025-12-31"`
   - [ ] `weeksRemaining` calculated dynamically each week
   - [ ] Goal disappears when deadline passes ✅

## Notes

- **Backward Compatibility**: If `weeksRemaining` is missing, rollover initializes it from `targetWeeks`
- **Skipped Goals**: If a goal is skipped, `weeksRemaining` doesn't decrement
- **Completed Goals**: Goals with `completed: true` are skipped during rollover
- **Non-Critical Updates**: If saving goals back to Cosmos DB fails, rollover continues (logs warning)

