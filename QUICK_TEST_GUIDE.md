# Quick Test Guide - Goal Data Flow Fixes

## 🎯 Primary Test: Week Ahead Goal Creation

This is the main test to verify the fix works correctly.

### Steps:
1. **Open Browser Console** (F12 → Console tab)
2. Navigate to **Week Ahead** page
3. Select current week
4. Click **"+ Add Goal"** button on any dream card
5. Fill in goal form:
   - Title: "Test Weekly Goal From Week Ahead"
   - Type: **Consistency**
   - Recurrence: **Weekly**
   - Target Weeks: **12**
6. Click **"Add Goal"**

### ✅ Expected Console Output:
```
🎯 Creating goal for dream: {
  dreamId: "dream_xxx",
  dreamTitle: "Your Dream Name",
  dreamCategory: "Health & Fitness",
  goalType: "consistency",
  recurrence: "weekly"
}

📝 addWeeklyGoal called: {
  goalId: "goal_xxx",
  type: "weekly_goal_template",
  dreamId: "dream_xxx",
  dreamTitle: "Your Dream Name",
  dreamCategory: "Health & Fitness"
}

💾 Saving template via saveDreams: goal_xxx

✅ Template saved successfully to dreams container

📝 Adding goal to dream.goals[] for Dream Detail display: {
  dreamId: "dream_xxx",
  goalId: "goal_xxx",
  goalTitle: "Test Weekly Goal From Week Ahead"
}

💾 Saving updated dream with new goal in goals[] array
```

### ✅ Expected UI Behavior:
1. Goal appears immediately in Week Ahead current week
2. Navigate to **Dream Book**
3. Open the same dream → Click **Goals** tab
4. **Goal should display here** (THIS IS THE FIX!)

---

## 🔍 What Was Fixed

**BEFORE**: Goals created in Week Ahead did NOT show in Dream Detail Goals tab  
**AFTER**: Goals created in Week Ahead NOW show in Dream Detail Goals tab

---

## ⚠️ If Test Fails

### Check Console for Errors:
- Look for ❌ or error messages
- Check if dreamId, dreamTitle, dreamCategory are present
- Verify "Adding goal to dream.goals[]" log appears

### Check React DevTools:
1. Open React DevTools
2. Find AppContext provider
3. Verify `state.weeklyGoals` contains template
4. Verify `state.currentUser.dreamBook[X].goals[]` contains goal

### Common Issues:
- **"Parent dream not found"** → Dream might not be loaded in state
- **"Goal already exists"** → Goal was created previously, try with new dream
- **No console logs** → Check if you're on development mode

---

## 📊 Quick Verification Steps

### Step 1: Create Goal in Week Ahead ✅
- Open Week Ahead
- Add goal from dream card
- See goal in current week list

### Step 2: Check Dream Detail ✅
- Open Dream Book
- Click on same dream
- Go to Goals tab
- **Goal should be visible here**

### Step 3: Check Persistence ✅
- Refresh browser (F5)
- Go back to Dream Book → Goals tab
- **Goal should still be there**

---

## 🎉 Success Indicators

- ✅ Console logs show dual-save process
- ✅ Goal appears in Week Ahead
- ✅ Goal appears in Dream Detail Goals tab
- ✅ Goal persists after refresh
- ✅ Goal auto-instantiates in future weeks

---

## 🐛 Debug Commands

### Check goal in console:
```javascript
// In browser console
window.appState = null; // Will be set by AppContext

// Then check:
console.log('Templates:', appState.weeklyGoals.filter(g => g.type === 'weekly_goal_template'));
console.log('Dream goals:', appState.currentUser.dreamBook[0].goals);
```

### Check in React DevTools:
1. Find AppContext provider
2. Check `weeklyGoals` array
3. Check `currentUser.dreamBook[].goals[]` arrays

---

## 📝 Expected File Changes

1. **AppContext.jsx** - Lines 726-780
   - Added dual-save logic after template creation
   - Saves goal to both weeklyGoalTemplates AND dream.goals[]

2. **DreamsWeekAhead.jsx** - Enhanced logging
   - Logs dreamId, dreamTitle, dreamCategory when creating goal

3. **useDreamTracker.js** - Enhanced goal loading
   - Loads goals from both templates AND dream.goals[]
   - Better logging for debugging

---

## 🚀 Quick Start

```bash
# 1. Ensure dev server is running
npm run dev

# 2. Open browser to http://localhost:5173

# 3. Open Console (F12)

# 4. Navigate to Week Ahead

# 5. Add a goal and watch the console!
```

---

## ✅ Pass/Fail Criteria

### ✅ PASS if:
- Goal created in Week Ahead appears in Dream Detail Goals tab
- Console logs show dual-save process
- No errors in console
- Data persists after refresh

### ❌ FAIL if:
- Goal does NOT appear in Dream Detail Goals tab
- Console shows errors
- dreamId/dreamTitle/dreamCategory are missing
- Data doesn't persist

---

## 📞 Need Help?

1. Check `GOAL_DATA_FLOW_FIXES.md` for detailed information
2. Review console logs for specific errors
3. Use React DevTools to inspect state
4. Verify Cosmos DB document structure (if you have access)

**Status**: ✅ Ready for testing

