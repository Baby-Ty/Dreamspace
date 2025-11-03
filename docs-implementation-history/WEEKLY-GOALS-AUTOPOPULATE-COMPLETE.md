# Weekly Goals Auto-Population Implementation - Complete

## Summary

Successfully implemented automatic weekly goal population and Dashboard integration for the new goal-based tracking system (replacing milestones).

## Changes Made

### 1. Date Utilities (`src/utils/dateUtils.js`)

Added `getNextNWeeks()` function to generate arrays of ISO week strings:

```javascript
export function getNextNWeeks(startWeekIso, n) {
  const weeks = [];
  const { start } = getWeekRange(startWeekIso);
  
  for (let i = 0; i < n; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + (i * 7));
    weeks.push(getIsoWeek(currentDate));
  }
  
  return weeks;
}
```

### 2. DreamTrackerModal (`src/components/DreamTrackerModal.jsx`)

#### Added Auto-Population Logic

**New Functions:**

1. **`populateWeeklyEntries(dreamId, goal)`** - Creates weekly tracking entries based on goal type:
   - **Consistency goals with targetWeeks**: Creates entries for specified number of weeks
   - **Consistency goals without targetWeeks**: Creates entries for current + next 2 weeks (rolling window)
   - **Deadline goals**: Creates entries from current week until targetDate
   - **General goals**: No auto-population

2. **`cleanupWeeklyEntries(goalId)`** - Removes all weekly entries for a deleted goal

**Updated Functions:**

- **`handleAddGoal()`**: Now async, automatically populates weekly entries after creating a goal
- **`saveEditedGoal()`**: Now async, recalculates weekly entries when goal properties change
- **`handleDeleteGoal()`**: Now async, cleans up weekly entries when goal is deleted

#### Weekly Entry Structure

Each weekly entry includes:
```javascript
{
  id: `${goal.id}_${weekId}`,
  goalId: goal.id,
  dreamId: dreamId,
  dreamTitle: localDream.title,
  dreamCategory: localDream.category,
  goalTitle: goal.title,
  weekId: weekId,
  completed: false,
  createdAt: new Date().toISOString()
}
```

### 3. Dashboard (`src/pages/Dashboard.jsx`)

#### Real-Time Week Goals Loading

**New State:**
- `currentWeekGoals`: Array of goals for current week
- `isLoadingWeekGoals`: Loading indicator

**New useEffect:**
```javascript
useEffect(() => {
  const loadCurrentWeekGoals = async () => {
    const currentWeekIso = getCurrentIsoWeek();
    const currentYear = new Date().getFullYear();
    const weekDocResult = await weekService.getWeekGoals(currentUser.id, currentYear);
    
    if (weekDocResult.success && weekDocResult.data?.weeks?.[currentWeekIso]) {
      setCurrentWeekGoals(weekDocResult.data.weeks[currentWeekIso].goals || []);
    }
  };
  
  loadCurrentWeekGoals();
}, [currentUser?.id]);
```

**New Handler:**
- `handleToggleGoal()`: Optimistically updates UI and saves to backend

#### Enhanced Display

Goals now display:
- Dream title (if associated with a dream)
- Goal title (for standalone goals)
- Completion status with visual feedback
- Instant toggle with optimistic updates

### 4. Cleanup

- ✅ Removed `MilestoneAccordion.jsx` (deprecated)
- ✅ All milestone references replaced with goals throughout the system

## Goal Population Rules

| Goal Type | Auto-Population Behavior |
|-----------|-------------------------|
| **Consistency with targetWeeks** | Creates entries for specified number of weeks (e.g., 12 weeks) |
| **Consistency without targetWeeks** | Creates entries for current week + next 2 weeks (rolling window) |
| **Deadline** | Creates entries from current week until targetDate |
| **General** | No auto-population (user adds manually to specific weeks) |

## Data Flow

### Adding a Goal

1. User adds consistency goal "Gym 3x/week" with targetWeeks: 12
2. Goal saved to dreams document
3. `populateWeeklyEntries()` automatically creates 12 weekly entries:
   - 2025-W43 (current)
   - 2025-W44
   - ... up to W54
4. Entries saved to `weeks2025` container
5. Week Ahead view and Dashboard immediately show all entries

### Editing a Goal

1. User changes goal from 12 weeks to 8 weeks
2. Goal updated in dreams document
3. `populateWeeklyEntries()` called to recalculate
4. New entries created for updated duration
5. **Note**: Old entries remain (consider implementing cleanup in future)

### Deleting a Goal

1. User deletes goal
2. Goal removed from dreams document
3. `cleanupWeeklyEntries()` loads week document
4. Iterates through all weeks, filtering out entries with matching goalId
5. Saves updated weeks back to container

### Dashboard Display

1. Dashboard loads on mount
2. Fetches current week's goals from `weeks2025` container
3. Displays goals with completion checkboxes
4. User toggles completion → optimistic UI update + backend save
5. Changes instantly reflected in both Dashboard and Week Ahead views

## Testing Checklist

### ✅ Completed
- [x] Created `getNextNWeeks()` utility function
- [x] Added `populateWeeklyEntries()` helper
- [x] Updated `handleAddGoal()` to auto-populate
- [x] Updated `saveEditedGoal()` to recalculate
- [x] Updated `handleDeleteGoal()` to cleanup
- [x] Updated Dashboard to load current week goals
- [x] Updated Dashboard to toggle goal completion
- [x] Removed MilestoneAccordion component
- [x] No linter errors

### ⏳ Pending User Testing
- [ ] Add consistency goal with 12 weeks → verify 12 entries created in weeks container
- [ ] Add consistency goal without targetWeeks → verify 3 entries (current + 2)
- [ ] Add deadline goal → verify entries until targetDate
- [ ] Edit goal targetWeeks → verify entries updated
- [ ] Delete goal → verify weekly entries removed
- [ ] Check Week Ahead shows all goals
- [ ] Check Dashboard shows current week's goals
- [ ] Toggle goal completion on Dashboard → verify updates in weeks container
- [ ] Verify single dream document per user in Cosmos DB

## Architecture Notes

### Containers
- **dreams**: One document per user with dreams array (each dream has nested goals)
- **weeksYYYY**: One document per user per year with nested weeks structure
  ```json
  {
    "id": "userId",
    "userId": "userId",
    "weeks": {
      "2025-W43": {
        "goals": [/* weekly goal entries */]
      }
    }
  }
  ```

### Partition Keys
- All containers use `/userId` as partition key (except teams which uses `/managerId`)

### Goal Tracking
- Goals defined in dreams container (source of truth for goal metadata)
- Weekly tracking entries in weeksYYYY container (completion status per week)
- Each weekly entry references parent goal via `goalId`
- No more templates - direct goal-to-week relationship

## Future Enhancements

1. **Smart Week Recalculation**: When editing goal duration, delete old entries beyond new range
2. **Bulk Operations**: Optimize weekly entry creation with batch API calls
3. **Rolling Window Auto-Extend**: For unlimited consistency goals, automatically add next week when current week completes
4. **Goal Analytics**: Track completion rates, streaks, and trends per goal
5. **Multi-Year Support**: Handle goals that span across year boundaries (2025 → 2026)

## Files Modified

1. `src/utils/dateUtils.js` - Added getNextNWeeks utility
2. `src/components/DreamTrackerModal.jsx` - Auto-populate and cleanup logic
3. `src/pages/Dashboard.jsx` - Real-time week goals loading and display
4. `src/components/MilestoneAccordion.jsx` - DELETED (deprecated)

## Console Logging

All operations include structured logging:
- `📅 Auto-populating N weeks for goal "X"`
- `✅ Goal toggled: goalId`
- `🧹 Cleaning up weekly entries for goal goalId`
- `📅 Dashboard: Loading current week goals for 2025-W43`

## Cosmos DB Verification

To verify correct operation:

1. **Check dreams container** for user document with goals array
2. **Check weeks2025 container** for user document with nested weeks
3. Each week should have goals array with entries matching goalId
4. No duplicate documents per user (partition key ensures uniqueness)

---

**Status**: ✅ Implementation Complete
**Next Step**: User testing and feedback

