# Past Weeks Data Structure & Example

## 📊 Sample Data Generation

This document shows the structure and example data for the Past Weeks feature.

---

## Data Structure

### pastWeeks Container Document

```javascript
{
  "id": "Tyler.Stewart@netsurit.com",         // Document ID = userId
  "userId": "Tyler.Stewart@netsurit.com",      // Partition key
  "weekHistory": {                              // Object with weekId keys
    "2025-W37": {                               // ISO week ID
      "totalGoals": 5,
      "completedGoals": 4,
      "skippedGoals": 1,
      "score": 80,                             // Percentage: (completed/total) * 100
      "weekStartDate": "2025-09-08T00:00:00.000Z",
      "weekEndDate": "2025-09-14T00:00:00.000Z",
      "archivedAt": "2025-09-15T00:00:00.000Z"  // When week was moved to history
    },
    // ... more weeks
  },
  "totalWeeksTracked": 10,
  "createdAt": "2025-09-08T00:00:00.000Z",
  "updatedAt": "2025-11-18T18:04:37.274Z"
}
```

---

## Complete Sample Data for Tyler Stewart

### 10 Weeks of Historical Data (Sept - Nov 2025)

```json
{
  "id": "Tyler.Stewart@netsurit.com",
  "userId": "Tyler.Stewart@netsurit.com",
  "weekHistory": {
    "2025-W37": {
      "totalGoals": 5,
      "completedGoals": 4,
      "skippedGoals": 1,
      "score": 80,
      "weekStartDate": "2025-09-08T00:00:00.000Z",
      "weekEndDate": "2025-09-14T00:00:00.000Z",
      "archivedAt": "2025-09-15T00:00:00.000Z"
    },
    "2025-W38": {
      "totalGoals": 6,
      "completedGoals": 6,
      "skippedGoals": 0,
      "score": 100,
      "weekStartDate": "2025-09-15T00:00:00.000Z",
      "weekEndDate": "2025-09-21T00:00:00.000Z",
      "archivedAt": "2025-09-22T00:00:00.000Z"
    },
    "2025-W39": {
      "totalGoals": 7,
      "completedGoals": 3,
      "skippedGoals": 4,
      "score": 43,
      "weekStartDate": "2025-09-22T00:00:00.000Z",
      "weekEndDate": "2025-09-28T00:00:00.000Z",
      "archivedAt": "2025-09-29T00:00:00.000Z"
    },
    "2025-W40": {
      "totalGoals": 5,
      "completedGoals": 3,
      "skippedGoals": 2,
      "score": 60,
      "weekStartDate": "2025-09-29T00:00:00.000Z",
      "weekEndDate": "2025-10-05T00:00:00.000Z",
      "archivedAt": "2025-10-06T00:00:00.000Z"
    },
    "2025-W41": {
      "totalGoals": 6,
      "completedGoals": 5,
      "skippedGoals": 1,
      "score": 83,
      "weekStartDate": "2025-10-06T00:00:00.000Z",
      "weekEndDate": "2025-10-12T00:00:00.000Z",
      "archivedAt": "2025-10-13T00:00:00.000Z"
    },
    "2025-W42": {
      "totalGoals": 5,
      "completedGoals": 5,
      "skippedGoals": 0,
      "score": 100,
      "weekStartDate": "2025-10-13T00:00:00.000Z",
      "weekEndDate": "2025-10-19T00:00:00.000Z",
      "archivedAt": "2025-10-20T00:00:00.000Z"
    },
    "2025-W43": {
      "totalGoals": 7,
      "completedGoals": 6,
      "skippedGoals": 1,
      "score": 86,
      "weekStartDate": "2025-10-20T00:00:00.000Z",
      "weekEndDate": "2025-10-26T00:00:00.000Z",
      "archivedAt": "2025-10-27T00:00:00.000Z"
    },
    "2025-W44": {
      "totalGoals": 6,
      "completedGoals": 2,
      "skippedGoals": 4,
      "score": 33,
      "weekStartDate": "2025-10-27T00:00:00.000Z",
      "weekEndDate": "2025-11-02T00:00:00.000Z",
      "archivedAt": "2025-11-03T00:00:00.000Z"
    },
    "2025-W45": {
      "totalGoals": 5,
      "completedGoals": 4,
      "skippedGoals": 1,
      "score": 80,
      "weekStartDate": "2025-11-03T00:00:00.000Z",
      "weekEndDate": "2025-11-09T00:00:00.000Z",
      "archivedAt": "2025-11-10T00:00:00.000Z"
    },
    "2025-W46": {
      "totalGoals": 6,
      "completedGoals": 5,
      "skippedGoals": 1,
      "score": 83,
      "weekStartDate": "2025-11-10T00:00:00.000Z",
      "weekEndDate": "2025-11-16T00:00:00.000Z",
      "archivedAt": "2025-11-17T00:00:00.000Z"
    }
  },
  "totalWeeksTracked": 10,
  "createdAt": "2025-09-08T00:00:00.000Z",
  "updatedAt": "2025-11-18T18:04:37.274Z"
}
```

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| **Total Weeks Tracked** | 10 |
| **Total Goals Set** | 58 |
| **Total Goals Completed** | 43 |
| **Average Score** | 75% |
| **Best Week** | 100% (W38 & W42) |
| **Worst Week** | 33% (W44) |

### Week-by-Week Breakdown

| Week | Date Range | Goals | Score | Status |
|------|------------|-------|-------|--------|
| W37 | Sept 8-14 | 4/5 | 80% | 🟢 Great |
| W38 | Sept 15-21 | 6/6 | 100% | 🟢 Perfect! |
| W39 | Sept 22-28 | 3/7 | 43% | 🟠 Needs work |
| W40 | Sept 29-Oct 5 | 3/5 | 60% | 🟡 Okay |
| W41 | Oct 6-12 | 5/6 | 83% | 🟢 Great |
| W42 | Oct 13-19 | 5/5 | 100% | 🟢 Perfect! |
| W43 | Oct 20-26 | 6/7 | 86% | 🟢 Great |
| W44 | Oct 27-Nov 2 | 2/6 | 33% | 🔴 Missed |
| W45 | Nov 3-9 | 4/5 | 80% | 🟢 Great |
| W46 | Nov 10-16 | 5/6 | 83% | 🟢 Great |

---

## How It Works: Week Archiving Process

### When Current Week Ends

1. **End of Week (Sunday night)**
   - System detects week transition

2. **Archive Current Week**
   ```javascript
   // Current week gets archived
   const weekSummary = {
     totalGoals: 7,
     completedGoals: 6,
     skippedGoals: 1,
     score: 86,
     weekStartDate: "2025-10-20T00:00:00.000Z",
     weekEndDate: "2025-10-26T00:00:00.000Z"
   };
   
   // Call archive function
   await archiveWeek(userId, "2025-W43", weekSummary);
   ```

3. **Update pastWeeks Container**
   - Add week to `weekHistory` object
   - Increment `totalWeeksTracked`
   - Update `updatedAt` timestamp

4. **Create New Current Week**
   - Clear `currentWeek` container
   - Initialize empty goals array for new week (2025-W44)

---

## How Modal Displays Data

### API Call
```javascript
// Frontend calls
GET /api/getPastWeeks/Tyler.Stewart@netsurit.com

// Returns
{
  "success": true,
  "data": {
    "userId": "Tyler.Stewart@netsurit.com",
    "weekHistory": { /* ... */ },
    "totalWeeksTracked": 10
  }
}
```

### Service Layer Transform
```javascript
// weekHistoryService.getRecentWeeks()
// Converts object to sorted array

const weeks = Object.entries(weekHistory).map(([weekId, stats]) => ({
  weekId,
  ...stats
}));

// Sort by weekId descending (most recent first)
weeks.sort((a, b) => b.weekId.localeCompare(a.weekId));

// Return most recent N weeks
return weeks.slice(0, 24); // Last 24 weeks
```

### Modal Display
```javascript
// Each week rendered as checkbox card
weeks.map(week => (
  <WeekCard
    weekId="2025-W43"
    dateRange="Oct 20-26"
    score={86}
    completedGoals={6}
    totalGoals={7}
    colorClass="green"  // Based on score
  />
))
```

---

## Manual Data Insertion

### Via Azure Portal

1. Navigate to: **Azure Portal** > **Cosmos DB** > **dreamspace** database
2. Open **pastWeeks** container
3. Click **"New Item"**
4. Paste the JSON above (complete sample data)
5. Click **Save**

### Via API Endpoint

```bash
# Seed via API
POST http://localhost:7071/api/seedPastWeeks
Content-Type: application/json

{
  "userId": "Tyler.Stewart@netsurit.com"
}
```

---

## Files Created

| File | Purpose |
|------|---------|
| `scripts/generateSamplePastWeeks.js` | Node script to generate JSON |
| `api/seedPastWeeks/index.js` | API endpoint to seed data |
| `api/seedPastWeeks/function.json` | Azure Function config |
| `test-seed-pastweeks.html` | Test page for seeding |

---

## Next Steps

1. **Insert Sample Data** (choose one method):
   - Use Azure Portal Data Explorer
   - Call `POST /api/seedPastWeeks`
   - Run `node scripts/generateSamplePastWeeks.js` and paste output

2. **Test Modal**:
   - Go to http://localhost:5173/dashboard
   - Click "Past Weeks" button
   - See 10 weeks of historical data displayed!

3. **Verify Display**:
   - ✅ Stats banner shows: 10 weeks, 75% avg, 43 completed
   - ✅ Week cards show color-coded scores
   - ✅ Can select multiple weeks to compare
   - ✅ Date ranges formatted correctly

---

## Color Coding Legend

| Score Range | Color | Emoji | Label |
|-------------|-------|-------|-------|
| 80-100% | 🟢 Green | ✓ | Great performance |
| 60-79% | 🟡 Yellow | ~ | Good effort |
| 40-59% | 🟠 Orange | △ | Needs improvement |
| 0-39% | 🔴 Red | ✗ | Missed week |

---

**Document Created**: November 18, 2025  
**Status**: ✅ Ready for testing

