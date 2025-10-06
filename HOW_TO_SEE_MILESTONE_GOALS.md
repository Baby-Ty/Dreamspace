# How to See the New Milestone Goals Features

## 🔴 Important: Your Existing Dream Won't Show New Features

If you created the "Backpack Through Patagonia" dream BEFORE the implementation, it won't have coach milestones because they were added to the **template**, not existing dreams.

---

## ✅ Option 1: View the Updated Dream (Fastest)

1. Go to **Dream Book**
2. Find **"Master React and TypeScript"** dream
3. Click to open the Dream Modal
4. Go to **Milestones tab**
5. **Look for milestone**: "Consistent practice - 12 weeks"
   - Should show **"Coach Milestone"** badge
   - Should show **"3/12 weeks"** progress bar
   - Click the **chevron (▶)** to expand
6. You'll see:
   - **"Recurring Goals (1)"** section
   - Goal: "Practice React patterns"
   - **"View History"** link showing weekly checkmarks

---

## ✅ Option 2: Check Week Ahead Page

1. Go to **Dreams Week Ahead**
2. Look for goal: **"Practice React patterns"**
3. You should see these badges:
   - **"🔄 Recurring Weekly"**
   - **"⭐ Linked to Milestone"**
4. Toggle the checkbox - it logs to THIS WEEK'S weekLog
5. The milestone streak updates automatically

---

## ✅ Option 3: Create a NEW Patagonia Dream

1. Go to **Dream Book**
2. Click **"Browse Inspirations"** tab
3. Find **"Backpack Through Patagonia"**
4. Click **"Add to My Dreams"**
5. The new dream will have **7 milestones** (not 6):
   - The 6 regular ones you saw before
   - **NEW:** "Physical prep - consistent cardio for 10 weeks" (Coach Milestone)
6. Open the dream → Milestones tab → Expand the coach milestone

---

## ✅ Option 4: Add to Existing "Visit Machu Picchu" Dream

I also updated the "Visit Machu Picchu" dream in mock data:
1. If you have that dream, refresh the page
2. Open it → Milestones tab
3. Look for: **"Physical prep - consistent cardio for 8 weeks"**
4. It should have the Coach Milestone badge

---

## 🎯 What You Should See

### In Dream Modal → Milestones Tab:
```
┌─────────────────────────────────────────────┐
│ ○ Regular milestone                         │
│ ○ Another regular milestone                 │
│                                             │
│ ⬇️ Coach Milestone ▶                       │
│ Consistent practice - 12 weeks              │
│ [Coach Milestone] [3/12 weeks]             │
│ Progress: [████░░░░░░░░] 25%               │
└─────────────────────────────────────────────┘

Click ▶ to expand ▼

┌─────────────────────────────────────────────┐
│ Recurring Goals (1)                         │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Practice React patterns              │   │
│ │ Study and implement 2-3 patterns     │   │
│ │ ✓ 3 weeks completed | Weekly         │   │
│ │ [View History]                       │   │
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘

Click "View History" ▼

Weekly History:
- Week 40, 2025: ✓
- Week 39, 2025: ✓
- Week 38, 2025: ✓
- Week 41, 2025: ○ (current week)
```

### In Week Ahead:
```
This Week's Goals:
┌─────────────────────────────────────────────┐
│ ○ Practice React patterns                   │
│   Study and implement 2-3 patterns          │
│   📚 Master React and TypeScript            │
│   🔄 Recurring Weekly                        │
│   ⭐ Linked to Milestone                     │
└─────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

**Don't see the features?**

1. **Refresh the page** (Ctrl+R / Cmd+R)
2. **Clear localStorage**: 
   - Open DevTools (F12)
   - Console tab
   - Type: `localStorage.clear()`
   - Refresh page
3. **Check you're looking at the right dream**:
   - "Master React and TypeScript" (has coach milestone in Bruce Banner's data)
   - NEW "Backpack Through Patagonia" (from template)
   - "Visit Machu Picchu" (updated in mock data)

**Still seeing old flat milestone list?**
- The component IS updated, but your existing dream data doesn't have `coachManaged: true`
- Create a new dream from template OR
- Manually add a milestone with the coach fields

---

## 📝 Next Steps (For Adding Your Own)

To add a coach milestone to ANY existing dream:
1. Open Dream Modal → Milestones tab
2. Add a regular milestone
3. (Future feature: Coach form to set it as coach-managed)
4. For now, it's in the data model but needs UI for coaches to create them

**Coming soon:** Coach UI to create consistency milestones directly!

---

**Last Updated:** October 6, 2025

