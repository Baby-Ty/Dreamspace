# Past Weeks Modal Not Showing - Debugging Guide

**Issue**: Past weeks aren't appearing in the Past Weeks modal  
**Date**: November 18, 2025

---

## 🔍 Step 1: Check Browser Console

I've added extensive logging. Open your browser DevTools (F12) and:

1. Navigate to Dashboard
2. Click "View Past Weeks" button
3. Open Console tab
4. Look for these messages:

### Expected Console Output

**When Modal Opens**:
```
📊 PastWeeksModal opened: {
  isLoading: false,
  weeksCount: 3,
  weeks: [
    { weekId: "2025-W47", weekStartDate: "2025-11-17", totalGoals: 5, completedGoals: 3, score: 60 },
    { weekId: "2025-W46", weekStartDate: "2025-11-10", totalGoals: 6, completedGoals: 4, score: 67 },
    ...
  ]
}
```

**When Data Loads**:
```
📊 weekHistoryService.getRecentWeeks: {
  weekHistoryKeys: ["2025-W47", "2025-W46"],
  weekHistoryCount: 2,
  sampleEntry: ["2025-W47", { totalGoals: 5, completedGoals: 3, ... }]
}
   Week 2025-W47: { weekId: "2025-W47", totalGoals: 5, completedGoals: 3, score: 9, ... }
   Week 2025-W46: { weekId: "2025-W46", totalGoals: 6, completedGoals: 4, score: 12, ... }
✅ Returning 2 recent weeks

📊 usePastWeeks: Raw data from API: {
  dataLength: 2,
  sample: { weekId: "2025-W47", totalGoals: 5, ... },
  allWeeks: [...]
}
   Week 2025-W47: { totalGoals: 5, completedGoals: 3, score: 60, weekStartDate: "2025-11-17" }
✅ usePastWeeks: Transformed weeks: { count: 2, weeks: [...] }
```

### What to Look For

#### Scenario 1: No Data in pastWeeks Container
```
📊 weekHistoryService.getRecentWeeks: {
  weekHistoryKeys: [],
  weekHistoryCount: 0
}
✅ Returning 0 recent weeks

📊 usePastWeeks: Raw data from API: {
  dataLength: 0,
  allWeeks: []
}
✅ usePastWeeks: Transformed weeks: { count: 0, weeks: [] }

📊 PastWeeksModal opened: {
  weeksCount: 0,
  weeks: []
}
```

**Problem**: No weeks have been archived yet  
**Solution**: Complete a week and let it rollover, OR manually archive a week (see below)

#### Scenario 2: API Error
```
❌ usePastWeeks: Failed to fetch past weeks { error: "..." }
```

**Problem**: API call failed  
**Solution**: Check network tab for API errors, verify API endpoint is working

#### Scenario 3: Data Format Issue
```
📊 PastWeeksModal opened: {
  weeksCount: 0,
  weeks: [],
  weeksType: "object"  // ← Should be "array"
}
```

**Problem**: Data not in expected format  
**Solution**: Check API response structure

---

## 🛠️ Step 2: Check Database (Cosmos DB)

### Check pastWeeks Container

Look at your user's document in the `pastWeeks` container:

```json
{
  "id": "user@example.com",
  "userId": "user@example.com",
  "weekHistory": {
    "2025-W47": {
      "totalGoals": 5,
      "completedGoals": 3,
      "skippedGoals": 0,
      "score": 9,
      "weekStartDate": "2025-11-17",
      "weekEndDate": "2025-11-23",
      "archivedAt": "2025-11-18T00:00:00Z"
    },
    "2025-W46": {
      "totalGoals": 6,
      "completedGoals": 4,
      "skippedGoals": 0,
      "score": 12,
      "weekStartDate": "2025-11-10",
      "weekEndDate": "2025-11-16",
      "archivedAt": "2025-11-17T00:00:00Z"
    }
  },
  "totalWeeksTracked": 2,
  "updatedAt": "2025-11-18T..."
}
```

### Required Fields

Each week entry needs:
- `totalGoals`: Number (can be 0)
- `completedGoals`: Number (can be 0)
- `score`: Number (points earned, will be converted to percentage)
- `weekStartDate`: String (ISO date format: "YYYY-MM-DD")
- `weekEndDate`: String (optional, but helpful)

---

## 🧪 Step 3: Test with Manual Archive

If you don't have any archived weeks yet, you can manually archive the current week:

### Option A: Use Browser Console

```javascript
// Open browser console (F12)
// Replace with your userId and current weekId

const userId = 'user@example.com';  // ← CHANGE THIS
const weekId = '2025-W47';          // ← CHANGE THIS (current week)

// Get current week data first
const currentWeekResult = await fetch(`/api/getCurrentWeek/${userId}`);
const currentWeek = await currentWeekResult.json();

if (currentWeek.success && currentWeek.data) {
  const goals = currentWeek.data.goals || [];
  
  const summary = {
    totalGoals: goals.length,
    completedGoals: goals.filter(g => g.completed).length,
    skippedGoals: goals.filter(g => g.skipped).length,
    score: goals.reduce((sum, g) => {
      if (g.completed) {
        return sum + (g.recurrence === 'monthly' ? 5 : g.type === 'deadline' ? 5 : 3);
      }
      return sum;
    }, 0),
    weekStartDate: currentWeek.data.weekStartDate || '2025-11-17',
    weekEndDate: currentWeek.data.weekEndDate || '2025-11-23'
  };
  
  console.log('Archiving week:', summary);
  
  // Archive it
  const archiveResult = await fetch('/api/archiveWeek', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      weekId,
      weekSummary: summary
    })
  });
  
  const result = await archiveResult.json();
  console.log('Archive result:', result);
  
  // Refresh page
  window.location.reload();
}
```

### Option B: Use Azure Portal

1. Go to Azure Portal → Cosmos DB
2. Open `pastWeeks` container
3. Find your user document (id = userId)
4. Edit document
5. Add week entry to `weekHistory`:

```json
{
  "weekHistory": {
    "2025-W47": {
      "totalGoals": 5,
      "completedGoals": 3,
      "skippedGoals": 0,
      "score": 9,
      "weekStartDate": "2025-11-17",
      "weekEndDate": "2025-11-23",
      "archivedAt": "2025-11-18T00:00:00Z"
    }
  }
}
```

6. Save document
7. Refresh Dashboard and open Past Weeks modal

---

## 🔧 Step 4: Verify API Endpoint

Test the API directly:

```bash
# Replace userId with your actual userId
curl http://localhost:7071/api/getPastWeeks/user@example.com
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "userId": "user@example.com",
    "weekHistory": {
      "2025-W47": {
        "totalGoals": 5,
        "completedGoals": 3,
        "score": 9,
        "weekStartDate": "2025-11-17",
        "weekEndDate": "2025-11-23"
      }
    },
    "totalWeeksTracked": 1
  }
}
```

**If Empty**:
```json
{
  "success": true,
  "data": {
    "userId": "user@example.com",
    "weekHistory": {},
    "totalWeeksTracked": 0
  },
  "message": "No past weeks history found yet."
}
```

---

## 🐛 Common Issues

### Issue 1: Modal Shows "No past weeks yet"

**Cause**: `weekHistory` is empty in pastWeeks container

**Fix**: Archive at least one week (see Step 3)

### Issue 2: Weeks Show But Score is 0%

**Cause**: Score calculation issue

**Debug**: Check console for score values:
```
   Week 2025-W47: { score: 9, ... }  // ← Raw points
```

**Fix**: The code now converts raw points to percentage automatically. If score < 100 and totalGoals > 0, it calculates completion percentage.

### Issue 3: Weeks Show But Date Range is Missing

**Cause**: `weekStartDate` is missing or invalid

**Debug**: Check console:
```
   Week 2025-W47: { weekStartDate: undefined, ... }
```

**Fix**: Ensure archived weeks include `weekStartDate` field

### Issue 4: Modal Shows Loading Forever

**Cause**: API call hanging or failing silently

**Debug**: Check Network tab in DevTools:
- Look for `/api/getPastWeeks/{userId}` request
- Check if it's pending or failed
- Check response status code

**Fix**: 
- Verify API endpoint is deployed
- Check CORS settings
- Verify userId is correct

### Issue 5: Weeks Appear But Wrong Order

**Cause**: Sorting issue

**Current Behavior**: Weeks are sorted ascending (oldest first, newest last)

**Expected**: Modal scrolls to show most recent week on the right

**If Issue**: Check console for `sortedWeeks` array order

---

## ✅ Success Checklist

After fixing, you should see:

- [ ] Console shows "weekHistoryCount: X" where X > 0
- [ ] Console shows "Returning X recent weeks" where X > 0
- [ ] Console shows "Transformed weeks: { count: X }" where X > 0
- [ ] Modal shows "Total Weeks: X" where X > 0
- [ ] Modal displays week cards with:
  - Week number (W47, W46, etc.)
  - Date range
  - Score percentage
  - Goals count (X/Y goals)
- [ ] Most recent week has "Last week" badge
- [ ] Weeks scroll horizontally
- [ ] Stats banner shows:
  - Total Weeks
  - Average Score
  - Total Completed Goals
  - Best Week Score

---

## 📊 Score Calculation

The modal displays score as a **percentage** (0-100%). The system handles two cases:

### Case 1: Score is Already Percentage
If `score >= 100`, it's displayed as-is (though this shouldn't happen)

### Case 2: Score is Raw Points
If `score < 100` and `totalGoals > 0`, it calculates completion percentage:
```javascript
score = Math.round((completedGoals / totalGoals) * 100);
```

**Example**:
- Raw score: 9 points
- Completed goals: 3
- Total goals: 5
- Displayed score: 60% (3/5 = 60%)

---

## 🔄 How Weeks Get Archived

Weeks are archived automatically when:

1. **Server Timer Runs** (Monday 00:00 UTC)
   - Archives previous week
   - Creates new week

2. **Client Fallback Triggers** (on login)
   - If server missed rollover
   - Archives old week
   - Reloads page

3. **Manual Archive** (testing)
   - Use browser console script (see Step 3)
   - Or use Azure Portal

---

## 📞 Still Not Working?

If past weeks still aren't showing:

1. **Share console output** - Copy all console logs when opening modal
2. **Share API response** - Copy the response from `/api/getPastWeeks/{userId}`
3. **Share database structure** - Export your pastWeeks document from Cosmos DB
4. **Check network tab** - Verify API call succeeds (status 200)

This will help diagnose the exact issue!

---

**Created**: November 18, 2025  
**Last Updated**: November 18, 2025  
**Related Files**: 
- `src/components/PastWeeksModal.jsx`
- `src/hooks/usePastWeeks.js`
- `src/services/weekHistoryService.js`
- `api/getPastWeeks/index.js`

