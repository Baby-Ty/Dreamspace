# Vision Builder - "Milestones" to "Goals" Update

## Summary
Updated the Vision Builder Demo to use "Goals" terminology instead of "Milestones" and added the ability for users to enter custom goal titles for all goal types.

## Changes Made

### 1. Terminology Updates
**Changed from "Milestones" to "Goals" throughout the Vision Builder:**

- Step title changed from "Milestones" to "Goals"
- Page heading changed from "How will you track progress?" / "Choose a milestone pattern" to "Set up your goals" / "Choose how you want to track each Dream"
- Variable names updated:
  - `milestonePatterns` → `goalPatterns`
  - `selectedMilestone` → `selectedGoal`
  - Comments updated to reference "goals" instead of "milestones"

### 2. Custom Goal Title Input Fields
**Added goal title input fields for all three goal types:**

#### Consistency Goals
- New "Goal Title" input field at the top of the Consistency Settings section
- Placeholder: "e.g., Practice Spanish daily"
- Allows users to customize the goal name separate from the dream name

#### Deadline Goals
- New "Goal Title" input field in Deadline Goal Settings
- Placeholder: "e.g., Complete Spanish course"
- Changed "Milestone every" to "Check-in every" for clarity

#### General Goals
- New "Goal Title" input field in General Goal section
- Placeholder: "e.g., Become fluent in Spanish"
- Updated description text

### 3. Goal Generation Updates
**Modified `generateDreamsForApp()` function:**

```javascript
title: goalPattern.goalTitle || dream.title, // Use custom goal title if provided, otherwise dream title
```

- Goals now use the custom `goalTitle` if entered by the user
- Falls back to dream title if no custom title is provided
- Ensures the custom goal title is saved and used throughout the app

### 4. Review Page Updates
**Enhanced the Review page to display custom goal titles:**

- Shows the custom goal title separately from the dream title if different
- Displays as: "Goal: [Custom Goal Title]" with a target icon
- Updated terminology from "milestone" to "goal" in descriptions
- Changed "Milestone every" to "Check-in every" for deadline goals

## User Experience Improvements

### Before
- Users could only track goals using the dream name
- Terminology was confusing ("Milestones" vs "Goals")
- Example: Dream "Conversational Spanish" would create a goal also called "Conversational Spanish"

### After
- Users can enter custom goal titles separate from dream names
- Clear "Goals" terminology throughout
- Example: Dream "Conversational Spanish" can have a goal called "Practice Spanish 20 minutes daily"
- More flexible and expressive goal naming

## Technical Details

### Data Structure
Goals now store an optional `goalTitle` field:

```javascript
{
  type: 'consistency',
  goalTitle: 'Practice Spanish 20 minutes daily', // NEW: Custom goal title
  frequency: 1,
  period: 'week',
  targetWeeks: 12
}
```

### Backward Compatibility
- Falls back to dream title if `goalTitle` is not provided
- Existing functionality preserved for users who don't customize the title

## Files Modified
- ✅ `src/pages/VisionBuilderDemo.jsx`
  - Updated step titles (line 54)
  - Renamed `milestonePatterns` to `goalPatterns` (line 150)
  - Updated `renderMilestones()` function (lines 633-840)
  - Added goal title inputs for all goal types
  - Updated `generateDreamsForApp()` to use custom goal titles (line 943)
  - Enhanced review page display (lines 1129-1149)

## Testing Checklist
- [ ] Step title shows "Goals" instead of "Milestones"
- [ ] Page heading shows "Set up your goals"
- [ ] All three goal type buttons work (Consistency, Deadline, General)
- [ ] Goal title input appears for Consistency goals
- [ ] Goal title input appears for Deadline goals
- [ ] Goal title input appears for General goals
- [ ] Custom goal title saves and displays in Review page
- [ ] Goal title defaults to dream title if not customized
- [ ] Generated goals use the custom title in Week Ahead
- [ ] No linter errors

## Tracking Logic Update (Latest Change)

### ✅ Fixed: Consistency Goal Tracking
**Changed from tracking frequency TO tracking duration:**

**Before (WRONG):**
- "Track **2 times per** Week"
- Implied counting how many times the goal was done per week

**After (CORRECT):**
- "Track for **12 Weeks**"
- Simply tracks IF the goal was done that week (not how many times)

### Implementation Details
- Removed "times per" frequency counter
- Changed to "Track for [X] Weeks/Months"
- Counter now represents DURATION (how long to track)
- Default: 12 weeks for weekly goals, 6 months for monthly goals
- Description updated: "Track weekly for 12 weeks" or "Track monthly for 6 months"
- Helper text: "Goal will be tracked once per week/month for the duration"

### User Experience
**Weekly Goals:**
- User sets: "Track for 12 Weeks"
- Result: Goal appears in each of the next 12 weeks
- Each week is marked complete/incomplete (not a count)

**Monthly Goals:**
- User sets: "Track for 6 Months"
- Result: Goal appears once per month for 6 months
- Each month is marked complete/incomplete (not a count)

## Status
✅ All changes implemented
✅ Tracking logic corrected
✅ No linter errors
⏳ Ready for testing

