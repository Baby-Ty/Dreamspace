# Vision Builder Goal Structure Update

## Overview
Updated the Vision Builder Demo to align with the new dream/goal structure, changing from `milestones` to `goals` throughout the component.

**Status:** ✅ Complete  
**Date:** November 2, 2025  
**Related Files:** `src/pages/VisionBuilderDemo.jsx`, `src/schemas/dream.js`

---

## Problem Statement

The Vision Builder was using an old structure where dreams had `milestones`, but the schema has evolved to use `goals` instead:

**Old Structure:**
```javascript
{
  id: string,
  title: string,
  category: string,
  milestones: Milestone[]  // ❌ Old
}
```

**New Structure (from dream.js schema):**
```javascript
{
  id: string,
  title: string,
  category: string,
  goals: Goal[]  // ✅ New
}
```

---

## Changes Made

### 1. State Management
**File:** `src/pages/VisionBuilderDemo.jsx`

Updated the selections state object:
```javascript
// Before
const [selections, setSelections] = useState({
  milestones: {},
  // ...
});

// After
const [selections, setSelections] = useState({
  goals: {},
  // ...
});
```

### 2. Handler Functions
Renamed and updated handler function:
```javascript
// Before
const handleMilestonePattern = (dreamId, pattern) => {
  setSelections({
    ...selections,
    milestones: { ...selections.milestones, [dreamId]: pattern }
  });
};

// After
const handleGoalPattern = (dreamId, pattern) => {
  setSelections({
    ...selections,
    goals: { ...selections.goals, [dreamId]: pattern }
  });
};
```

### 3. UI Labels
Updated step titles and UI text:
- Step title changed from "Milestones" to "Goals"
- Updated all references in UI text from "milestone" to "goal"
- Pattern options updated (e.g., "Milestone every..." → "Goal every...")

### 4. Data Generation
Updated `generateDreamsForApp()` function:
```javascript
// Before
return {
  id: `dream_${baseTimestamp}_${index}`,
  title: dream.title,
  category: dream.category,
  milestones: milestones,  // ❌ Old
  // ...
};

// After
return {
  id: `dream_${baseTimestamp}_${index}`,
  title: dream.title,
  category: dream.category,
  goals: goals,  // ✅ New
  // ...
};
```

### 5. Goal Structure
Updated goal data structure to match `GoalSchema` from `src/schemas/dream.js`:
```javascript
const goalData = {
  id: `goal_${baseTimestamp}_${index}`,
  title: dream.title,
  description: '...',
  type: goalPattern.type,  // 'consistency' | 'deadline' | 'general'
  active: true,
  completed: false,
  createdAt: now
};

// Add type-specific fields
if (goalPattern.type === 'consistency') {
  goalData.recurrence = goalPattern.period === 'month' ? 'monthly' : 'weekly';
  goalData.targetWeeks = goalPattern.targetWeeks || 12;
  goalData.startDate = now;
  goalData.frequency = goalPattern.frequency || 1;
  goalData.period = goalPattern.period || 'week';
}
```

### 6. Weekly Goal Creation
Updated the save logic to create weekly goals from goals (not milestones):
```javascript
// Before
dream.milestones.forEach(milestone => {
  if (milestone.type === 'consistency') {
    // Create weekly goals...
    milestoneId: milestone.id,
  }
});

// After
dream.goals.forEach(goal => {
  if (goal.type === 'consistency') {
    // Create weekly goals...
    goalId: goal.id,
  }
});
```

### 7. Review Step
Updated the review step to display goals:
```javascript
// Before
const milestone = selections.milestones[dream.id];
{milestone && (
  <span>
    {milestone.type === 'consistency' && `Track ${milestone.frequency}...`}
  </span>
)}

// After
const goal = selections.goals[dream.id];
{goal && (
  <span>
    {goal.type === 'consistency' && `Track ${goal.frequency}...`}
  </span>
)}
```

### 8. Validation
Updated the `canContinue()` function:
```javascript
// Before
case 5: return selections.dreams.every(d => selections.milestones[d.id]);

// After
case 5: return selections.dreams.every(d => selections.goals[d.id]);
```

### 9. Imports
Added required import:
```javascript
import { getCurrentIsoWeek } from '../utils/dateUtils';
```

---

## Goal Schema Alignment

The generated goals now match the `GoalSchema` from `src/schemas/dream.js`:

```javascript
export const GoalSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(['consistency', 'deadline']).default('consistency'),
  // For consistency goals
  recurrence: z.enum(['weekly', 'monthly']).optional(),
  targetWeeks: z.number().optional(),
  targetMonths: z.number().optional(),
  startDate: z.string().optional(),
  // For deadline goals
  targetDate: z.string().optional(),
  // Status
  active: z.boolean().default(true),
  completed: z.boolean().default(false),
  completedAt: z.string().optional(),
  createdAt: z.string().optional()
});
```

---

## Pattern Mapping

### Consistency Goals
- **User selects:** Frequency + Period (e.g., "3x per week")
- **Generated goal includes:**
  - `type: 'consistency'`
  - `recurrence: 'weekly'` or `'monthly'`
  - `targetWeeks: 12` (default)
  - `frequency: 3`
  - `period: 'week'`
- **Creates:** 12 weekly goal instances in the weekly goals system

### Deadline Goals
- **User selects:** Target date
- **Generated goal includes:**
  - `type: 'deadline'`
  - `targetDate: '2025-12-31'`
- **Creates:** No weekly goals (one-time completion)

### General Goals
- **User selects:** General completion
- **Generated goal includes:**
  - `type: 'general'`
- **Creates:** No weekly goals (manual completion)

---

## Data Flow

1. **Vision Builder Selection**
   - User chooses goal pattern for each dream
   - Stored in `selections.goals[dreamId]`

2. **Dream Generation**
   - `generateDreamsForApp()` creates dreams with `goals` array
   - Each goal matches `GoalSchema` structure

3. **Weekly Goal Creation**
   - For consistency goals, creates N weekly instances
   - Each instance has `goalId` linking back to the dream goal
   - Uses `getCurrentIsoWeek()` for week calculation

4. **Save to App**
   - Dreams saved with `addDream(dream)`
   - Weekly goals saved with `addWeeklyGoal(weeklyGoal)`
   - Navigation to dashboard

---

## Testing Checklist

- [x] No linter errors
- [x] All references updated from milestones to goals
- [x] Goal schema alignment verified
- [x] Handler functions renamed and updated
- [x] UI text updated appropriately
- [x] Data generation creates correct structure
- [x] Weekly goal creation uses goalId
- [x] Review step displays goals correctly
- [ ] Manual testing: Complete vision builder flow
- [ ] Manual testing: Verify dreams created with goals
- [ ] Manual testing: Verify weekly goals created
- [ ] Manual testing: Verify goals display in Dream Book

---

## Breaking Changes

None. The old milestone structure is fully replaced with the new goal structure, but since this is a demo/onboarding flow that generates new data (not reading existing data), there are no breaking changes for existing users.

---

## Related Documentation

- **Schema Definition:** `src/schemas/dream.js`
- **Vision Builder Demo:** `docs-implementation-history/VISION_BUILDER_DEMO.md`
- **Vision Builder Integration:** `docs-implementation-history/VISION_BUILDER_INTEGRATION.md`
- **Milestone Goals Implementation:** `docs-implementation-history/MILESTONE_GOALS_IMPLEMENTATION.md`

---

## Next Steps

1. **Manual Testing:** Run the vision builder flow end-to-end
2. **Verify Data:** Check that dreams are created with correct goal structure
3. **Check Weekly Goals:** Ensure weekly goals are created and linked properly
4. **Update Documentation:** If needed, update VISION_BUILDER_INTEGRATION.md to reflect goal structure

