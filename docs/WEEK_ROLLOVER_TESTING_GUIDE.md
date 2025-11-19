# Week Rollover System - Testing & Deployment Guide

**Date**: November 18, 2025  
**Status**: ✅ **READY FOR TESTING**  
**Implementation**: Complete (Primary + Fallback)

---

## 🎉 What Was Implemented

### Files Created (4)

1. **`api/utils/weekRollover.js`** (330 lines)
   - Shared rollover logic used by both server and client
   - Idempotent operations (safe to run multiple times)
   - Handles weekly/monthly goals, counters, catch-up logic

2. **`api/weeklyRollover/index.js`** (65 lines)
   - Azure timer function (Monday 00:00 UTC)
   - Processes all users
   - Logs detailed summary

3. **`api/weeklyRollover/function.json`** 
   - Timer trigger configuration
   - Schedule: `0 0 * * 1` (every Monday)

4. **`src/hooks/useWeekRollover.js`** (150 lines)
   - Client-side fallback check
   - Runs once per session on login
   - Silent failure (doesn't block UI)

### Files Modified (1)

1. **`src/pages/dashboard/DashboardLayout.jsx`**
   - Added `useWeekRollover()` hook
   - One line change!

---

## 🔄 How It Works

### Primary: Server-Side Timer

```
Every Monday 00:00 UTC
├─ For each user:
│  ├─ Check: currentWeek.weekId vs actual week
│  ├─ If different:
│  │  ├─ Archive old week → pastWeeks
│  │  ├─ Create new week from templates
│  │  └─ Decrement counters
│  └─ If same: Skip (already done)
└─ Log summary results
```

### Fallback: Client-Side Check

```
User logs in
├─ Wait 1 second (let data load)
├─ Check: currentWeek.weekId vs actual week
├─ If different:
│  ├─ Archive old week
│  ├─ Reload page (triggers auto-instantiation)
│  └─ Show success message
└─ If same: Skip (server already did it)
```

### Conflict Prevention

Both use the **same check**:
```javascript
if (currentWeek.weekId === actualWeekId) {
  return; // Already rolled over
}
```

This makes it **idempotent** - safe to run multiple times!

---

## 🧪 Testing Plan

### Test 1: Verify Shared Logic

**File**: `api/utils/weekRollover.js`

```bash
# Create a test file
cd api/utils
node
```

```javascript
// In Node REPL:
const { rolloverWeekForUser, getCurrentIsoWeek } = require('./weekRollover');

// Test ISO week calculation
console.log(getCurrentIsoWeek()); // Should show current week like "2025-W47"

// Test week parsing
const { parseIsoWeek } = require('./weekRollover');
const date = parseIsoWeek('2025-W47');
console.log(date); // Should show Monday of that week
```

**Expected**: No errors, correct week format

---

### Test 2: Local Timer Function Test

**Prerequisites**:
- Azure Functions Core Tools installed
- Local.settings.json configured

```bash
cd api
func start
```

**Manually trigger the timer**:
```bash
# In another terminal:
curl -X POST http://localhost:7071/admin/functions/weeklyRollover
```

**What to check**:
- [ ] Function runs without errors
- [ ] Console shows "Weekly Rollover Timer Triggered"
- [ ] Shows user count and results
- [ ] No failed rollovers

**Expected Output**:
```
🔄 Weekly Rollover Timer Triggered
Timestamp: 2025-11-18T...
📋 Found 5 users to process
✅ user1@example.com: Already on current week (2025-W47)
✅ user2@example.com: Already on current week (2025-W47)

📊 Weekly Rollover Complete:
   Total users: 5
   ✅ Rolled over: 0
   ⏭️  Already current: 5
   ❌ Failed: 0
```

---

### Test 3: Simulate Week Change (Client Fallback)

**Step 1: Setup test data**

In your database, manually update a test user's `currentWeek` document to last week:

```javascript
// Use Azure Portal Data Explorer or your DB client:
{
  "id": "test@example.com",
  "userId": "test@example.com",
  "weekId": "2025-W46", // ← Last week (fake old data)
  "weekStartDate": "2025-11-10",
  "weekEndDate": "2025-11-16",
  "goals": [
    {
      "id": "goal1_2025-W46",
      "title": "Test Goal",
      "completed": true,
      "weeksRemaining": 12
    }
  ],
  "stats": {
    "totalGoals": 1,
    "completedGoals": 1
  }
}
```

**Step 2: Login as that user**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Login to the app as `test@example.com`
4. Navigate to Dashboard

**What to watch for**:

✅ **Console logs**:
```
🔄 New week detected! Updating your goals...
✅ Week rollover complete! Welcome to 2025-W47
📊 Last week: 1/1 goals completed (3 points)
```

✅ **Page reloads automatically** after ~500ms

✅ **After reload**:
- Week 47 goals appear (fresh, not completed)
- Past Weeks modal shows Week 46 stats
- No errors in console

**Step 3: Verify archive**

Check `pastWeeks` container for the user:
```json
{
  "id": "test@example.com",
  "userId": "test@example.com",
  "weekHistory": {
    "2025-W46": {
      "totalGoals": 1,
      "completedGoals": 1,
      "score": 3,
      "weekStartDate": "2025-11-10",
      "weekEndDate": "2025-11-16",
      "archivedAt": "2025-11-18T..."
    }
  },
  "totalWeeksTracked": 1
}
```

---

### Test 4: Verify No Duplicate Rollover

**Scenario**: Both server and client run

**Setup**:
1. Run server timer manually: `curl -X POST http://localhost:7071/admin/functions/weeklyRollover`
2. Immediately login as a user

**Expected**:
- Server archives Week 46 → creates Week 47
- Client checks: Week 47 === Week 47 ✅
- Client skips rollover
- Console shows: "Week is current, no rollover needed"
- Only ONE archive entry in pastWeeks

---

### Test 5: Monthly Goal Persistence

**Setup**: Create a monthly goal (2x per month)

**Week 1 of month**:
- User completes goal once (1/2)
- Week rolls over

**Week 2 of same month**:
- Goal should still show (1/2)
- User completes again (2/2)
- Goal marks complete

**Week 1 of next month**:
- Goal resets to (0/2)
- Fresh start

**How to test**:
1. Create monthly goal with frequency: 2
2. Complete it once
3. Check database after rollover:
   ```json
   {
     "completionCount": 1,
     "completionDates": ["2025-11-15T..."],
     "monthsRemaining": 5
   }
   ```
4. Verify it persists through weeks in same month
5. Verify it resets on month boundary

---

### Test 6: Skip Week Functionality

**Setup**: Create a weekly goal, skip it

**Week N**:
- Goal shows with `weeksRemaining: 12`
- User clicks "Skip this week"
- Goal disappears from current week

**Week N+1 (after rollover)**:
- Goal reappears
- `weeksRemaining` should still be 12 (not 11!)
- Skipped weeks don't count against duration

**Database check**:
```json
{
  "id": "goal_2025-W47",
  "skipped": true,
  "weeksRemaining": 12
}
```

Then next week:
```json
{
  "id": "goal_2025-W48",
  "skipped": false,
  "weeksRemaining": 12  // ← Didn't decrement!
}
```

---

### Test 7: Counter Decrements

**Setup**: Create weekly goal with 12 weeks remaining

**Week 1**:
- `weeksRemaining: 12`
- User completes goal

**Week 2 (after rollover)**:
- `weeksRemaining: 11`

**Week 3**:
- `weeksRemaining: 10`

... continues until:

**Week 12**:
- `weeksRemaining: 1`

**Week 13 (after rollover)**:
- Goal STOPS appearing
- `weeksRemaining: 0` means goal expired

---

### Test 8: Catch-Up Logic

**Setup**: User doesn't login for 2 weeks

**Starting state**:
- Current week: 2025-W45
- User last active: 2025-W45

**Two weeks pass**: Now actual week is 2025-W47

**User logs in**:
- Client detects: W45 !== W47
- Archives W45 (with real stats)
- Archives W46 (with empty stats - missed week)
- Creates W47

**Database check** - `pastWeeks` should show:
```json
{
  "weekHistory": {
    "2025-W45": { "completedGoals": 3, ... },
    "2025-W46": { "totalGoals": 0, "completedGoals": 0 }  // Missed week
  }
}
```

---

## 🚀 Deployment Checklist

### Phase 1: Local Testing

- [ ] Test shared rollover logic
- [ ] Test server timer locally
- [ ] Test client fallback simulation
- [ ] Verify no duplicate rollovers
- [ ] Test monthly goal persistence
- [ ] Test skip week functionality
- [ ] Test counter decrements
- [ ] Test catch-up logic

### Phase 2: Development Deployment

- [ ] Deploy `api/utils/weekRollover.js`
- [ ] Deploy `api/weeklyRollover/` function
- [ ] Deploy updated `DashboardLayout.jsx`
- [ ] Deploy `useWeekRollover.js` hook
- [ ] Test in dev environment
- [ ] Manually trigger timer in Azure Portal
- [ ] Monitor logs for 1 week

### Phase 3: Production Deployment

- [ ] Verify timer schedule is correct (Monday 00:00 UTC)
- [ ] Enable Azure Function monitoring
- [ ] Set up alerts for failed rollovers
- [ ] Deploy to production
- [ ] Monitor first rollover (next Monday)
- [ ] Check logs for all users processed

### Phase 4: Monitoring (First Week)

**Check daily**:
- [ ] Azure Function execution logs
- [ ] Any failed rollovers
- [ ] Client-side fallback triggers (should be rare)
- [ ] pastWeeks data integrity
- [ ] User feedback (goals appearing correctly)

**Monday morning** (after first timer run):
- [ ] Verify timer executed at 00:00 UTC
- [ ] Check rollover summary logs
- [ ] Spot-check 5-10 users:
  * currentWeek shows new week
  * pastWeeks has previous week archived
  * Goals correctly instantiated

---

## 🔍 Monitoring & Logs

### Server-Side Logs (Azure Portal)

**Path**: Azure Functions → weeklyRollover → Monitor

**Look for**:
```
✅ Success patterns:
- "Weekly Rollover Timer Triggered"
- "Found X users to process"
- "📊 Weekly Rollover Complete"
- "Rolled over: X"

❌ Error patterns:
- "❌ Failed rollovers:"
- "Rollover failed:"
- Exception stack traces
```

### Client-Side Logs (Browser Console)

**Users should see**:
```
✅ Normal login (server already rolled over):
- No rollover messages
- Just normal Dashboard loading

🔄 Fallback triggered (server missed it):
- "🔄 New week detected! Updating your goals..."
- "✅ Week rollover complete! Welcome to 2025-W47"
- Page reloads
```

---

## 🐛 Troubleshooting

### Issue: Timer not running

**Check**:
1. Function app is running (not stopped)
2. Timer schedule is correct: `0 0 * * 1`
3. `runOnStartup: false` (don't want it running on every deployment)
4. Check Azure Function logs for errors

**Fix**: Manually trigger via Azure Portal:
```
Functions → weeklyRollover → Code + Test → Test/Run
```

### Issue: Duplicate archives

**Symptom**: pastWeeks has two entries for same week

**Cause**: Both server and client ran, but check failed

**Debug**:
1. Check currentWeek.weekId value
2. Verify getCurrentIsoWeek() returns correct format
3. Add more logging to rolloverWeekForUser

**Fix**: Idempotent design should prevent this, but if it happens:
- Delete duplicate from pastWeeks manually
- Fix the comparison logic

### Issue: Goals not appearing

**Symptom**: User sees empty current week after rollover

**Check**:
1. Templates exist in dreams container
2. Templates have `active: true`
3. Templates aren't expired (weeksRemaining > 0)
4. Dream isn't completed

**Debug**:
```javascript
// Check templates:
const dreamsDoc = await cosmosProvider.getDreamsDocument(userId);
console.log('Templates:', dreamsDoc.weeklyGoalTemplates);

// Check active templates:
const active = dreamsDoc.weeklyGoalTemplates.filter(t => t.active !== false);
console.log('Active:', active);
```

### Issue: Counters not decrementing

**Symptom**: Goal has same weeksRemaining week after week

**Check**:
1. Previous goal wasn't skipped
2. Template has valid weeksRemaining value
3. Rollover logic runs

**Debug**: Add logging to createGoalsFromTemplates:
```javascript
console.log('Previous goal:', previousInstance);
console.log('Was skipped:', previousInstance?.skipped);
console.log('New weeksRemaining:', instance.weeksRemaining);
```

---

## 📊 Success Metrics

After 1 week in production:

✅ **Timer Execution**:
- [ ] Runs every Monday at 00:00 UTC
- [ ] Processes all users (100% success rate)
- [ ] Completes in < 30 seconds

✅ **Data Integrity**:
- [ ] All users have current weekId
- [ ] Past weeks archived correctly
- [ ] No duplicate archives

✅ **User Experience**:
- [ ] Users see fresh goals every Monday
- [ ] Completed goals don't carry over
- [ ] Counter decrements work
- [ ] Monthly goals persist correctly

✅ **Fallback Effectiveness**:
- [ ] Client fallback rarely triggers (< 1% of logins)
- [ ] When it does trigger, works correctly
- [ ] No errors reported

---

## 🎯 Test Script Summary

```bash
# 1. Local function test
cd api
func start
curl -X POST http://localhost:7071/admin/functions/weeklyRollover

# 2. Simulate old week (use DB client)
# Set currentWeek.weekId to last week

# 3. Test client fallback
# Login and watch console

# 4. Verify archive
# Check pastWeeks container

# 5. Test monthly goals
# Create monthly goal, complete 1/2, rollover, verify persistence

# 6. Test skip week
# Skip goal, rollover, verify it reappears with same counter

# 7. Test catch-up
# Simulate 2 weeks passed, login, verify both weeks archived

# 8. Production deploy
# Deploy all files
# Monitor first Monday rollover
```

---

## ✅ Ready for Production?

**Requirements**:
- [x] All code files created
- [x] No linter errors
- [ ] Local timer test passes
- [ ] Client fallback test passes
- [ ] Monthly goal test passes
- [ ] Skip week test passes
- [ ] Counter decrement test passes
- [ ] Catch-up logic test passes

**Once all tests pass**: Deploy to production and monitor first week!

---

**Implementation By**: AI Agent (Claude Sonnet 4.5)  
**Date**: November 18, 2025  
**Status**: ✅ Ready for Testing  
**Next Step**: Run Test 1 (Verify Shared Logic)

