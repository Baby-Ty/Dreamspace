# Monthly Goals Implementation

**Date**: November 7, 2025  
**Status**: ✅ Completed  
**Feature**: Monthly recurring goals with month-wide completion

---

## Overview

Monthly goals appear in **every week** of each month, but when marked complete in any week of a month, they are automatically marked complete for **all weeks in that same month**.

---

## How It Works

### Goal Creation

When creating a monthly goal:
1. User selects `recurrence: 'monthly'` in the goal form
2. Specifies `targetMonths` (duration in months)
3. A **template** is created with type `weekly_goal_template`
4. **Instances** are created for each week in the duration
   - Duration is calculated as `Math.ceil(targetMonths * 4.33)` weeks
   - Each instance gets a unique ID: `{templateId}_{weekId}`

### Display Logic

**Current Week:**
- Weekly goals: Show templates (instances are hidden to avoid duplicates)
- Monthly goals: **Show instances only** (templates are hidden)
- Reason: Monthly goals need separate instances per week to track which month they're completed in

**Other Weeks:**
- Show instances only (never show templates)

### Completion Logic

When a monthly goal is toggled in a week:

1. Find the instance that was clicked
2. Check if `recurrence === 'monthly'` and has a `templateId`
3. Get the month ID for the current week (e.g., "2025-11")
4. Find **all instances** with the same `templateId` in the same month
5. Mark all of them as complete/incomplete together
6. Save all affected weeks to the backend

**Example:**
```
November 2025 has weeks: W45, W46, W47, W48

User completes "Exercise 3x/week" in W46:
- W45 instance: marked complete ✓
- W46 instance: marked complete ✓
- W47 instance: marked complete ✓
- W48 instance: marked complete ✓

December 2025 has weeks: W49, W50, W51, W52
(These remain incomplete - different month)
```

---

## Implementation Details

### 1. Goal Instance Creation

**File**: `src/pages/DreamsWeekAhead.jsx`

When saving a monthly goal (lines 381-436):

```javascript
if (goalFormData.recurrence === 'weekly' || goalFormData.recurrence === 'monthly') {
  // Create template
  const template = {
    id: templateId,
    type: 'weekly_goal_template',
    recurrence: goalFormData.recurrence,  // 'monthly'
    targetMonths: goalFormData.targetMonths,
    // ... other fields
  };
  
  // Calculate week instances based on duration
  const weekIsoStrings = calculateWeekInstancesForDuration(template);
  
  // Create instances with inherited recurrence
  const instances = weekIsoStrings.map(weekIso => ({
    id: `${templateId}_${weekIso}`,
    type: 'weekly_goal',
    templateId: templateId,
    recurrence: template.recurrence,  // CRITICAL: Inherit 'monthly'
    weekId: weekIso,
    // ... other fields
  }));
}
```

### 2. Display Logic

**File**: `src/pages/DreamsWeekAhead.jsx` (lines 694-732)

```javascript
const visibleGoals = (() => {
  if (activeIsoWeek === currentWeekIso) {
    // Current week
    const allTemplates = weeklyGoals.filter(g => g.type === 'weekly_goal_template');
    const validTemplates = allTemplates.filter(template => 
      isTemplateActiveForWeek(template, currentWeekIso, milestone)
    );
    
    // Separate weekly and monthly templates
    const weeklyTemplates = validTemplates.filter(t => t.recurrence !== 'monthly');
    const monthlyTemplateIds = new Set(
      validTemplates.filter(t => t.recurrence === 'monthly').map(t => t.id)
    );
    
    const currentWeekInstances = weeklyGoals.filter(g => 
      g.weekId === currentWeekIso && g.type !== 'weekly_goal_template'
    );
    
    // Keep monthly instances, filter weekly duplicates
    const uniqueInstances = currentWeekInstances.filter(instance => {
      // Monthly goals: always show instance
      if (instance.recurrence === 'monthly' || monthlyTemplateIds.has(instance.templateId)) {
        return true;
      }
      // Weekly goals: hide if template is visible
      return !instance.templateId || !visibleTemplateIds.has(instance.templateId);
    });
    
    return [...weeklyTemplates, ...uniqueInstances];
  }
})();
```

### 3. Toggle Completion Logic

**File**: `src/pages/DreamsWeekAhead.jsx` (lines 524-652)

```javascript
const toggleGoalCompletion = async (goalId) => {
  const goal = weeklyGoals.find(g => g.id === goalId && g.weekId === activeIsoWeek);
  const isMonthlyGoal = goal.recurrence === 'monthly';
  
  if (isMonthlyGoal && goal.templateId) {
    // Get the month ID for the current week
    const currentMonthId = getMonthIdFromWeek(activeIsoWeek);  // e.g., "2025-11"
    
    // Find all instances of this template in the same month
    updatedWeeklyGoals = weeklyGoals.map(g => {
      if (g.templateId === goal.templateId && g.weekId) {
        const goalMonthId = getMonthIdFromWeek(g.weekId);
        if (goalMonthId === currentMonthId) {
          // Same month - update completion status
          return {
            ...g,
            completed: newCompletedStatus,
            completedAt: newCompletedStatus ? new Date().toISOString() : null
          };
        }
      }
      return g;
    });
    
    // Save all affected weeks
    // (weeks are tracked in weeksToSave Set)
  }
};
```

### 4. Week Instance Calculation

**File**: `src/utils/dateUtils.js` (lines 202-229)

```javascript
export function calculateWeekInstancesForDuration(template) {
  const startDate = template.startDate ? new Date(template.startDate) : new Date();
  const startWeek = getIsoWeek(startDate);
  
  if (template.recurrence === 'monthly') {
    // For monthly goals, calculate weeks based on targetMonths
    if (template.targetMonths) {
      // Approximate: ~4.33 weeks per month
      const approximateWeeks = Math.ceil(template.targetMonths * 4.33);
      return getNextNWeeks(startWeek, approximateWeeks);
    }
  }
  
  // ... other duration types
}
```

### 5. Month ID Utilities

**File**: `src/utils/monthUtils.js` (lines 36-49)

```javascript
export function getMonthIdFromWeek(isoWeek) {
  // Parse ISO week format "YYYY-WNN"
  const [year, weekPart] = isoWeek.split('-W');
  const week = parseInt(weekPart, 10);
  
  // Calculate the date of the first day of the ISO week
  // ISO week 1 starts on the Monday of the week containing Jan 4th
  const jan4 = new Date(parseInt(year), 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - jan4Day + 1 + (week - 1) * 7);
  
  return getMonthId(weekStart);  // Returns "YYYY-MM"
}
```

---

## Bug Fixes Applied

### Fix 1: weekService Instance Creation

**File**: `src/services/weekService.js` (line 329)

**Before**:
```javascript
recurrence: 'weekly',  // Hardcoded!
```

**After**:
```javascript
recurrence: template.recurrence || 'weekly',  // Inherit from template
```

**Impact**: Without this fix, monthly goal instances wouldn't have the correct `recurrence` property, breaking the toggle logic.

### Fix 2: Display Logic for Monthly Goals

**File**: `src/pages/DreamsWeekAhead.jsx` (lines 711-732)

**Before**:
- Showed templates for current week (including monthly templates)
- Monthly goal completion wasn't tracked per week

**After**:
- Weekly goals: Show templates (instances hidden)
- Monthly goals: Show instances (templates hidden)
- Each week can now track monthly goal completion independently

---

## Data Structure

### Template (stored in dreams container)
```javascript
{
  id: "template_1699123456789",
  type: "weekly_goal_template",
  title: "Exercise 3x per week",
  recurrence: "monthly",
  targetMonths: 6,
  durationType: "milestone",
  startDate: "2025-11-01T00:00:00Z",
  dreamId: "dream_123",
  dreamTitle: "Get Fit",
  dreamCategory: "health"
}
```

### Instances (stored in weeks container)
```javascript
// Week W45 (November 2025)
{
  id: "template_1699123456789_2025-W45",
  type: "weekly_goal",
  templateId: "template_1699123456789",
  weekId: "2025-W45",
  title: "Exercise 3x per week",
  recurrence: "monthly",  // CRITICAL: Inherited from template
  completed: true,
  completedAt: "2025-11-10T14:30:00Z",
  dreamId: "dream_123",
  dreamTitle: "Get Fit",
  dreamCategory: "health"
}

// Week W46 (November 2025)
{
  id: "template_1699123456789_2025-W46",
  // ... same structure, also marked complete because same month
  completed: true,
  completedAt: "2025-11-10T14:30:00Z"
}

// Week W49 (December 2025)
{
  id: "template_1699123456789_2025-W49",
  // ... same structure, but NOT complete (different month)
  completed: false
}
```

---

## User Flow Example

### Creating a Monthly Goal

1. Navigate to **Week Ahead**
2. Click **Add Goal** from a dream
3. Fill in goal details:
   - Title: "Meal prep every Sunday"
   - Recurrence: **Monthly**
   - Duration: 3 months
4. Click **Save**

**Behind the scenes:**
- Template created in dreams container
- Instances created for ~13 weeks (3 months × 4.33)
- Each instance has `recurrence: 'monthly'`
- All instances appear in Week Ahead

### Completing a Monthly Goal

**Week W45 (November 4-10, 2025):**
- User sees "Meal prep every Sunday" 
- Clicks to mark complete ✓
- ALL November weeks (W45, W46, W47, W48) are marked complete
- December weeks (W49+) remain incomplete

**Week W47 (November 18-24, 2025):**
- User navigates to this week
- "Meal prep every Sunday" already shows complete ✓
- User can uncheck it
- ALL November weeks are marked incomplete together

**Week W49 (December 2-8, 2025):**
- "Meal prep every Sunday" shows incomplete
- Independent from November completion
- Completing it marks all December weeks complete

---

## Testing Checklist

- [ ] Create a monthly goal with 2 months duration
- [ ] Verify it appears in all weeks of both months
- [ ] Complete the goal in week 1 of month 1
- [ ] Verify all weeks in month 1 are marked complete
- [ ] Navigate to week 1 of month 2
- [ ] Verify it's not complete (different month)
- [ ] Complete it in month 2
- [ ] Verify all weeks in month 2 are marked complete
- [ ] Navigate back to month 1
- [ ] Verify still complete
- [ ] Uncomplete in month 1
- [ ] Verify all month 1 weeks are uncomplete
- [ ] Verify month 2 is still complete (independent)

---

## Edge Cases Handled

1. **Week spanning two months** (e.g., W01 in December/January):
   - Uses the month of the week's start date (Monday)
   - `getMonthIdFromWeek()` calculates based on ISO week start

2. **Completing after month ends**:
   - Past months can still be toggled
   - Only affects weeks in the same month

3. **Multiple monthly goals in same month**:
   - Each template has unique `templateId`
   - Toggling one doesn't affect others

4. **Monthly goal with milestone duration**:
   - Creates instances based on `targetMonths`
   - When milestone completes, template deactivates
   - Existing instances remain (historical data)

---

## Files Modified

1. **src/pages/DreamsWeekAhead.jsx**:
   - Lines 711-732: Display logic to show instances for monthly goals
   - Lines 524-652: Toggle logic for month-wide completion

2. **src/services/weekService.js**:
   - Line 329: Fixed to inherit `recurrence` from template

3. **Backend (already correct)**:
   - `api/bulkInstantiateTemplates/index.js`: Line 233 inherits recurrence

---

## Related Documentation

- [Weekly Goals Duplicate Fix](./WEEKLY_GOALS_DUPLICATE_FIX.md)
- [Cosmos DB Redesign Summary](./COSMOS_DB_REDESIGN_SUMMARY.md)
- [Template Validation](../src/utils/templateValidation.js)
- [Month Utilities](../src/utils/monthUtils.js)


