# Vision Builder Integration Guide

## Overview
The Vision Builder Demo generates properly structured Dreams, Milestones, and Vision Bios that are **100% compatible** with the existing DreamSpace app architecture.

**Status:** ✅ Demo Complete - Ready for Integration  
**Date:** October 11, 2025  
**Related Docs:** VISION_BUILDER_DEMO.md, MILESTONE_GOALS_IMPLEMENTATION.md

---

## Generated Data Structures

### 1. Dreams
Vision Builder creates Dreams matching the `DreamSchema` from `src/schemas/dream.js`:

```javascript
{
  id: number,                    // Unique timestamp-based ID
  title: string,                 // e.g., "Stick to gym routine"
  category: string,              // e.g., "Health", "Career", "Learning"
  description: string,           // The "why" from dream templates
  progress: 0,                   // Starts at 0%
  milestones: Milestone[],       // Array of configured milestones
  notes: [],                     // Empty initially
  history: [],                   // Empty initially
  createdAt: ISO string,         // Creation timestamp
  updatedAt: ISO string          // Update timestamp
}
```

### 2. Milestones
Each Dream includes coach-managed milestones matching `MilestoneSchema`:

```javascript
{
  id: number,                    // Unique ID
  text: string,                  // Milestone title (uses dream title)
  completed: false,              // Not completed yet
  createdAt: ISO string,         // Creation timestamp
  coachManaged: true,            // Coach-managed consistency tracking
  type: 'consistency' | 'deadline' | 'general',
  targetWeeks: number,           // Default 12 weeks for consistency
  startDate: ISO string,         // When tracking starts
  endOnDreamComplete: false,     // Continues until manually ended
  streakWeeks: 0                 // Consecutive weeks met (starts at 0)
}
```

**Milestone Types:**
- **Consistency**: Track "X times per week/month" for N weeks (e.g., gym 3x/week for 12 weeks)
- **Deadline**: Target date with periodic check-ins (e.g., milestone every 2 weeks)
- **General**: Flexible completion, manually marked complete

### 3. Vision Bio
Generated as a casual, personalized story for user profiles:

```javascript
"This year, I'm all about growth and leveling up. My focus? health, learning, and career."
```

**Format:**
- Vibe-based intro (Reset, Grow, Launch, Explore, Level Up)
- Theme focus (top 3 selected themes)
- Casual, first-person tone

---

## Integration Flow

### Phase 1: Save Dreams to DreamBook (Priority)

1. **Access generated data:**
```javascript
const dreamsForApp = generateDreamsForApp();
const visionBio = generateVisionBio();
```

2. **Add to AppContext:**
```javascript
// In AppContext or after completion
dreamsForApp.forEach(dream => {
  addDream(dream); // Use existing addDream() function
});
```

3. **Save vision bio:**
```javascript
// Add to user profile or as a note on first dream
updateUser({ visionBio });
```

### Phase 2: Navigate to Week Ahead

After saving, redirect user to `DreamsWeekAhead` page:
```javascript
navigate('/dreams/week-ahead');
```

**Why:** Users can immediately:
- See their new Dreams
- Create weekly goals for each milestone
- Start tracking progress

### Phase 3: Auto-Generate Weekly Goals (Optional)

For consistency milestones, optionally create initial weekly goals:

```javascript
dream.milestones.forEach(milestone => {
  if (milestone.type === 'consistency') {
    const weeklyGoal = {
      id: Date.now(),
      title: dream.title, // e.g., "Stick to gym routine"
      description: dream.description,
      dreamId: dream.id,
      dreamTitle: dream.title,
      dreamCategory: dream.category,
      completed: false,
      milestoneId: milestone.id,
      recurrence: 'weekly',
      active: true,
      weekLog: {}, // Empty, user tracks weekly
      createdAt: new Date().toISOString()
    };
    
    addWeeklyGoal(weeklyGoal);
  }
});
```

---

## Data Logged to Console

When user clicks "Start My Year", the following is logged:

```javascript
console.log('=== VISION BUILDER OUTPUT ===');
console.log('Vision Bio:', visionBio);
console.log('Dreams:', dreamsForApp);
console.log('Raw Selections:', selections);
console.log('============================');
```

**Structure:**
- `visionBio` (string): User's personalized vision statement
- `dreamsForApp` (array): 3 properly formatted Dream objects
- `selections` (object): Raw user selections (vibe, themes, aspirations, dreams, milestones)

---

## Example Output

### User Selections:
- **Vibe:** Grow
- **Themes:** Health, Learning, Career
- **Dreams:** 
  1. Stick to gym routine (Health)
  2. Master React & TypeScript (Learning)
  3. Lead a high-impact project (Career)

### Generated Dreams:
```javascript
[
  {
    id: 1728678901234,
    title: "Stick to gym routine",
    category: "Health",
    description: "3x/week strength & cardio",
    progress: 0,
    milestones: [
      {
        id: 1728678901235,
        text: "Stick to gym routine",
        completed: false,
        createdAt: "2025-10-11T22:45:01.234Z",
        coachManaged: true,
        type: "consistency",
        targetWeeks: 12,
        startDate: "2025-10-11T22:45:01.234Z",
        endOnDreamComplete: false,
        streakWeeks: 0
      }
    ],
    notes: [],
    history: [],
    createdAt: "2025-10-11T22:45:01.234Z",
    updatedAt: "2025-10-11T22:45:01.234Z"
  },
  // ... 2 more dreams
]
```

### Vision Bio:
```
"This year, I'm all about growth and leveling up. My focus? health, learning, and career."
```

---

## Integration Checklist

### Immediate (Demo → Production):
- [ ] Connect "Start My Year" button to `addDream()` in AppContext
- [ ] Save `visionBio` to user profile
- [ ] Navigate to `/dreams/week-ahead` after completion
- [ ] Test with various selections (consistency, deadline, general milestones)

### Phase 2 (Enhanced UX):
- [ ] Auto-generate initial weekly goals for consistency milestones
- [ ] Add onboarding tooltip in Week Ahead: "Create weekly goals for your new Dreams!"
- [ ] Show success toast with link to DreamBook
- [ ] Add "Edit Vision" option in settings

### Phase 3 (Optional Enhancements):
- [ ] Save full `selections` object for future editing
- [ ] Add ability to re-run vision builder (update existing dreams vs. create new)
- [ ] AI-powered dream suggestions based on past user behavior
- [ ] Progress emails: "You're 4 weeks into your gym routine streak!"

---

## Technical Notes

### Schema Compliance
All generated data is validated against existing Zod schemas:
- `DreamSchema` (src/schemas/dream.js)
- `MilestoneSchema` (src/schemas/dream.js)
- `WeeklyGoalSchema` (src/schemas/person.js)

### ID Generation
Uses `Date.now()` with index offset to ensure unique IDs:
```javascript
id: Date.now() + index * 1000
```

**Note:** In production, use your database's ID generation (Cosmos DB generates IDs automatically).

### Milestone Configuration Captured
The inline configuration is saved to milestone objects:
- **Consistency:** `frequency`, `period` (week/month), `targetWeeks`
- **Deadline:** `frequency`, `period` (day/week/month), `targetDate`
- **General:** No additional config needed

---

## User Flow After Vision Builder

1. **Complete Vision Builder** → Generates 3 Dreams + Milestones
2. **"Start My Year"** → Dreams saved to DreamBook
3. **Navigate to Week Ahead** → User sees new Dreams
4. **Create Weekly Goals** → User sets up recurring tasks
5. **Track Progress** → Weekly check-ins log completion
6. **View in DreamBook** → Full dream details, milestone progress

---

## Files Modified

### Core Implementation:
- `src/pages/VisionBuilderDemo.jsx` - Main demo component
  - `generateDreamsForApp()` - Converts selections to Dream objects
  - `generateVisionBio()` - Creates personalized bio
  - `generateDreamStory()` - Generates casual story for review page

### Integration Points:
- `src/context/AppContext.jsx` - Use `addDream()` to save
- `src/pages/DreamsWeekAhead.jsx` - Landing page after completion
- `src/pages/Dashboard.jsx` - Entry point with "Try Demo" button

---

## Success Metrics

Once integrated, track:
- **Completion Rate:** % of users who finish vision builder
- **Dream Creation:** Avg dreams created per user via vision builder
- **Milestone Setup:** % of dreams with milestones configured
- **Weekly Goal Creation:** % of users who create goals after vision builder
- **Retention:** Do users with vision builder-created dreams have higher engagement?

---

## Next Steps

1. **Test the demo** - Complete flow from start to finish
2. **Review console output** - Verify data structure
3. **Integrate with AppContext** - Connect save functionality
4. **Deploy to staging** - Test with real users
5. **Monitor & iterate** - Gather feedback, improve flow

---

## Questions?

See related documentation:
- `VISION_BUILDER_DEMO.md` - UI/UX design details
- `MILESTONE_GOALS_IMPLEMENTATION.md` - Milestone & weekly goal architecture
- `SCHEMA_IMPLEMENTATION.md` - Data validation details

