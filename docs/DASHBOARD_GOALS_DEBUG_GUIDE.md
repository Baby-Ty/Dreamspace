# Dashboard Goals Not Showing - Debugging Guide

**Issue**: Goals from dreams are not appearing on the Dashboard  
**Date**: November 18, 2025

---

## 🔍 Step 1: Check Browser Console

I've added extensive logging to help diagnose the issue. Open your browser DevTools (F12) and navigate to the Dashboard. You should see:

### Expected Console Output

```
📅 Dashboard: Loading current week goals for 2025-W47
✅ Dashboard: Loaded X goals for current week
🔍 Dashboard: Checking dreams for goals...
   Dreams count: 3
   Dream: "Get Fit" has 1 goals
      - "Run 5km 3x per week" (type: consistency, recurrence: weekly, active: true, completed: false)
   Dream: "Learn Spanish" has 1 goals
      - "Complete Duolingo lesson" (type: consistency, recurrence: daily, active: true, completed: false)
   ...
📋 Dashboard: Found 2 goals from dreams to instantiate
✨ Auto-creating consistency goal instance from dream: Run 5km 3x per week
✨ Auto-creating consistency goal instance from dream: Complete Duolingo lesson
✅ Created 2 new goal instances for current week
```

### What to Look For

#### Scenario 1: No Dreams Found
```
🔍 Dashboard: Checking dreams for goals...
   Dreams count: 0
```

**Problem**: User has no dreams  
**Solution**: Create a dream first (go to Dream Book page)

#### Scenario 2: Dreams Have No Goals
```
🔍 Dashboard: Checking dreams for goals...
   Dreams count: 3
   Dream: "Get Fit" has 0 goals
   Dream: "Learn Spanish" has 0 goals
```

**Problem**: Dreams exist but have no goals  
**Solution**: Add goals to your dreams

#### Scenario 3: Goals Are Wrong Type
```
   Dream: "Get Fit" has 1 goals
      - "Run marathon" (type: undefined, recurrence: undefined, active: undefined, completed: false)
   ❌ Skipping goal: "Run marathon" (type: undefined, recurrence: undefined)
```

**Problem**: Goals don't have required fields (type, recurrence)  
**Solution**: See "How to Fix Goals" section below

#### Scenario 4: Goals Are Completed
```
   Dream: "Get Fit" has 1 goals
      - "Run 5km" (type: consistency, recurrence: weekly, active: true, completed: true)
   ⏭️  Skipping completed goal: "Run 5km"
```

**Problem**: Goal is marked as completed  
**Solution**: Either create a new goal or un-complete the goal

#### Scenario 5: Goals Missing Recurrence
```
   Dream: "Get Fit" has 1 goals
      - "Run 5km" (type: consistency, recurrence: undefined, active: true, completed: false)
   ❌ Skipping goal: "Run 5km" (type: consistency, recurrence: undefined)
```

**Problem**: Consistency goal is missing `recurrence` field  
**Solution**: Goal needs `recurrence: 'weekly'` or `recurrence: 'monthly'`

---

## 🔧 Step 2: Check Database (Cosmos DB)

### Check Dreams Container

Look at your user's document in the `dreams` container:

```json
{
  "id": "user@example.com",
  "userId": "user@example.com",
  "dreamBook": [
    {
      "id": "dream_123",
      "title": "Get Fit",
      "category": "Health",
      "goals": [
        {
          "id": "goal_456",
          "title": "Run 5km 3x per week",
          "type": "consistency",           // ← Must be present
          "recurrence": "weekly",          // ← Must be present
          "active": true,                  // ← Must be true or undefined
          "completed": false,              // ← Must be false
          "targetWeeks": 12,
          "startDate": "2025-11-18T...",
          "createdAt": "2025-11-18T..."
        }
      ]
    }
  ]
}
```

### Required Fields for Goals to Appear

**For Consistency Goals** (most common):
- `type`: `"consistency"`
- `recurrence`: `"weekly"` or `"monthly"`
- `active`: `true` (or undefined/missing - defaults to true)
- `completed`: `false` (or undefined/missing)

**For Deadline Goals**:
- `type`: `"deadline"`
- `targetDate`: A future date (e.g., `"2025-12-31"`)
- `completed`: `false`

---

## 🛠️ Step 3: How to Fix Goals

### Option A: Fix in Database Directly

If you have existing goals that are missing fields, update them in Cosmos DB:

```json
{
  "goals": [
    {
      "id": "goal_456",
      "title": "Run 5km",
      // ADD THESE FIELDS:
      "type": "consistency",
      "recurrence": "weekly",
      "targetWeeks": 12,
      "startDate": "2025-11-18T00:00:00.000Z",
      "active": true,
      "completed": false
    }
  ]
}
```

### Option B: Create New Goals via UI

1. Go to **Dream Book** page
2. Click on a dream to open Dream Tracker modal
3. Go to **Goals** tab
4. Click **"+ Add Goal"**
5. Fill in:
   - **Title**: e.g., "Run 5km 3x per week"
   - **Type**: Select "Consistency"
   - **Recurrence**: Select "Weekly" or "Monthly"
   - **Duration**: e.g., 12 weeks
6. Click **Save**

This will create the goal with all required fields.

### Option C: Create Goals When Creating Dream

1. Go to **Dream Book** page
2. Click **"+ Create Dream"**
3. Fill in dream details
4. **Enable "Add first goal"** checkbox
5. Enter goal title
6. Select consistency (weekly/monthly)
7. Set target (weeks/months)
8. Click **Create Dream**

This will:
- Create the dream
- Create the goal with proper fields
- Add goal to current week automatically

---

## 🧪 Step 4: Test with Sample Data

### Create a Test Dream with Goal

Use browser console to create a test dream:

```javascript
// Open browser console (F12)
// Paste this code (replace user@example.com with your userId):

const testDream = {
  id: `dream_test_${Date.now()}`,
  title: "Test Dream",
  category: "Health",
  description: "This is a test",
  progress: 0,
  image: "",
  goals: [
    {
      id: `goal_test_${Date.now()}`,
      title: "Test Goal - Run 5km",
      type: "consistency",
      recurrence: "weekly",
      targetWeeks: 12,
      startDate: new Date().toISOString(),
      active: true,
      completed: false,
      createdAt: new Date().toISOString()
    }
  ],
  notes: [],
  history: [],
  createdAt: new Date().toISOString()
};

// Save to dreams container via API
fetch('/api/saveDreams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user@example.com',  // ← CHANGE THIS
    dreams: [testDream],
    templates: []
  })
}).then(r => r.json()).then(console.log);

// Refresh page after save completes
```

After refresh, check Dashboard - you should see "Test Goal - Run 5km" appear.

---

## 📊 Step 5: Verify Current Week Container

Check the `currentWeek` container for your user:

```json
{
  "id": "user@example.com",
  "userId": "user@example.com",
  "weekId": "2025-W47",
  "goals": [
    {
      "id": "goal_456_2025-W47",      // ← Goal ID + week ID
      "templateId": "goal_456",        // ← References dream goal
      "type": "weekly_goal",
      "title": "Run 5km 3x per week",
      "dreamId": "dream_123",
      "dreamTitle": "Get Fit",
      "dreamCategory": "Health",
      "recurrence": "weekly",
      "completed": false,
      "weekId": "2025-W47"
    }
  ]
}
```

### If currentWeek is Empty

This means goals weren't auto-instantiated. Check:
1. Dreams have goals with correct fields
2. Console shows "Auto-creating" messages
3. Save operation succeeded (no errors in console)

---

## 🐛 Common Issues

### Issue 1: "Cannot read property 'filter' of undefined"

**Cause**: `dream.goals` is undefined (not an array)

**Fix**: Ensure dreams have `goals: []` property:
```json
{
  "id": "dream_123",
  "title": "Get Fit",
  "goals": []  // ← Must be an array, not undefined
}
```

### Issue 2: Goals appear in Dream Tracker but not Dashboard

**Cause**: Goals have correct fields but aren't being instantiated

**Debug steps**:
1. Check console for "Found X goals from dreams to instantiate"
2. Check for "Auto-creating consistency goal instance from dream"
3. Check for save errors

**Fix**: Look for errors in `currentWeekService.saveCurrentWeek` call

### Issue 3: Some goals appear, others don't

**Cause**: Mixed goal formats - some have required fields, others don't

**Fix**: Audit all goals in all dreams for required fields:
```javascript
// Run in console:
const dreams = /* your dreamBook array */;
dreams.forEach(dream => {
  console.log(`Dream: ${dream.title}`);
  dream.goals?.forEach(goal => {
    const valid = goal.type && 
                  ((goal.type === 'consistency' && goal.recurrence) ||
                   (goal.type === 'deadline' && goal.targetDate));
    console.log(`  ${valid ? '✅' : '❌'} ${goal.title}`, {
      type: goal.type,
      recurrence: goal.recurrence,
      targetDate: goal.targetDate
    });
  });
});
```

---

## ✅ Success Checklist

After fixing, you should see:

- [ ] Console shows "Found X goals from dreams to instantiate" (X > 0)
- [ ] Console shows "Auto-creating" messages for each goal
- [ ] Console shows "Created X new goal instances for current week"
- [ ] Dashboard displays goals under "This Week's Goals"
- [ ] Goals can be toggled (completed/incomplete)
- [ ] Goals persist after page refresh

---

## 📞 Still Not Working?

If goals still aren't showing after following this guide:

1. **Share console output** - Copy the full console log from Dashboard load
2. **Share dream structure** - Export your dreams document from Cosmos DB
3. **Share current week** - Export your currentWeek document from Cosmos DB

This will help diagnose the exact issue!

---

**Created**: November 18, 2025  
**Last Updated**: November 18, 2025  
**Related Files**: `src/hooks/useDashboardData.js` (lines 117-258)

