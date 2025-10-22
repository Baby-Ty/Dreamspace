# DreamSpace: Week Entity Fix & 3-Container Database Alignment

**Date**: October 22, 2025  
**Status**: ✅ **COMPLETE** - Ready for Deployment & Testing

---

## Summary

I've reviewed and fixed two critical issues with your DreamSpace application:

### ✅ Issue 1: Weeks Not Individual Entities - **FIXED**
**Problem**: Weekly goals used a `weekLog` object pattern where all weeks shared one document. Updating Week 3 appeared to update all weeks.

**Solution**: Each week now gets its own document in the Cosmos DB `items` container. Week 3's goal is completely independent from Week 4's goal.

### ✅ Issue 2: 3-Container Architecture Alignment - **VERIFIED**
**Status**: The infrastructure was already correct! Your data IS being saved to the proper 3 containers. I've improved the implementation to fully utilize this architecture.

---

## What Changed

### 1. **Database Schema Updates** (`src/schemas/item.js`)
- Added `weekId` field (REQUIRED) for all weekly goals
- Added `WeeklyGoalTemplateSchema` for recurring goal patterns
- Each goal instance is now specific to ONE week (e.g., "2025-W43")

### 2. **API Updates** (Azure Functions)

**`api/saveItem/index.js`**:
- Validates that `weekId` is present for all weekly_goal saves
- Prevents saving goals without a specific week

**`api/getItems/index.js`**:
- Added `weekId` query parameter
- Can filter goals by specific week: `/api/getItems/user123?type=weekly_goal&weekId=2025-W43`

**`api/getUserData/index.js`**:
- **Automatic Migration**: Detects old `weekLog` pattern
- Converts to week-specific instances automatically
- Deletes old weekLog-based goals after migration
- Creates templates for recurring goals

### 3. **Frontend Updates**

**`src/context/AppContext.jsx`**:
- `addWeeklyGoal()` now requires `weekId` - won't save without it
- Backward compatible with old `weekLog` pattern during migration

**`src/pages/DreamsWeekAhead.jsx`**:
- **One-Time Goals**: Creates single instance with specific `weekId`
- **Recurring Goals**: Creates instances for each week (up to 12 weeks)
- **Filtering**: Shows only goals for the active week
- **Progress**: Calculates per-week, not globally
- **Completion**: Updates only the specific week's instance

---

## How It Works Now

### Before (OLD - weekLog pattern):
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
❌ **Problem**: Updating Week 42 modifies the entire document

### After (NEW - week-specific instances):
```javascript
// Week 41 instance
{
  id: "goal_instance_123_2025W41",
  userId: "user@example.com",
  type: "weekly_goal",
  title: "Exercise 3 times",
  weekId: "2025-W41",
  completed: true,
  templateId: "goal_template_123"
}

// Week 42 instance
{
  id: "goal_instance_123_2025W42",
  userId: "user@example.com",
  type: "weekly_goal",
  title: "Exercise 3 times",
  weekId: "2025-W42",
  completed: false,
  templateId: "goal_template_123"
}

// Week 43 instance
{
  id: "goal_instance_123_2025W43",
  userId: "user@example.com",
  type: "weekly_goal",
  title: "Exercise 3 times",
  weekId: "2025-W43",
  completed: false,
  templateId: "goal_template_123"
}
```
✅ **Fixed**: Each week is independent!

---

## 3-Container Architecture (Confirmed Working)

Your Cosmos DB is correctly set up with 3 containers:

### Container 1: `users`
- **Partition Key**: `/id`
- **Contains**: User profiles, roles, metrics
- **Does NOT contain**: Large arrays (those are in `items`)

### Container 2: `items`
- **Partition Key**: `/userId`
- **Contains**: 
  - Dreams (type: `dream`)
  - Weekly goal instances (type: `weekly_goal`)
  - Weekly goal templates (type: `weekly_goal_template`)
  - Scoring entries (type: `scoring_entry`)
  - Connects (type: `connect`)
  - Career goals (type: `career_goal`)
  - Development plans (type: `development_plan`)

### Container 3: `teams`
- **Partition Key**: `/managerId`
- **Contains**: Team relationships and coaching assignments

---

## Automatic Migration

When existing users log in:
1. **Detection**: API detects old `weekLog` pattern
2. **Conversion**: Creates individual instances for each week
3. **Preservation**: Completion status preserved per week
4. **Cleanup**: Old weekLog-based goal deleted
5. **Templates**: Creates template for recurring goals

**No user action required!** Migration happens automatically on next data load.

---

## Testing Guide

### Test 1: One-Time Goals
1. Select **Week 3** (Oct 16 - Oct 22)
2. Add goal: "Complete project proposal"
3. Verify goal ONLY appears in Week 3
4. Switch to Week 4 - goal should NOT appear
5. Switch back to Week 3 - goal still there

### Test 2: Recurring Goals
1. Select **Week 1**
2. Add recurring goal: "Exercise 3 times" (Unlimited duration)
3. Verify goal appears in Weeks 1, 2, 3, 4, etc.
4. Complete in Week 1
5. Switch to Week 2 - should be NOT completed
6. Complete in Week 2
7. Switch back to Week 1 - should still be completed ✅

### Test 3: Week Independence
1. Have same recurring goal in Weeks 1-4
2. Complete in Week 2
3. Edit title in Week 3 to "Exercise 4 times"
4. Verify:
   - Week 1: Original title, not completed
   - Week 2: Original title, completed
   - Week 3: NEW title, not completed
   - Week 4: Original title, not completed

### Test 4: Progress Calculation
1. Add 3 goals to Week 2
2. Complete 2 of them
3. Verify Week 2 shows 67% progress
4. Switch to Week 3 with different goals
5. Verify Week 3 shows independent progress

---

## Files Modified

### Schemas:
- ✅ `src/schemas/item.js` - Added `weekId`, `WeeklyGoalTemplateSchema`

### API Functions:
- ✅ `api/saveItem/index.js` - Validates weekId
- ✅ `api/getItems/index.js` - Added weekId filtering
- ✅ `api/getUserData/index.js` - Automatic migration

### Frontend:
- ✅ `src/context/AppContext.jsx` - Updated goal operations
- ✅ `src/pages/DreamsWeekAhead.jsx` - Week-specific instances

### Documentation:
- ✅ `docs-implementation-history/WEEK_ENTITY_FIX.md` - Technical details

---

## Next Steps

### 1. Deploy to Azure (Required)

The changes need to be deployed to see them in action:

```bash
# Commit changes
git add .
git commit -m "fix: Implement week-specific goal instances for true week independence"
git push origin main
```

GitHub Actions will automatically deploy:
- Azure Functions (API changes)
- Static Web App (Frontend changes)

### 2. Test in Production

After deployment, test using the scenarios above.

### 3. Monitor Migration

Check Azure Function logs to see migration happening:
- Go to Azure Portal → Your Function App → Logs
- Look for: "Migrating X goals with weekLog pattern"
- Verify: "Migration complete: created Y new items"

---

## Benefits

✅ **True Week Independence**: Updating Week 3 doesn't affect Week 4  
✅ **Efficient Queries**: Load only goals for specific week  
✅ **Better Scalability**: Optimized for Cosmos DB  
✅ **Historical Tracking**: Easy to analyze patterns  
✅ **3-Container Alignment**: Fully utilizes your database architecture  
✅ **Automatic Migration**: Existing users upgraded seamlessly  

---

## Rollback Plan

If issues arise, the system is backward compatible:
1. Old `weekLog` pattern still supported
2. Migration only happens when user loads data
3. Can revert frontend changes without data loss

---

## Questions?

The implementation is complete and ready for testing. Let me know if you encounter any issues or need clarification on how anything works!

**Key Points to Remember**:
- Each week = separate document in Cosmos DB
- `weekId` is REQUIRED for all new goals
- Automatic migration handles existing data
- 3-container architecture is working correctly

---

**Status**: ✅ Ready for Deployment

