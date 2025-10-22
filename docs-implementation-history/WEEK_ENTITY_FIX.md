# Week Entity Fix - Implementation Summary

**Date**: October 22, 2025  
**Status**: ✅ Complete - Ready for Testing

## Problem Statement

### Issue 1: Weeks Not Individual Entities
Currently, weekly goals use a `weekLog` object pattern:
```javascript
{
  id: "goal_123",
  title: "Exercise 3 times",
  recurrence: "weekly",
  weekLog: {
    "2025-W41": true,   // Week 41 completed
    "2025-W42": false,  // Week 42 not completed
    "2025-W43": false   // Week 43 not completed
  }
}
```

**Problems**:
- ❌ Updating week 3 updates the entire document (appears to update all weeks)
- ❌ All weeks share the same title/description (no week-specific variations)
- ❌ Can't track week-specific notes or modifications
- ❌ Poor query performance (must load entire goal to check one week)
- ❌ Doesn't align with 3-container architecture principles

### Issue 2: Data Not Fully Utilizing 3-Container Architecture

While the infrastructure is in place, the frontend still saves data in monolithic format:
- Dreams, goals, milestones stored in ONE container
- Frontend saves entire `currentUser` object with arrays
- APIs split on save, but this is inefficient

**Correct 3-Container Design**:
```
Container 1: users
  - User profile, role, metrics
  - NO arrays

Container 2: items  
  - Individual dreams (type: 'dream')
  - Individual weekly goal instances (type: 'weekly_goal')
  - Individual scoring entries (type: 'scoring_entry')
  - Individual connects (type: 'connect')
  - Each week = separate document

Container 3: teams
  - Team relationships
```

## Solution Design

### New Weekly Goal Model

**One-Time Goals** (existing behavior):
```javascript
{
  id: "goal_123",
  userId: "user@example.com",
  type: "weekly_goal",
  title: "Complete project proposal",
  description: "Finish and submit",
  recurrence: "once",
  weekId: "2025-W43",  // Specific week
  completed: false,
  dreamId: "dream_456",
  createdAt: "2025-10-22T10:00:00Z",
  updatedAt: "2025-10-22T10:00:00Z"
}
```

**Recurring Goals** (NEW - creates instances per week):
```javascript
// Master template (optional, for UI to know it's recurring)
{
  id: "goal_template_123",
  userId: "user@example.com",
  type: "weekly_goal_template",
  title: "Exercise 3 times",
  description: "Cardio or strength training",
  recurrence: "weekly",
  active: true,
  dreamId: "dream_456",
  milestoneId: "milestone_789",
  durationType: "unlimited",  // or "weeks", "milestone"
  durationWeeks: 12,
  startDate: "2025-10-22T10:00:00Z",
  createdAt: "2025-10-22T10:00:00Z"
}

// Week 41 instance
{
  id: "goal_instance_123_2025W41",
  userId: "user@example.com",
  type: "weekly_goal",
  title: "Exercise 3 times",
  description: "Cardio or strength training",
  recurrence: "weekly",
  templateId: "goal_template_123",  // Link to template
  weekId: "2025-W41",
  completed: true,
  dreamId: "dream_456",
  createdAt: "2025-10-22T10:00:00Z",
  updatedAt: "2025-10-22T10:00:00Z"
}

// Week 42 instance
{
  id: "goal_instance_123_2025W42",
  userId: "user@example.com",
  type: "weekly_goal",
  title: "Exercise 3 times",
  description: "Cardio or strength training",  
  recurrence: "weekly",
  templateId: "goal_template_123",
  weekId: "2025-W42",
  completed: false,
  dreamId: "dream_456",
  createdAt: "2025-10-22T10:00:00Z",
  updatedAt: "2025-10-22T10:00:00Z"
}
```

### Benefits

✅ **Each week is independent**: Update week 3 without affecting week 4  
✅ **Week-specific data**: Different titles, notes per week if needed  
✅ **Efficient queries**: Get only goals for specific week  
✅ **True 3-container architecture**: Each entity is a document  
✅ **Better scalability**: Cosmos DB optimized for this pattern  
✅ **Historical tracking**: Easy to see completion patterns  

## Implementation Plan

### Phase 1: Update Schemas ✅
- [x] Update `WeeklyGoalItemSchema` in `src/schemas/item.js`
- [x] Add `weekId` field (required for all goals)
- [x] Add `templateId` field (for recurring goal instances)
- [x] Keep `weekLog` for backward compatibility (marked as deprecated)
- [x] Add `weekly_goal_template` type schema

### Phase 2: Update API Functions ✅
- [x] `api/saveItem/index.js`: Validate weekId for weekly_goal type
- [x] `api/getItems/index.js`: Add weekId filtering support
- [x] `api/getUserData/index.js`: Automatic migration from weekLog to instances
- [x] `api/saveUserData/index.js`: Handles both old and new formats

### Phase 3: Update Frontend Context & Pages ✅
- [x] `src/context/AppContext.jsx`: Updated addWeeklyGoal to require weekId
- [x] `src/context/AppContext.jsx`: LOG_WEEKLY_COMPLETION supports both formats
- [x] `src/pages/DreamsWeekAhead.jsx`: Creates week-specific instances
- [x] `src/pages/DreamsWeekAhead.jsx`: Filters goals by weekId
- [x] `src/pages/DreamsWeekAhead.jsx`: Progress calculations use weekId

### Phase 4: Automatic Migration ✅
- [x] `api/getUserData/index.js`: Detects old `weekLog` pattern on load
- [x] Converts to individual instances automatically
- [x] Deletes old weekLog-based goals after migration
- [x] Creates templates for recurring goals

## Database Impact

### Before (Current - WRONG):
```
items container:
  - goal_123 (weekLog: {W41: true, W42: false, W43: false})
  - goal_456 (weekLog: {W41: false, W42: true})
```

### After (New - CORRECT):
```
items container:
  - goal_template_123 (type: weekly_goal_template)
  - goal_instance_123_W41 (type: weekly_goal, weekId: 2025-W41, completed: true)
  - goal_instance_123_W42 (type: weekly_goal, weekId: 2025-W42, completed: false)
  - goal_instance_123_W43 (type: weekly_goal, weekId: 2025-W43, completed: false)
  - goal_456_W41 (type: weekly_goal, weekId: 2025-W41, completed: false, recurrence: once)
  - goal_456_W42 (type: weekly_goal, weekId: 2025-W42, completed: true, recurrence: once)
```

## Testing Checklist

### New Goal Creation
- [ ] Create one-time goal for specific week (Week 3)
- [ ] Verify goal only appears in Week 3
- [ ] Create recurring goal (unlimited duration)
- [ ] Verify goal appears in next 12 weeks
- [ ] Create recurring goal (4 weeks duration)
- [ ] Verify goal appears in exactly 4 weeks
- [ ] Create recurring goal (until milestone complete)
- [ ] Verify goal appears in next 12 weeks

### Goal Completion
- [ ] Complete goal in Week 1
- [ ] Switch to Week 2 - verify same goal is NOT completed
- [ ] Complete goal in Week 2
- [ ] Switch back to Week 1 - verify still completed
- [ ] Switch to Week 3 - verify not completed

### Goal Editing
- [ ] Edit goal title in Week 3
- [ ] Verify Week 1 and Week 2 have OLD title (if one-time)
- [ ] For recurring goals, all future instances should update

### Goal Deletion
- [ ] Delete one-time goal in Week 2
- [ ] Verify only Week 2 instance deleted
- [ ] Delete recurring goal template
- [ ] Verify all instances deleted

### Migration Testing
- [ ] Load user with old weekLog pattern
- [ ] Verify automatic migration creates instances
- [ ] Verify old goal is deleted
- [ ] Verify completion status preserved per week

## Migration Notes

For existing users with weekLog pattern:
1. Load their data from Cosmos DB
2. Detect `weekLog` field
3. Create individual instances for each week in the log
4. Delete the old weekLog-based goal document
5. Save new instances to Cosmos DB

This migration will happen automatically on next login/save.

---

## Technical Details

### Query Examples

**Get all goals for specific week**:
```javascript
SELECT * FROM c 
WHERE c.userId = @userId 
  AND c.type = 'weekly_goal'
  AND c.weekId = @weekId
```

**Get all instances of a recurring goal**:
```javascript
SELECT * FROM c 
WHERE c.userId = @userId 
  AND c.type = 'weekly_goal'
  AND c.templateId = @templateId
ORDER BY c.weekId
```

**Get template for editing**:
```javascript
SELECT * FROM c 
WHERE c.userId = @userId 
  AND c.type = 'weekly_goal_template'
  AND c.id = @templateId
```

### Frontend State Management

The frontend will:
1. Load goals for current week only (not all weeks)
2. When user changes week, load that week's goals
3. Create instances on-the-fly when user adds recurring goal
4. Update only the current week's instance when toggling completion

### Backward Compatibility

During transition period:
- Support both weekLog pattern (old) and weekId pattern (new)
- Migrate on save (lazy migration)
- Eventually remove weekLog support after all users migrated

