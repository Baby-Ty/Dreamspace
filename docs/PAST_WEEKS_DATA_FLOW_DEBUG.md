# Past Weeks Data Flow - Debugging Guide

**Issue**: Entries exist in pastWeeks container but not showing in modal  
**Date**: November 18, 2025

---

## 🔍 Data Flow Path

```
Cosmos DB (pastWeeks container)
    ↓
api/getPastWeeks/index.js (API endpoint)
    ↓
src/services/weekHistoryService.js (getPastWeeks)
    ↓
src/services/weekHistoryService.js (getRecentWeeks - transforms object to array)
    ↓
src/hooks/usePastWeeks.js (transforms and sets state)
    ↓
src/pages/dashboard/DashboardLayout.jsx (passes to modal)
    ↓
src/components/PastWeeksModal.jsx (displays weeks)
```

---

## 📊 Debugging Added

I've added console logging at **every step** to track where data gets lost:

### 1. API Endpoint (`api/getPastWeeks/index.js`)
**Logs**: What's retrieved from Cosmos DB
```
📊 Past weeks document retrieved: {
  userId: "...",
  hasWeekHistory: true,
  weekHistoryType: "object",
  weekHistoryKeys: ["2025-W47", "2025-W46"],
  weekHistoryCount: 2,
  sampleWeek: { totalGoals: 5, completedGoals: 3, ... }
}
✅ Past weeks retrieved: 2 weeks tracked
```

### 2. Service Layer (`weekHistoryService.getPastWeeks`)
**Logs**: What API returns
```
📊 weekHistoryService.getPastWeeks: API response: {
  success: true,
  hasData: true,
  weekHistoryKeys: ["2025-W47", "2025-W46"],
  weekHistoryCount: 2
}
✅ weekHistoryService.getPastWeeks: Returning 2 weeks
```

### 3. Transformation (`weekHistoryService.getRecentWeeks`)
**Logs**: Object → Array transformation
```
📊 weekHistoryService.getRecentWeeks: {
  weekHistoryKeys: ["2025-W47", "2025-W46"],
  weekHistoryCount: 2,
  sampleEntry: ["2025-W47", { totalGoals: 5, ... }]
}
   Week 2025-W47: { weekId: "2025-W47", totalGoals: 5, ... }
✅ Returning 2 recent weeks
```

### 4. Hook (`usePastWeeks`)
**Logs**: Final transformed data
```
📊 usePastWeeks: Raw data from API: {
  dataLength: 2,
  sample: { weekId: "2025-W47", ... },
  allWeeks: [...]
}
✅ usePastWeeks: Transformed weeks: { count: 2, weeks: [...] }
```

### 5. Modal (`PastWeeksModal`)
**Logs**: Props received
```
📊 PastWeeksModal opened: {
  isLoading: false,
  weeksCount: 2,
  weeks: [...]
}
```

---

## 🧪 How to Debug

### Step 1: Open Browser Console

1. Open your app
2. Press **F12** (DevTools)
3. Go to **Console** tab
4. Navigate to **Dashboard**
5. Click **"View Past Weeks"** button

### Step 2: Check Each Log Level

**Look for these messages in order:**

#### ✅ Level 1: API Response
```
📊 weekHistoryService.getPastWeeks: API response: {
  weekHistoryCount: X  // ← Should be > 0 if data exists
}
```

**If count is 0**: Data not in database OR API not returning it  
**If count > 0**: Data exists, continue to next level

#### ✅ Level 2: Transformation
```
📊 weekHistoryService.getRecentWeeks: {
  weekHistoryCount: X  // ← Should match API count
}
✅ Returning X recent weeks
```

**If count is 0**: Transformation issue  
**If count > 0**: Continue to next level

#### ✅ Level 3: Hook
```
📊 usePastWeeks: Raw data from API: {
  dataLength: X  // ← Should match transformation count
}
✅ usePastWeeks: Transformed weeks: { count: X }
```

**If count is 0**: Hook transformation issue  
**If count > 0**: Continue to next level

#### ✅ Level 4: Modal
```
📊 PastWeeksModal opened: {
  weeksCount: X  // ← Should match hook count
}
```

**If count is 0**: Props not passed correctly  
**If count > 0**: Modal should display weeks!

---

## 🐛 Common Issues & Fixes

### Issue 1: API Returns Empty weekHistory

**Console shows**:
```
📊 weekHistoryService.getPastWeeks: API response: {
  weekHistoryCount: 0
}
```

**Check**: Cosmos DB document structure
- Open Azure Portal → Cosmos DB → pastWeeks container
- Find your user document
- Verify `weekHistory` is an **object** (not array):
```json
{
  "weekHistory": {
    "2025-W47": { ... },
    "2025-W46": { ... }
  }
}
```

**Fix**: If `weekHistory` is an array, convert it to object format

---

### Issue 2: Transformation Returns Empty Array

**Console shows**:
```
📊 weekHistoryService.getRecentWeeks: {
  weekHistoryCount: 2  // ← Has data
}
✅ Returning 0 recent weeks  // ← But returns 0!
```

**Problem**: `Object.entries()` or `.slice()` issue

**Check**: Look for errors in console

**Fix**: Check `getRecentWeeks` function logic

---

### Issue 3: Hook Receives Empty Array

**Console shows**:
```
📊 weekHistoryService.getRecentWeeks: {
  weekHistoryCount: 2
}
✅ Returning 2 recent weeks

📊 usePastWeeks: Raw data from API: {
  dataLength: 0  // ← Lost data!
}
```

**Problem**: Data lost between service and hook

**Check**: Network tab - verify API response

**Fix**: Check `getRecentWeeks` return format

---

### Issue 4: Modal Receives Empty Array

**Console shows**:
```
✅ usePastWeeks: Transformed weeks: { count: 2 }

📊 PastWeeksModal opened: {
  weeksCount: 0  // ← Lost data!
}
```

**Problem**: Props not passed correctly

**Check**: `DashboardLayout.jsx` line 207:
```javascript
weeks={pastWeeks || []}  // ← Should be pastWeeks, not empty array
```

**Fix**: Verify `pastWeeks` state in DashboardLayout

---

## 🔧 Quick Test Script

Run this in browser console to test the full flow:

```javascript
// Replace with your userId
const userId = 'your-email@example.com';

// Test API directly
const apiResult = await fetch(`/api/getPastWeeks/${userId}`);
const apiData = await apiResult.json();
console.log('1. API Response:', {
  success: apiData.success,
  weekHistoryCount: Object.keys(apiData.data?.weekHistory || {}).length,
  weekHistory: apiData.data?.weekHistory
});

// Test service
import { getRecentWeeks } from './services/weekHistoryService';
const serviceResult = await getRecentWeeks(userId, 24);
console.log('2. Service Result:', {
  success: serviceResult.success,
  dataLength: serviceResult.data?.length || 0,
  data: serviceResult.data
});
```

---

## ✅ Expected Console Output (Success)

When everything works, you should see:

```
📊 weekHistoryService.getPastWeeks: API response: {
  weekHistoryCount: 2
}
✅ weekHistoryService.getPastWeeks: Returning 2 weeks

📊 weekHistoryService.getRecentWeeks: {
  weekHistoryCount: 2
}
   Week 2025-W47: { weekId: "2025-W47", totalGoals: 5, ... }
   Week 2025-W46: { weekId: "2025-W46", totalGoals: 6, ... }
✅ Returning 2 recent weeks

📊 usePastWeeks: Raw data from API: {
  dataLength: 2
}
   Week 2025-W47: { totalGoals: 5, completedGoals: 3, score: 60 }
✅ usePastWeeks: Transformed weeks: { count: 2 }

📊 PastWeeksModal opened: {
  weeksCount: 2,
  weeks: [
    { weekId: "2025-W47", ... },
    { weekId: "2025-W46", ... }
  ]
}
```

---

## 📞 Next Steps

1. **Open console** and check which log level shows 0 count
2. **Share the console output** - this will show exactly where data is lost
3. **Check Cosmos DB** - verify document structure matches expected format

The debugging will pinpoint exactly where the data flow breaks!

---

**Created**: November 18, 2025  
**Files Modified**:
- `api/getPastWeeks/index.js` - Added API logging
- `src/services/weekHistoryService.js` - Added service logging
- `src/hooks/usePastWeeks.js` - Already had logging
- `src/components/PastWeeksModal.jsx` - Added modal logging

