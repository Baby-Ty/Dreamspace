# Past Weeks Sample Data - Quick Start Guide

## 📋 Summary

I've generated **10 weeks of realistic historical data** for Tyler Stewart that shows how the Past Weeks Modal will look when populated with actual data.

---

## 🎯 What Was Created

### 1. **Sample Data Structure**
- 10 weeks of goals (Sept 8 - Nov 16, 2025)
- Realistic completion rates (33% - 100%)
- Color-coded performance indicators
- Total: 58 goals set, 43 completed (75% avg)

### 2. **Files Created**

| File | Purpose |
|------|---------|
| `PAST_WEEKS_DATA_EXAMPLE.md` | Complete JSON data + structure |
| `PAST_WEEKS_MODAL_WITH_DATA.md` | Visual mockup of populated modal |
| `scripts/generateSamplePastWeeks.js` | Script to generate JSON |
| `api/seedPastWeeks/index.js` | API endpoint to insert data |
| `test-seed-pastweeks.html` | Test page for seeding |

---

## 📊 Tyler Stewart's Sample Week Data

### Performance Overview

```
Total Weeks:     10
Total Goals:     58
Completed:       43
Average Score:   75%
Best Week:       100% (W38 & W42)
Worst Week:      33% (W44)
```

### Week-by-Week Breakdown

| Week | Dates | Completed | Score | Status |
|------|-------|-----------|-------|--------|
| **W46** | Nov 10-16 | 5/6 | **83%** | 🟢 Great |
| **W45** | Nov 3-9 | 4/5 | **80%** | 🟢 Great |
| **W44** | Oct 27-Nov 2 | 2/6 | **33%** | 🔴 Missed |
| **W43** | Oct 20-26 | 6/7 | **86%** | 🟢 Great |
| **W42** | Oct 13-19 | 5/5 | **100%** | 🟢 Perfect! |
| **W41** | Oct 6-12 | 5/6 | **83%** | 🟢 Great |
| **W40** | Sept 29-Oct 5 | 3/5 | **60%** | 🟡 Okay |
| **W39** | Sept 22-28 | 3/7 | **43%** | 🟠 Needs work |
| **W38** | Sept 15-21 | 6/6 | **100%** | 🟢 Perfect! |
| **W37** | Sept 8-14 | 4/5 | **80%** | 🟢 Great |

---

## 🚀 How to Insert This Data

### **Option 1: Azure Portal (Recommended)**

1. Open **Azure Portal**
2. Navigate to your **Cosmos DB account**
3. Go to **Data Explorer**
4. Open the **pastWeeks** container
5. Click **New Item**
6. Copy the JSON from `PAST_WEEKS_DATA_EXAMPLE.md` (lines 23-112)
7. Paste into the editor
8. Click **Save**
9. Done! ✅

### **Option 2: Via API Endpoint**

```bash
# Make sure Azure Functions server is running
# Then call the seed endpoint:

POST http://localhost:7071/api/seedPastWeeks
Content-Type: application/json

{
  "userId": "Tyler.Stewart@netsurit.com"
}
```

### **Option 3: Using Test Page**

1. Open `http://localhost:5173/test-seed-pastweeks.html`
2. Confirm userId: `Tyler.Stewart@netsurit.com`
3. Click **"🚀 Seed Past Weeks Data"**
4. Wait for success message
5. Done! ✅

---

## 🎨 What Tyler Will See

### When Opening Past Weeks Modal

```
┌─────────────────────────────────────────────┐
│  Past Weeks Tracker                     [×] │
├─────────────────────────────────────────────┤
│  📊 Your Progress Overview                  │
│  ┌──────────────────────────────────────┐  │
│  │  10 Weeks  │  75% Avg  │  43 Done    │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  🟢 W46: 83% (5/6)    🟢 W45: 80% (4/5)   │
│  🔴 W44: 33% (2/6)    🟢 W43: 86% (6/7)   │
│  🟢 W42: 100% (5/5)   🟢 W41: 83% (5/6)   │
│  🟡 W40: 60% (3/5)    🟠 W39: 43% (3/7)   │
│  🟢 W38: 100% (6/6)   🟢 W37: 80% (4/5)   │
│                                             │
│  Legend: 🟢 80-100%  🟡 60-79%             │
│          🟠 40-59%  🔴 0-39%               │
└─────────────────────────────────────────────┘
```

### Interactive Features

✅ **Click to select weeks** - Checkbox fills  
✅ **Multi-select for comparison** - See combined stats  
✅ **Color-coded scores** - Visual performance indicators  
✅ **Date ranges** - Easy to identify time periods  
✅ **Stats banner** - Overall progress at a glance  

---

## 🔄 How Data Gets There (Week Archiving)

### End of Current Week Process

```javascript
// Sunday Night - Week 47 ends
currentWeekGoals = [
  { title: "Exercise 3x", completed: true },
  { title: "Read 30 min/day", completed: true },
  { title: "Complete project", completed: false },
  { title: "Meal prep", completed: true },
  { title: "Sleep 8hrs", completed: true }
];

// Calculate week summary
const weekSummary = {
  totalGoals: 5,
  completedGoals: 4,
  skippedGoals: 1,
  score: 80, // (4/5) * 100
  weekStartDate: "2025-11-17T00:00:00.000Z",
  weekEndDate: "2025-11-23T00:00:00.000Z"
};

// Archive to pastWeeks
await archiveWeek("Tyler.Stewart@netsurit.com", "2025-W47", weekSummary);

// Creates new entry in pastWeeks container:
weekHistory["2025-W47"] = {
  totalGoals: 5,
  completedGoals: 4,
  score: 80,
  // ... dates
};

// Clear currentWeek for new week
await createNewCurrentWeek("Tyler.Stewart@netsurit.com", "2025-W48");
```

---

## 📈 Expected Modal Behavior

### With 10 Weeks of Data:

1. **Opens immediately** - No loading delay
2. **Shows stats banner** - 10 weeks, 75% avg, 43 completed
3. **Displays grid** - 10 week cards in 6-column layout
4. **Color coded** - 7 green, 1 yellow, 1 orange, 1 red
5. **Interactive** - Can select multiple weeks
6. **Responsive** - Works on mobile, tablet, desktop

### Comparison Feature:

```
Tyler selects W46, W45, W43 (best recent weeks):

Selected: 3 weeks
Average: 83%
Total: 15/18 goals completed (83%)
```

---

## ✅ Verification Steps

### After Inserting Data:

1. ✅ Go to `http://localhost:5173/dashboard`
2. ✅ Click **"Past Weeks"** button
3. ✅ Modal opens (no white screen!)
4. ✅ Stats show: **10 weeks, 75% avg**
5. ✅ See 10 week cards in grid
6. ✅ Colors match scores:
   - Green: W37, W38, W41, W42, W43, W45, W46
   - Yellow: W40
   - Orange: W39
   - Red: W44
7. ✅ Click a week - checkbox fills
8. ✅ Select multiple - see combined stats
9. ✅ Close modal - returns to dashboard

---

## 🎉 Benefits of This Sample Data

### Realistic Variety
- **Perfect weeks** (100%) - Shows achievement
- **Great weeks** (80-86%) - Normal good performance  
- **Okay weeks** (60%) - Average performance
- **Tough weeks** (33-43%) - Everyone has bad weeks

### User Insights
Tyler can:
- **Identify patterns** - When did performance dip?
- **Celebrate wins** - Two perfect weeks!
- **Learn from struggles** - Why was W44 only 33%?
- **Track trends** - Strong October finish
- **Set goals** - Aim for consistent 80%+

### Product Testing
Developers can:
- **Test all color states** - Green, yellow, orange, red
- **Verify calculations** - Score percentages correct?
- **Test interactions** - Multi-select working?
- **Check responsive** - Mobile vs desktop layout
- **Validate formatting** - Date ranges displaying right?

---

## 🔧 Troubleshooting

### Modal Shows "No past weeks yet"
**Problem**: Data not inserted yet  
**Solution**: Insert data using one of the 3 options above

### API Returns 404
**Problem**: Azure Functions server not running  
**Solution**: Start server with `func start` or `npm run start:api`

### Data Shows But Scores Wrong
**Problem**: Calculation error  
**Solution**: Check `score = (completedGoals / totalGoals) * 100`

### Week Order Wrong
**Problem**: Sorting issue  
**Solution**: Ensure weeks sorted by weekId descending

---

## 📝 JSON Data Location

The complete JSON is in: **`PAST_WEEKS_DATA_EXAMPLE.md`**

Quick copy-paste section (lines 23-112):
- Document ID: `Tyler.Stewart@netsurit.com`
- Partition key: Same as ID
- Contains 10 weeks (W37-W46)
- Ready to paste into Azure Portal

---

## 🎯 Next Steps

1. **Insert the data** (choose your method)
2. **Open dashboard** at http://localhost:5173
3. **Click "Past Weeks"** button
4. **See the populated modal** with 10 weeks!
5. **Test interactions** - Select, compare, review
6. **Celebrate** - Feature is working! 🎉

---

**Generated**: November 18, 2025  
**User**: Tyler Stewart  
**Data**: 10 weeks (Sept 8 - Nov 16, 2025)  
**Status**: ✅ Ready to insert and test

**Questions?** Check the other documentation files:
- `PAST_WEEKS_DATA_EXAMPLE.md` - Full JSON data
- `PAST_WEEKS_MODAL_WITH_DATA.md` - Visual mockups
- `PAST_WEEKS_MODAL_IMPLEMENTATION.md` - Technical details

