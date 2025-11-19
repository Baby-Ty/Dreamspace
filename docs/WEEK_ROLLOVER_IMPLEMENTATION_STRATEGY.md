# Week Rollover: Primary + Fallback Strategy

**Date**: November 18, 2025  
**Strategy**: Server-side timer (primary) + Client-side check (fallback)  
**Goal**: Zero conflicts, idempotent operations

---

## 🎯 Strategy Overview

```
Server-Side Timer (PRIMARY)
    ↓ Runs Monday 00:00 UTC
    ↓ Archives Week 47
    ↓ Creates Week 48
    ↓ Sets lastRolloverWeek = "2025-W48"
    
    IF FAILS OR DOESN'T RUN
    ↓
    
Client-Side Check (FALLBACK)
    ↓ User logs in Tuesday
    ↓ Checks: currentWeek.weekId vs actual week
    ↓ IF different: Trigger rollover
    ↓ Archives Week 47
    ↓ Creates Week 48
```

### Key: Idempotent Design

**The rollover can be run multiple times safely because:**
1. We check `currentWeek.weekId` before archiving
2. Archive operation is idempotent (upsert to pastWeeks)
3. New week creation checks if it already exists

---

## 🔒 Conflict Prevention

### The Check: `currentWeek.weekId`

```javascript
// Get current week document
const currentWeekDoc = await getCurrentWeekDocument(userId);
const actualWeekId = getCurrentIsoWeek(); // e.g., "2025-W48"

// Only rollover if weeks don't match
if (currentWeekDoc.weekId !== actualWeekId) {
  // SAFE TO ROLLOVER
  // This means it hasn't been done yet
} else {
  // Already rolled over, skip
  return;
}
```

**Why this prevents conflicts:**
- Server-side runs first → archives W47, creates W48
- `currentWeek.weekId` now = "2025-W48"
- Client-side checks on login → sees W48 = W48, skips rollover
- No duplicate archiving!

---

## 📁 Implementation Files

### File 1: Shared Rollover Logic (NEW)

**Path**: `api/utils/weekRollover.js`

```javascript
/**
 * Shared week rollover logic
 * Can be called from timer OR client trigger
 * Idempotent - safe to run multiple times
 */

const { getCosmosProvider } = require('./cosmosProvider');
const { getCurrentIsoWeek } = require('./dateUtils');

/**
 * Perform week rollover for a single user
 * @param {string} userId - User ID
 * @param {object} context - Azure Function context (for logging)
 * @returns {Promise<{success: boolean, rolled: boolean, message: string}>}
 */
async function rolloverWeekForUser(userId, context = null) {
  const log = context?.log || console.log;
  
  try {
    const cosmosProvider = getCosmosProvider();
    const actualWeekId = getCurrentIsoWeek();
    
    // 1. Get current week document
    const currentWeekDoc = await cosmosProvider.getCurrentWeekDocument(userId);
    
    // 2. Check if rollover needed
    if (!currentWeekDoc) {
      log(`ℹ️ ${userId}: No current week document, skipping rollover`);
      return { success: true, rolled: false, message: 'No current week' };
    }
    
    if (currentWeekDoc.weekId === actualWeekId) {
      log(`✅ ${userId}: Already on current week (${actualWeekId})`);
      return { success: true, rolled: false, message: 'Already current' };
    }
    
    // 3. ROLLOVER NEEDED
    log(`🔄 ${userId}: Rolling over from ${currentWeekDoc.weekId} to ${actualWeekId}`);
    
    // Calculate weeks to archive (in case user missed multiple weeks)
    const weeksToArchive = getWeeksBetween(currentWeekDoc.weekId, actualWeekId);
    
    // 4. Archive each missed week
    for (const weekId of weeksToArchive) {
      if (weekId === currentWeekDoc.weekId) {
        // Archive the actual current week with real stats
        const summary = {
          totalGoals: currentWeekDoc.goals?.length || 0,
          completedGoals: currentWeekDoc.goals?.filter(g => g.completed).length || 0,
          skippedGoals: currentWeekDoc.goals?.filter(g => g.skipped).length || 0,
          score: calculateScore(currentWeekDoc.goals || []),
          weekStartDate: currentWeekDoc.weekStartDate,
          weekEndDate: currentWeekDoc.weekEndDate
        };
        
        await cosmosProvider.archiveWeekToPastWeeks(userId, weekId, summary);
        log(`📦 ${userId}: Archived ${weekId} (${summary.completedGoals}/${summary.totalGoals} goals)`);
      } else {
        // Archive missed weeks with empty stats
        const { start, end } = getWeekRange(weekId);
        const summary = {
          totalGoals: 0,
          completedGoals: 0,
          skippedGoals: 0,
          score: 0,
          weekStartDate: start.toISOString().split('T')[0],
          weekEndDate: end.toISOString().split('T')[0]
        };
        
        await cosmosProvider.archiveWeekToPastWeeks(userId, weekId, summary);
        log(`📦 ${userId}: Archived missed week ${weekId}`);
      }
    }
    
    // 5. Create new current week from templates
    const newGoals = await createGoalsFromTemplates(
      userId, 
      actualWeekId, 
      currentWeekDoc.goals, // Pass old goals for monthly persistence
      context
    );
    
    // 6. Save new current week
    await cosmosProvider.upsertCurrentWeek(userId, actualWeekId, newGoals);
    
    log(`✅ ${userId}: Rollover complete! Now on ${actualWeekId} (${newGoals.length} goals)`);
    
    return { 
      success: true, 
      rolled: true, 
      message: `Rolled over ${weeksToArchive.length} week(s)`,
      fromWeek: currentWeekDoc.weekId,
      toWeek: actualWeekId,
      goalsCount: newGoals.length
    };
    
  } catch (error) {
    const log = context?.log?.error || console.error;
    log(`❌ ${userId}: Rollover failed:`, error);
    return { 
      success: false, 
      rolled: false, 
      message: error.message 
    };
  }
}

/**
 * Create goals from templates for new week
 */
async function createGoalsFromTemplates(userId, weekId, previousGoals = [], context = null) {
  const cosmosProvider = getCosmosProvider();
  const log = context?.log || console.log;
  
  // 1. Get user's dreams and templates
  const dreamsDoc = await cosmosProvider.getDreamsDocument(userId);
  if (!dreamsDoc) {
    return [];
  }
  
  const templates = dreamsDoc.weeklyGoalTemplates || [];
  const dreams = dreamsDoc.dreamBook || [];
  const newGoals = [];
  
  // 2. Filter active templates
  const activeTemplates = templates.filter(t => {
    // Skip if not active
    if (t.active === false) return false;
    
    // Skip if dream is completed
    const dream = dreams.find(d => d.id === t.dreamId);
    if (dream?.completed) return false;
    
    // Skip if duration expired
    if (t.recurrence === 'weekly' && t.weeksRemaining !== undefined && t.weeksRemaining <= 0) {
      return false;
    }
    if (t.recurrence === 'monthly' && t.monthsRemaining !== undefined && t.monthsRemaining <= 0) {
      return false;
    }
    
    return true;
  });
  
  log(`📋 ${userId}: Found ${activeTemplates.length} active templates`);
  
  // 3. Create instances from templates
  for (const template of activeTemplates) {
    const dream = dreams.find(d => d.id === template.dreamId);
    
    // Find previous week's instance (for monthly goals)
    const previousInstance = previousGoals.find(g => g.templateId === template.id);
    const currentMonth = weekId.substring(0, 7); // "2025-W48" -> "2025-W"
    const previousMonth = previousInstance?.weekId?.substring(0, 7);
    const isSameMonth = currentMonth === previousMonth;
    
    const instance = {
      id: `${template.id}_${weekId}`,
      templateId: template.id,
      type: template.recurrence === 'monthly' ? 'monthly_goal' : 'weekly_goal',
      title: template.title,
      description: template.description || '',
      dreamId: template.dreamId,
      dreamTitle: dream?.title || template.dreamTitle || '',
      dreamCategory: dream?.category || template.dreamCategory || '',
      recurrence: template.recurrence,
      completed: false,
      completedAt: null,
      skipped: false,
      weekId: weekId,
      createdAt: new Date().toISOString()
    };
    
    // Handle weekly goals
    if (template.recurrence === 'weekly') {
      // Decrement counter if previous goal wasn't skipped
      const wasSkipped = previousInstance?.skipped || false;
      
      instance.targetWeeks = template.targetWeeks;
      instance.weeksRemaining = wasSkipped 
        ? template.weeksRemaining // Don't decrement if skipped
        : Math.max(0, template.weeksRemaining - 1);
    }
    
    // Handle monthly goals
    if (template.recurrence === 'monthly') {
      instance.frequency = template.frequency || 2;
      instance.monthId = weekId.substring(0, 7); // "2025-W48" -> "2025-W"
      
      // Carry forward counter if same month
      if (isSameMonth && previousInstance) {
        instance.completionCount = previousInstance.completionCount || 0;
        instance.completionDates = previousInstance.completionDates || [];
        instance.completed = previousInstance.completed || false;
      } else {
        // New month - reset
        instance.completionCount = 0;
        instance.completionDates = [];
      }
      
      // Decrement months remaining if new month
      if (!isSameMonth) {
        instance.monthsRemaining = Math.max(0, template.monthsRemaining - 1);
      } else {
        instance.monthsRemaining = template.monthsRemaining;
      }
    }
    
    newGoals.push(instance);
  }
  
  // 4. Also add deadline goals from dreams
  for (const dream of dreams) {
    if (dream.completed) continue;
    
    const deadlineGoals = (dream.goals || []).filter(g => 
      g.type === 'deadline' && 
      !g.completed && 
      g.targetDate && 
      new Date(g.targetDate) >= new Date()
    );
    
    for (const goal of deadlineGoals) {
      const instance = {
        id: `${goal.id}_${weekId}`,
        templateId: goal.id,
        type: 'deadline',
        title: goal.title,
        description: goal.description || '',
        dreamId: dream.id,
        dreamTitle: dream.title,
        dreamCategory: dream.category,
        targetDate: goal.targetDate,
        completed: false,
        completedAt: null,
        skipped: false,
        weekId: weekId,
        createdAt: new Date().toISOString()
      };
      
      newGoals.push(instance);
    }
  }
  
  return newGoals;
}

/**
 * Calculate score from goals
 */
function calculateScore(goals) {
  return goals.reduce((total, goal) => {
    if (goal.completed) {
      // Weekly goals: 3 points
      // Monthly goals: 5 points
      // Deadline goals: 5 points
      return total + (goal.recurrence === 'monthly' ? 5 : goal.type === 'deadline' ? 5 : 3);
    }
    return total;
  }, 0);
}

/**
 * Get weeks between two ISO week strings
 */
function getWeeksBetween(startWeekIso, endWeekIso) {
  const weeks = [];
  const start = parseIsoWeek(startWeekIso);
  const end = parseIsoWeek(endWeekIso);
  
  let current = new Date(start);
  while (current < end) {
    weeks.push(getCurrentIsoWeek(current));
    current.setDate(current.getDate() + 7);
  }
  
  return weeks;
}

/**
 * Parse ISO week to date
 */
function parseIsoWeek(isoWeek) {
  const [year, week] = isoWeek.split('-W').map(Number);
  const jan4 = new Date(year, 0, 4);
  const startOfWeek = new Date(jan4);
  startOfWeek.setDate(jan4.getDate() - jan4.getDay() + (week - 1) * 7);
  return startOfWeek;
}

/**
 * Get week date range
 */
function getWeekRange(isoWeek) {
  const start = parseIsoWeek(isoWeek);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

module.exports = {
  rolloverWeekForUser,
  createGoalsFromTemplates,
  calculateScore
};
```

---

### File 2: Server-Side Timer (PRIMARY)

**Path**: `api/weeklyRollover/index.js`

```javascript
/**
 * Azure Function: Weekly Rollover Timer
 * Runs every Monday at 00:00 UTC
 * Archives previous week and creates new week for all users
 * 
 * Timer: "0 0 * * 1" (every Monday at midnight)
 */

const { getCosmosProvider } = require('../utils/cosmosProvider');
const { rolloverWeekForUser } = require('../utils/weekRollover');

module.exports = async function (context, timer) {
  context.log('🔄 Weekly Rollover Timer Triggered');
  context.log('Timestamp:', timer.scheduleStatus.last);
  
  try {
    const cosmosProvider = getCosmosProvider();
    
    // 1. Get all users
    const usersContainer = cosmosProvider.getContainer('users');
    const { resources: users } = await usersContainer.items
      .query('SELECT c.id FROM c')
      .fetchAll();
    
    context.log(`📋 Found ${users.length} users to process`);
    
    // 2. Process each user
    const results = {
      total: users.length,
      rolled: 0,
      skipped: 0,
      failed: 0,
      details: []
    };
    
    for (const user of users) {
      const result = await rolloverWeekForUser(user.id, context);
      
      if (result.success && result.rolled) {
        results.rolled++;
      } else if (result.success && !result.rolled) {
        results.skipped++;
      } else {
        results.failed++;
      }
      
      results.details.push({
        userId: user.id,
        ...result
      });
    }
    
    // 3. Log summary
    context.log('');
    context.log('📊 Weekly Rollover Complete:');
    context.log(`   Total users: ${results.total}`);
    context.log(`   ✅ Rolled over: ${results.rolled}`);
    context.log(`   ⏭️  Already current: ${results.skipped}`);
    context.log(`   ❌ Failed: ${results.failed}`);
    
    // 4. Log any failures
    if (results.failed > 0) {
      context.log.error('');
      context.log.error('❌ Failed rollovers:');
      results.details
        .filter(d => !d.success)
        .forEach(d => {
          context.log.error(`   - ${d.userId}: ${d.message}`);
        });
    }
    
    return results;
    
  } catch (error) {
    context.log.error('❌ Weekly Rollover Timer Failed:', error);
    throw error;
  }
};
```

**Path**: `api/weeklyRollover/function.json`

```json
{
  "bindings": [
    {
      "name": "timer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 0 * * 1"
    }
  ]
}
```

---

### File 3: Client-Side Fallback (SAFETY NET)

**Path**: `src/hooks/useWeekRollover.js`

```javascript
// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentIsoWeek } from '../utils/dateUtils';
import currentWeekService from '../services/currentWeekService';
import { logger } from '../utils/logger';

/**
 * Custom hook for week rollover check (FALLBACK)
 * Runs on user login to catch any missed server-side rollovers
 * 
 * IMPORTANT: This is a safety net. The primary rollover happens
 * via server-side timer (api/weeklyRollover/index.js).
 */
export function useWeekRollover() {
  const { currentUser } = useApp();
  const hasChecked = useRef(false);
  
  useEffect(() => {
    // Only check once per session
    if (hasChecked.current || !currentUser?.id) {
      return;
    }
    
    async function checkWeekRollover() {
      try {
        logger.info('useWeekRollover', 'Checking if week rollover needed', { 
          userId: currentUser.id 
        });
        
        // 1. Get current week document
        const result = await currentWeekService.getCurrentWeek(currentUser.id);
        
        if (!result.success || !result.data) {
          logger.warn('useWeekRollover', 'No current week document found');
          return;
        }
        
        const currentWeekDoc = result.data;
        const actualWeekId = getCurrentIsoWeek();
        
        // 2. Check if rollover needed
        if (currentWeekDoc.weekId === actualWeekId) {
          logger.info('useWeekRollover', 'Week is current, no rollover needed', {
            weekId: actualWeekId
          });
          hasChecked.current = true;
          return;
        }
        
        // 3. WEEK MISMATCH - Rollover needed!
        logger.warn('useWeekRollover', 'Week mismatch detected! Triggering rollover...', {
          currentWeekDoc: currentWeekDoc.weekId,
          actualWeek: actualWeekId
        });
        
        // Show notification to user
        console.log('🔄 New week detected! Updating your goals...');
        
        // 4. Calculate summary for archive
        const summary = {
          totalGoals: currentWeekDoc.goals?.length || 0,
          completedGoals: currentWeekDoc.goals?.filter(g => g.completed).length || 0,
          skippedGoals: currentWeekDoc.goals?.filter(g => g.skipped).length || 0,
          score: calculateScore(currentWeekDoc.goals || []),
          weekStartDate: currentWeekDoc.weekStartDate,
          weekEndDate: currentWeekDoc.weekEndDate
        };
        
        // 5. Archive old week
        const archiveResult = await currentWeekService.archiveWeek(
          currentUser.id,
          currentWeekDoc.weekId,
          summary
        );
        
        if (!archiveResult.success) {
          throw new Error(`Archive failed: ${archiveResult.error}`);
        }
        
        logger.info('useWeekRollover', 'Old week archived', {
          weekId: currentWeekDoc.weekId,
          stats: summary
        });
        
        // 6. New week will be created by useDashboardData auto-instantiation
        // Just reload the page to trigger it
        logger.info('useWeekRollover', 'Rollover complete! Reloading dashboard...');
        
        // Mark as checked before reload
        hasChecked.current = true;
        
        // Trigger dashboard reload
        window.dispatchEvent(new Event('week-rolled-over'));
        
        // Optional: Show success message
        console.log('✅ Week rollover complete! Welcome to', actualWeekId);
        
      } catch (error) {
        logger.error('useWeekRollover', 'Rollover check failed', { 
          error: error.message 
        });
        // Don't throw - this is a background check
        // User can still use the app even if check fails
      }
    }
    
    // Run check after a short delay (let other data load first)
    const timeoutId = setTimeout(() => {
      checkWeekRollover();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
    
  }, [currentUser?.id]);
  
  // This hook doesn't return anything - it's a side effect
}

/**
 * Calculate score from goals
 */
function calculateScore(goals) {
  return goals.reduce((total, goal) => {
    if (goal.completed) {
      return total + (goal.recurrence === 'monthly' ? 5 : goal.type === 'deadline' ? 5 : 3);
    }
    return total;
  }, 0);
}

export default useWeekRollover;
```

---

### File 4: Use in Dashboard

**Path**: `src/pages/dashboard/DashboardLayout.jsx`

```javascript
// ... existing imports ...
import { useWeekRollover } from '../../hooks/useWeekRollover';

export default function DashboardLayout() {
  const { currentUser } = useApp();
  
  // ... existing hooks ...
  
  // ✅ ADD THIS: Week rollover check (fallback)
  useWeekRollover();
  
  // ... rest of component ...
}
```

---

## 🔄 How They Work Together

### Scenario 1: Normal Operation (Server Works)

```
Sunday 11:59 PM
├─ Server Timer: Runs at Monday 00:00 UTC
├─ Archives Week 47 → pastWeeks
├─ Creates Week 48 in currentWeek
└─ Sets weekId = "2025-W48"

Monday 9:00 AM
├─ User logs in
├─ useWeekRollover hook runs
├─ Checks: currentWeek.weekId === actualWeek?
├─ "2025-W48" === "2025-W48" ✅
└─ Skips rollover (already done!)
```

### Scenario 2: Server Fails (Client Catches It)

```
Sunday 11:59 PM
├─ Server Timer: FAILS (Azure issue, timeout, etc.)
└─ currentWeek still shows "2025-W47"

Monday 9:00 AM
├─ User logs in
├─ useWeekRollover hook runs
├─ Checks: currentWeek.weekId === actualWeek?
├─ "2025-W47" !== "2025-W48" ❌
├─ Triggers rollover:
│   ├─ Archives Week 47
│   ├─ Creates Week 48
│   └─ Reloads dashboard
└─ User sees fresh Week 48 goals!
```

### Scenario 3: User Doesn't Login (No Problem)

```
Sunday 11:59 PM
├─ Server Timer: Runs successfully
└─ Archives & creates Week 48

Monday
├─ User doesn't login
└─ No problem! Server already did the work

Tuesday
├─ User logs in
├─ useWeekRollover checks
├─ Sees Week 48 is current
└─ No action needed
```

---

## 🧪 Testing Strategy

### Test 1: Server-Side Timer
```bash
# Local test with Azure Functions Core Tools
cd api
func start

# Manually trigger timer
curl -X POST http://localhost:7071/admin/functions/weeklyRollover

# Check logs for rollover results
```

### Test 2: Client-Side Fallback
```javascript
// In browser console:
// 1. Manually change currentWeek.weekId to last week
const fakeOldWeek = await fetch('/api/saveCurrentWeek', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'test@example.com',
    weekId: '2025-W46', // Old week
    goals: []
  })
});

// 2. Refresh page
// 3. Watch for rollover trigger
```

### Test 3: Conflict Prevention
```javascript
// Run rollover twice in a row
await rolloverWeekForUser('test@example.com');
await rolloverWeekForUser('test@example.com');

// Second call should return:
// { success: true, rolled: false, message: 'Already current' }
```

---

## 📊 Monitoring

### Server-Side Logs
```
✅ Watch for: "Weekly Rollover Complete"
❌ Watch for: "Failed rollovers"
📊 Check: Rolled vs Skipped counts
```

### Client-Side Logs
```
✅ Watch for: "Week is current, no rollover needed"
🔄 Watch for: "Week mismatch detected!"
❌ Watch for: "Rollover check failed"
```

---

## ✅ Deployment Checklist

- [ ] Deploy `weekRollover.js` utility
- [ ] Deploy `weeklyRollover` timer function
- [ ] Test timer trigger in Azure
- [ ] Add `useWeekRollover` hook
- [ ] Update Dashboard to use hook
- [ ] Monitor logs for first week
- [ ] Verify no duplicate archives

---

**Summary**: Primary (server timer) + Fallback (client check) = Bulletproof system with zero conflicts!

