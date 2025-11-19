# Week Rollover System Review

**Date**: November 18, 2025  
**Status**: ⚠️ **INCOMPLETE** - Critical rollover logic is missing

---

## 📋 Executive Summary

The week rollover system has a good foundation with the `currentWeek` and `pastWeeks` containers, BUT **the automatic rollover logic is NOT implemented**. When a new week starts, there's no code that:
1. Archives the old week stats to `pastWeeks`
2. Creates a new `currentWeek` with fresh goals from templates

### ⚠️ Critical Issue

**The week rollover does NOT happen automatically.** Users who complete goals in Week 47 will still see the same goals in Week 48, with the same completion status. There's no mechanism to detect the week change and trigger the rollover.

---

## 🏗️ Current Architecture

### Containers

#### 1. `currentWeek` Container
- **Partition Key**: `/userId`
- **Document ID**: `{userId}`
- **Purpose**: One document per user containing active goals for the current week

```json
{
  "id": "user@example.com",
  "userId": "user@example.com",
  "weekId": "2025-W47",
  "weekStartDate": "2025-11-17",
  "weekEndDate": "2025-11-23",
  "goals": [
    {
      "id": "goal_123_2025-W47",
      "templateId": "goal_123",
      "title": "Run 5km",
      "completed": false,
      "skipped": false,
      "weeksRemaining": 11
    }
  ],
  "stats": {
    "totalGoals": 5,
    "completedGoals": 2
  }
}
```

#### 2. `pastWeeks` Container
- **Partition Key**: `/userId`
- **Document ID**: `{userId}`
- **Purpose**: One document per user containing all historical week summaries

```json
{
  "id": "user@example.com",
  "userId": "user@example.com",
  "weekHistory": {
    "2025-W46": {
      "totalGoals": 6,
      "completedGoals": 4,
      "score": 12,
      "weekStartDate": "2025-11-10",
      "weekEndDate": "2025-11-16",
      "archivedAt": "2025-11-17T00:00:00Z"
    },
    "2025-W45": {
      "totalGoals": 5,
      "completedGoals": 3,
      "score": 9,
      "weekStartDate": "2025-11-03",
      "weekEndDate": "2025-11-09",
      "archivedAt": "2025-11-10T00:00:00Z"
    }
  },
  "totalWeeksTracked": 47
}
```

### API Endpoints (✅ Implemented)

| Endpoint | Status | Purpose |
|----------|--------|---------|
| `GET /api/getCurrentWeek/{userId}` | ✅ Working | Get current week document |
| `POST /api/saveCurrentWeek` | ✅ Working | Save current week goals |
| `POST /api/archiveWeek` | ✅ Working | Archive week to pastWeeks |
| `GET /api/getPastWeeks/{userId}` | ✅ Working | Get past weeks history |
| `Timer: /api/weeklyRollover` | ❌ NOT IMPLEMENTED | **MISSING** |

---

## 🔄 How Week Rollover SHOULD Work

### Ideal Flow (Not Implemented)

```
Sunday 11:59 PM - End of Week 47
================================
1. Get current week document (2025-W47)
2. Calculate stats:
   - totalGoals: 5
   - completedGoals: 3
   - skippedGoals: 1
   - score: 9 points

3. Archive to pastWeeks:
   POST /api/archiveWeek
   {
     "userId": "user@example.com",
     "weekId": "2025-W47",
     "weekSummary": {
       "totalGoals": 5,
       "completedGoals": 3,
       "skippedGoals": 1,
       "score": 9,
       "weekStartDate": "2025-11-17",
       "weekEndDate": "2025-11-23"
     }
   }

4. Create new current week (2025-W48):
   - Get active templates from dreams container
   - Filter templates where:
     * active === true
     * dream is not completed
     * weeksRemaining > 0 (for weekly goals)
     * monthsRemaining > 0 (for monthly goals)
   - Create new goal instances:
     * id: `${templateId}_2025-W48`
     * completed: false (fresh start)
     * weeksRemaining: template.weeksRemaining - 1
   - Save to currentWeek container

5. User logs in Monday morning:
   - Sees fresh goals for Week 48
   - Past week's stats saved to history
```

### Current Reality (❌ Broken)

```
Sunday 11:59 PM - End of Week 47
================================
1. Nothing happens
2. No automatic archiving
3. No new week creation

Monday Morning:
- User logs in
- Still sees Week 47 goals
- Completed goals still marked complete
- No fresh start for new week
- Stats not saved to history
```

---

## 🐛 The Problem

### Missing Implementation: Week Change Detection

**File**: None exists!  
**Expected Location**: `api/weeklyRollover/index.js` OR `src/hooks/useWeekRollover.js`

The system needs ONE of these approaches:

#### Option A: Server-Side Timer (Recommended)
Azure Function with timer trigger that runs Monday 00:00 UTC:

```javascript
// api/weeklyRollover/index.js (DOES NOT EXIST)
module.exports = async function (context, req) {
  // Runs every Monday at 00:00 UTC
  
  // 1. Get all users
  const users = await getAllUsers();
  
  // 2. For each user:
  for (const user of users) {
    const currentWeek = await cosmosProvider.getCurrentWeekDocument(user.id);
    
    if (currentWeek) {
      // 3. Archive current week to pastWeeks
      const summary = {
        totalGoals: currentWeek.goals.length,
        completedGoals: currentWeek.goals.filter(g => g.completed).length,
        skippedGoals: currentWeek.goals.filter(g => g.skipped).length,
        score: calculateScore(currentWeek.goals),
        weekStartDate: currentWeek.weekStartDate,
        weekEndDate: currentWeek.weekEndDate
      };
      
      await cosmosProvider.archiveWeekToPastWeeks(user.id, currentWeek.weekId, summary);
      
      // 4. Create new current week
      const newWeekId = getCurrentIsoWeek();
      const newGoals = await createGoalsFromTemplates(user.id, newWeekId);
      
      await cosmosProvider.upsertCurrentWeek(user.id, newWeekId, newGoals);
    }
  }
};
```

#### Option B: Client-Side Check on Login (Fallback)
Hook that checks week on every login:

```javascript
// src/hooks/useWeekRollover.js (DOES NOT EXIST)
export function useWeekRollover() {
  const { currentUser } = useApp();
  
  useEffect(() => {
    async function checkWeekRollover() {
      // 1. Get current week document
      const result = await currentWeekService.getCurrentWeek(currentUser.id);
      
      if (!result.success || !result.data) return;
      
      const currentWeekDoc = result.data;
      const actualCurrentWeek = getCurrentIsoWeek();
      
      // 2. Check if stored weekId matches actual current week
      if (currentWeekDoc.weekId !== actualCurrentWeek) {
        console.log('🔄 Week changed! Rolling over...');
        
        // 3. Archive old week
        const summary = {
          totalGoals: currentWeekDoc.goals.length,
          completedGoals: currentWeekDoc.goals.filter(g => g.completed).length,
          // ... other stats
        };
        
        await currentWeekService.archiveWeek(
          currentUser.id,
          currentWeekDoc.weekId,
          summary
        );
        
        // 4. Create new week (will be done by useDashboardData auto-instantiation)
        // Just reload dashboard
        window.location.reload();
      }
    }
    
    if (currentUser?.id) {
      checkWeekRollover();
    }
  }, [currentUser?.id]);
}
```

---

## ✅ What IS Working

### 1. Auto-Instantiation of Goals (✅ Good!)

**File**: `src/hooks/useDashboardData.js` (lines 104-237)

When the Dashboard loads, it:
- Gets the current week document
- Checks which templates need instances
- Auto-creates instances for:
  * Weekly goal templates
  * Deadline goals (if target date is future)
  * Consistency goals from dreams

**This is good**, but it happens EVERY time, not just on week rollover.

### 2. Manual Archive Endpoint (✅ Works!)

**File**: `api/archiveWeek/index.js`

The API endpoint exists and works correctly. It:
- Takes a weekId and weekSummary
- Appends to the pastWeeks document
- Preserves all historical data

**Problem**: Nothing calls this automatically!

### 3. Past Weeks Display (✅ Works!)

**File**: `src/hooks/usePastWeeks.js`

The Dashboard correctly:
- Fetches past weeks from the `pastWeeks` container
- Displays them in PastWeeksModal
- Shows stats and completion rates

**Problem**: Without rollover, pastWeeks stays empty!

---

## 🔧 What Makes Sense (Good Design)

### ✅ Good Aspects

1. **Simple Data Model**
   - One `currentWeek` doc per user (not 52+ documents)
   - One `pastWeeks` doc with all history
   - Fast queries, easy to understand

2. **Clear Separation**
   - `currentWeek` = editable, mutable, current state
   - `pastWeeks` = read-only, immutable, historical summaries

3. **Template System**
   - Templates stored in `dreams` container
   - Instances created per week
   - Allows for flexibility (skip week, stop goal)

4. **Stats Tracking**
   - Lightweight summaries (just numbers, not full goal details)
   - Efficient for charts and analytics

### ⚠️ Design Concerns

1. **No Rollover Trigger**
   - Missing timer function
   - No login check
   - Week never advances automatically

2. **Goal Counter Logic**
   - `weeksRemaining` is supposed to decrement each week
   - Currently never decrements (no rollover)
   - Goals will run forever without stopping

3. **No "Catch-Up" Logic**
   - What if user doesn't log in for 2 weeks?
   - Should we archive Week 47, then Week 48?
   - Or just archive Week 47 and jump to Week 49?

4. **Monthly Goal Persistence**
   - Monthly goals supposed to carry forward through weeks of same month
   - How do we handle this during rollover?
   - Need special logic to preserve `completionCount` within same month

---

## 🚀 Recommendations

### Priority 1: Implement Week Rollover (CRITICAL)

**Option A: Server-Side Timer (Best for Production)**
- Create `api/weeklyRollover/index.js` with timer trigger
- Runs every Monday 00:00 UTC
- Archives previous week
- Creates new week for all users
- **Pros**: Consistent, reliable, runs even if users don't log in
- **Cons**: Need to deploy Azure Function with timer trigger

**Option B: Client-Side Check (Quick Fix)**
- Create `src/hooks/useWeekRollover.js`
- Check on every login if week has changed
- Trigger rollover if needed
- **Pros**: Easy to implement, no Azure timer needed
- **Cons**: Only runs when user logs in, can miss rollovers

### Priority 2: Handle Edge Cases

1. **Catch-Up Logic**
   ```javascript
   // If user missed multiple weeks
   const missedWeeks = getWeeksBetween(currentWeekDoc.weekId, actualCurrentWeek);
   
   for (const weekId of missedWeeks) {
     // Archive each missed week with empty stats
     await archiveWeek(userId, weekId, { totalGoals: 0, completedGoals: 0 });
   }
   ```

2. **Monthly Goal Rollover**
   ```javascript
   // Preserve monthly goal counters within same month
   if (isSameMonth(oldWeekId, newWeekId)) {
     // Keep completionCount
     newGoal.completionCount = oldGoal.completionCount;
     newGoal.completionDates = oldGoal.completionDates;
   } else {
     // Reset for new month
     newGoal.completionCount = 0;
     newGoal.completionDates = [];
   }
   ```

3. **Goal Counter Decrement**
   ```javascript
   // Decrement counters for non-skipped goals
   if (!oldGoal.skipped) {
     newGoal.weeksRemaining = Math.max(0, template.weeksRemaining - 1);
   } else {
     // Skipped week - don't decrement
     newGoal.weeksRemaining = template.weeksRemaining;
   }
   ```

### Priority 3: Testing

1. **Manual Rollover Button** (for testing)
   - Add admin button: "Force Week Rollover"
   - Test the flow without waiting for Monday

2. **Test Scenarios**
   - User completes all goals → Archive shows 100%
   - User skips a goal → Reappears next week
   - User misses 2 weeks → Catch-up logic works
   - Monthly goal carries forward within month
   - Monthly goal resets on month boundary

---

## 📝 Implementation Checklist

### Phase 1: Basic Rollover
- [ ] Create `useWeekRollover` hook (client-side check on login)
- [ ] Add week change detection logic
- [ ] Call `archiveWeek` API when week changes
- [ ] Test with manual date change (mock current week)
- [ ] Verify pastWeeks populates correctly

### Phase 2: Advanced Features
- [ ] Implement catch-up logic for missed weeks
- [ ] Handle monthly goal persistence
- [ ] Decrement week/month counters correctly
- [ ] Preserve skipped goal state (don't decrement)

### Phase 3: Server-Side Timer (Production)
- [ ] Create `api/weeklyRollover/index.js`
- [ ] Set timer trigger: `0 0 * * 1` (Monday 00:00)
- [ ] Test in local Azure Functions environment
- [ ] Deploy to production
- [ ] Monitor logs for first rollover

### Phase 4: UI Enhancements
- [ ] Show "Week rolled over" notification on login
- [ ] Add manual rollover button for admins
- [ ] Display "weeks remaining" counter on goals
- [ ] Show when goal will end (countdown)

---

## 🎯 Summary

### What Works
✅ Container architecture is solid  
✅ API endpoints exist and work  
✅ Auto-instantiation creates goals  
✅ Past weeks display works  

### What's Missing
❌ No automatic week rollover  
❌ No week change detection  
❌ No counter decrements  
❌ No catch-up logic  

### What Needs to Happen
1. **Implement `useWeekRollover` hook** (2-3 hours)
   - Check week on login
   - Archive old week
   - Let auto-instantiation create new week

2. **Add catch-up and edge case logic** (1-2 hours)
   - Handle missed weeks
   - Monthly goal persistence
   - Counter decrements

3. **Create server-side timer** (1 hour)
   - Azure Function timer trigger
   - Runs Monday 00:00 UTC
   - Production-ready solution

**Total Estimated Time**: 4-6 hours

---

**Status**: Ready for implementation  
**Next Step**: Create `useWeekRollover` hook  
**Priority**: HIGH - Without this, the week system doesn't work properly

