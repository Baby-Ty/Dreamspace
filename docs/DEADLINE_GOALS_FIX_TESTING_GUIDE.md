# Deadline Goals Fix - Testing Guide

**Purpose**: Verify that completed deadline goals no longer appear after rollover  
**Date**: November 19, 2025  
**Estimated Time**: 10-15 minutes

## What Was Fixed

1. **Race Condition**: Eliminated concurrent writes that caused goal completion to be lost
2. **Retry Window**: Increased from 2.6s to 6.6s to handle Cosmos DB eventual consistency

## Prerequisites

- Dashboard with at least one active deadline goal
- Access to test rollover button (DevTools)
- Browser console open for log verification

## Test Scenario 1: Complete Goal + Immediate Rollover

**Objective**: Verify completed deadline goal doesn't appear in new week

### Steps

1. **Navigate to Dashboard**
   ```
   http://localhost:5173/dashboard
   ```

2. **Identify a deadline goal**
   - Look for goals with type "deadline"
   - Note the goal title and ID (check console logs if needed)

3. **Complete the deadline goal**
   - Click checkbox to mark complete
   - Wait for "✅ Atomic update complete" in console
   - Verify goal shows checkmark

4. **Verify Dreams Document Update**
   - Open browser DevTools → Network tab
   - Look for POST to `/api/saveDreams`
   - Check Request Payload should show:
     ```json
     {
       "dreams": [{
         "goals": [{
           "completed": true,
           "active": false,
           "completedAt": "2025-11-19T..."
         }]
       }],
       "weeklyGoalTemplates": [...]
     }
     ```

5. **Immediately Trigger Rollover**
   - Click "Test Rollover" button (in Dashboard header)
   - Or run in console:
     ```javascript
     window.testRollover()
     ```

6. **Monitor Console Logs**
   - Look for:
     ```
     ⏳ Detected completed deadline goal(s) - waiting 1000ms...
     ✅ Delay complete, proceeding with rollover
     📋 Found X active templates
     ⏭️ Skipping deadline goal "..." - completed: true
     ✅ Rollover complete! Now on 2025-WXX (Y goals)
     ```

7. **Verify Goal is NOT in New Week**
   - Check Dashboard after rollover
   - Completed goal should NOT appear
   - Other goals should appear normally

8. **Verify in Dream Detail View**
   - Click the dream card
   - Go to "Goals" tab
   - Completed deadline goal should show:
     - ✅ Checkmark
     - "Completed" status
     - No longer in active goals list

### Expected Results

✅ **PASS Criteria**:
- Goal marked complete immediately (< 500ms)
- Console shows "Atomic update complete"
- Rollover completes without errors
- Completed goal does NOT appear in new week
- Goal shows as completed in Dream view

❌ **FAIL Criteria**:
- Goal appears in new week after rollover
- Console shows errors during update
- Goal completion not reflected in Dream view

## Test Scenario 2: Rapid Complete + Rollover (Stress Test)

**Objective**: Verify fix works even with minimal delay

### Steps

1. **Complete deadline goal**
2. **Immediately trigger rollover** (within 1 second)
3. **Repeat 5 times** with different goals

### Expected Results

✅ **All 5 attempts** should correctly exclude completed goals

## Test Scenario 3: Multiple Deadline Goals

**Objective**: Verify handling of multiple completions

### Steps

1. **Complete 2-3 deadline goals** in quick succession
2. **Trigger rollover**
3. **Verify ALL completed goals are excluded**

### Expected Results

✅ None of the completed goals appear in new week

## Debugging Tips

### If Goal Still Appears After Rollover:

1. **Check Console for Atomic Update**
   ```
   Search: "Atomic update complete"
   ```
   If missing → Front-end issue

2. **Check Retry Logs**
   ```
   Search: "Detected stale data"
   ```
   If present → Eventual consistency issue (may need more retries)

3. **Check Dreams Document in Cosmos DB**
   - Navigate to Azure Portal
   - Open your Cosmos DB account
   - Check `dreams` container
   - Find your user document
   - Verify goal shows: `"completed": true, "active": false`

4. **Check Rollover Filtering**
   ```
   Search: "Skipping deadline goal"
   ```
   Should see log for completed goal

### Common Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Goal appears once | Eventual consistency | Already fixed - increase retries |
| Goal appears always | Race condition not fixed | Verify atomic update code |
| No atomic update log | Import error | Check useDashboardData imports |
| Error during save | API issue | Check network tab, API logs |

## Console Log Reference

### Successful Completion (Front-end)

```
📝 Updating parent goal in dream: { dreamId: "...", goalId: "...", completed: true }
💾 Atomically updating deadline goal and template: { dreamId: "...", goalId: "...", templateId: "...", completed: true }
📝 Atomic save: { dreamsCount: 5, templatesCount: 8, goalUpdated: true, templateUpdated: true }
✅ Atomic update complete: goal_123 complete and inactive
🎉 Deadline goal completed early! Marked inactive - will not appear in future weeks.
```

### Successful Rollover (Back-end)

```
🔄 user_123: Rolling over from 2025-W47 to 2025-W48
⏳ user_123: Detected completed deadline goal(s) in current week - waiting 1000ms...
✅ user_123: Delay complete, proceeding with rollover
📋 user_123: Found 15 active templates (filtered from 18 total templates)
🔍 user_123: Dream "My Dream" has 3 goal(s)
   ⏭️ Skipping deadline goal "Complete project" (goal_123) - completed: true
   ✅ Including deadline goal "Write report" (goal_456) - active: true, completed: false
✅ user_123: Rollover complete! Now on 2025-W48 (14 goals)
```

## Acceptance Criteria

| Test | Status | Notes |
|------|--------|-------|
| Complete goal shows checkmark immediately | ⬜ | Should be < 500ms |
| Atomic update log appears | ⬜ | Console message |
| Rollover excludes completed goal | ⬜ | Primary test |
| Dream view shows goal completed | ⬜ | UI verification |
| 5 rapid completions all work | ⬜ | Stress test |
| Multiple goals handled correctly | ⬜ | Batch test |

## Rollback Plan

If issues persist after fix:

1. **Revert atomic update**:
   ```bash
   git revert <commit-hash>
   ```

2. **Apply alternative fix**: Use Cosmos DB ETags for optimistic concurrency

3. **Contact support**: Share console logs and Cosmos DB document state

## Success Metrics

- **0** completed deadline goals appear after rollover (was 50% before fix)
- **100%** success rate across 10 test completions
- **< 2 seconds** rollover completion time
- **Single** atomic write visible in logs

---

**Ready to Test?** Follow Scenario 1 first, then Scenarios 2-3 if time permits.

