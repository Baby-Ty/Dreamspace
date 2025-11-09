# Disband Team Feature - Summary

## Overview
Added a new "Disband Team" option to the Replace Coach modal that allows disbanding an entire team, moving all team members and the coach to the unassigned pool.

## Problem Statement
Previously, when replacing a coach, you had to:
1. Select a new coach
2. Decide what to do with the old coach (move to unassigned or assign to another team)

But there was no option to simply disband the entire team and move everyone (coach + all members) to unassigned.

## Solution
Added a third option "Disband Team" that:
- Deletes the team entirely
- Demotes the coach to regular user
- Moves all team members to unassigned pool
- No need to select a replacement coach

---

## Changes Made

### 1. Frontend: ReplaceCoachModal Component

**File**: `src/components/ReplaceCoachModal.jsx`

#### Added New Option
```javascript
{/* Option 3: Disband Team */}
<div onClick={() => {
  setDemoteCoachOption('disband-team');
  setSelectedReplacementId(''); // Clear replacement selection
}}>
  <h4>Disband Team</h4>
  <p>Move <strong>all team members and coach</strong> to unassigned pool</p>
</div>
```

#### UI Changes
- **New radio button**: "Disband Team" option added to the coach demotion options
- **Icon**: Added `UserX` icon from Lucide React
- **Conditional rendering**: 
  - Hides "Select New Coach" section when disband is selected
  - Hides "New Team Name" input when disband is selected
  - Shows special preview for disband action

#### Preview Message (Disband)
```
What will happen:
• [Team Name] will be disbanded and deleted
• [Coach Name] will be demoted and move to unassigned pool
• All X team members will move to unassigned pool
• No replacement coach will be assigned
```

#### Button Text
- Changes from "Replace Coach" to "Disband Team" when disband option is selected
- Always enabled when disband is selected (no need for replacement coach)

### 2. Backend: replaceTeamCoach API

**File**: `api/replaceTeamCoach/index.js`

#### Updated Validation
```javascript
// For disband-team option, newCoachId can be null
if (demoteOption !== 'disband-team' && !newCoachId) {
  return error('New coach ID is required unless disbanding team');
}
```

#### New Disband Logic
```javascript
// SPECIAL CASE: Disband team - move everyone to unassigned
if (demoteOption === 'disband-team') {
  // 1. Demote coach to user
  const updatedOldCoach = {
    ...oldCoachUser,
    role: 'user',
    isCoach: false,
    assignedCoachId: null,
    assignedTeamName: null,
    demotedAt: new Date().toISOString()
  };
  
  // 2. Move all team members to unassigned
  for (const memberId of oldTeam.teamMembers) {
    // Clear their coach assignments
  }
  
  // 3. Delete the team
  await teamsContainer.item(oldTeam.id, oldTeam.managerId).delete();
  
  return {
    success: true,
    message: 'Team disbanded successfully',
    disbandedTeam: oldTeam.teamName,
    membersUnassigned: oldTeam.teamMembers.length + 1
  };
}
```

### 3. Frontend: PeopleDashboardLayout

**File**: `src/pages/people/PeopleDashboardLayout.jsx`

#### Enhanced Success Handler
```javascript
if (result.success) {
  if (demoteOption === 'disband-team') {
    showToast(`Team "${result.data?.disbandedTeam}" has been disbanded. All members moved to unassigned.`, 'success');
  } else {
    showToast('Coach replaced successfully', 'success');
  }
}
```

---

## User Flow

### Before (Replace Coach Only)
1. Click "Replace Coach" button
2. **Must** select a new coach
3. Choose what happens to old coach:
   - Move to unassigned
   - Assign to another team
4. Confirm replacement

### After (With Disband Option)
1. Click "Replace Coach" button
2. Choose action:
   - **Replace Coach** (original flow)
   - **Disband Team** (new option) ✨
3. If Disband Team selected:
   - No need to select replacement coach
   - See preview of what will happen
   - Confirm disbanding
4. Result: Team deleted, everyone moved to unassigned

---

## Technical Details

### Database Changes
- **Coach user document**: 
  - `role` changed from `'coach'` to `'user'`
  - `isCoach` set to `false`
  - `assignedCoachId` and `assignedTeamName` set to `null`
  - `demotedAt` timestamp added

- **Team member documents**:
  - `assignedCoachId` set to `null`
  - `assignedTeamName` set to `null`

- **Team document**:
  - Deleted entirely from `teams` container

### API Response (Disband)
```json
{
  "success": true,
  "message": "Team disbanded successfully",
  "disbandedTeam": "Tyler Stewart's Team",
  "membersUnassigned": 2,
  "timestamp": "2025-11-09T14:30:00.000Z"
}
```

---

## Testing Checklist

### UI Testing
- [ ] Disband Team option appears in Replace Coach modal
- [ ] Selecting Disband Team hides "Select New Coach" section
- [ ] Selecting Disband Team hides "New Team Name" input
- [ ] Preview shows correct disband message
- [ ] Button text changes to "Disband Team"
- [ ] Button is enabled when disband is selected

### Functionality Testing
- [ ] Clicking "Disband Team" successfully deletes the team
- [ ] Coach is demoted to user role
- [ ] Coach moves to unassigned pool
- [ ] All team members move to unassigned pool
- [ ] Success toast shows correct message
- [ ] People Hub refreshes and shows updated data
- [ ] Coach no longer appears in Coaches list
- [ ] Former team members appear in Unassigned list

### Edge Cases
- [ ] Disbanding team with 0 members works
- [ ] Disbanding team with 1 member works
- [ ] Disbanding team with many members works
- [ ] Error handling if team doesn't exist
- [ ] Error handling if coach doesn't exist

---

## Benefits

1. **Simpler Team Management**: No need to find a replacement coach just to disband a team
2. **Clean Slate**: Completely removes team structure when no longer needed
3. **Bulk Unassignment**: Move entire team to unassigned in one action
4. **Clear Intent**: Explicit "Disband Team" option makes the action obvious
5. **Better UX**: Less friction when restructuring teams

---

## Files Changed

| File | Changes | Lines |
|------|---------|-------|
| `src/components/ReplaceCoachModal.jsx` | Added disband option, conditional rendering | ~40 |
| `api/replaceTeamCoach/index.js` | Added disband logic, updated validation | ~80 |
| `src/pages/people/PeopleDashboardLayout.jsx` | Enhanced success handler with toast | ~15 |

**Total**: 3 files changed

---

## Screenshots Reference

### New Disband Team Option
Shows the third radio button option with UserX icon and description about moving everyone to unassigned.

### Preview (Disband Mode)
Shows blue preview box with:
- Team name will be disbanded and deleted
- Coach will be demoted and move to unassigned
- All X team members will move to unassigned
- No replacement coach assigned

---

**Implementation Date**: November 9, 2025  
**Status**: ✅ Complete - Ready for Testing  
**Feature Type**: Enhancement to existing Replace Coach functionality

