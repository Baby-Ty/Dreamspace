# Roles Analysis Report

**Generated:** 2026-01-12  
**Analysis:** Current role system and consolidation recommendations

---

## 🔍 Current Roles System

Your app has **4 role checkboxes** in the UI:
1. ✅ **Admin**
2. ✅ **Coach** 
3. ✅ **Employee**
4. ✅ **People**

---

## 📊 What Each Role Actually Does

### 1. **Admin Role** - ✅ ACTIVELY USED

**Backend Permissions (API Endpoints):**
- ✅ `assignUserToCoach` - Assign users to coaching teams
- ✅ `unassignUserFromTeam` - Remove users from teams
- ✅ `promoteUserToCoach` - Promote users to coach role
- ✅ `replaceTeamCoach` - Replace team coaches
- ✅ `cleanupTeams` - Cleanup invalid teams (utility)
- ✅ `deleteInvalidTeam` - Delete invalid teams (utility)
- ✅ `upgradeUserToV3` - Upgrade user data structure (migration)
- ✅ `savePrompts` - Modify AI prompts
- ✅ `getPromptHistory` - View AI prompt history
- ✅ `restorePrompt` - Restore deleted AI prompts

**Frontend:**
- Can access all features (no restrictions)
- People Hub is labeled "Admin" in navigation

**Summary:** Admin can manage users, teams, and AI prompts. **This is the primary administrative role.**

---

### 2. **Coach Role** - ✅ ACTIVELY USED

**Backend Permissions:**
- Has access to team member data via `requireCoach` middleware
- Can view their team's information
- Can add coach notes to team member dreams

**Frontend:**
- Unlocks Dream Team features
- Can view and manage their assigned team members

**Summary:** Coach role is for team leaders managing their assigned members. **This role is actively used.**

---

### 3. **Employee Role** - ⚠️ DEFAULT, NOT ENFORCED

**Backend Permissions:**
- ❌ No backend checks for "employee" role
- ❌ No API endpoints require this role

**Frontend:**
- ❌ No UI elements check for this role
- Everyone gets this role by default

**Summary:** This is just a **label** with no actual permissions. Appears to be "everyone is an employee" default.

---

### 4. **People Role** - ❌ COMPLETELY UNUSED

**Backend Permissions:**
- ❌ No API endpoints check for "people" role
- ❌ No `requirePeople` function exists in auth middleware
- ❌ Zero references in backend code

**Frontend:**
- ❌ No UI elements check for this role
- ❌ Navigation doesn't filter by this role
- People Hub is labeled "Admin" (not "People")

**Summary:** **This role does NOTHING.** It's completely unused in both frontend and backend.

---

## 🎯 Navigation & Access Control

### Current Navigation (Layout.jsx)
```javascript
const activeNavigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Dream Book', href: '/dream-book', icon: BookOpen },
  { name: 'Dream Team', href: '/dream-team', icon: UserPlus },
  { name: 'People Hub', href: '/people', icon: UserCog, roleLabel: 'Admin' },
];
```

**Issues:**
1. ⚠️ **No role filtering** - All links visible to everyone
2. ⚠️ People Hub says "Admin" but there's **no check**
3. ⚠️ Anyone can navigate to `/people` (no protection)

---

## 💡 Recommendations

### **Option 1: Merge "People" into "Admin" (RECOMMENDED)**

**Actions:**
1. ✅ **Remove "People" checkbox** from EditUserModal
2. ✅ Keep only: Admin, Coach, Employee
3. ✅ People Hub = Admin access only
4. ✅ Update navigation to check roles

**Benefits:**
- Simpler role system
- Clear permission model
- Remove unused code

**Implementation:**
```javascript
// In Layout.jsx - Add role filtering
const canAccessPeopleHub = user?.role === 'admin';

const activeNavigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Dream Book', href: '/dream-book', icon: BookOpen },
  { name: 'Dream Team', href: '/dream-team', icon: UserPlus },
  ...(canAccessPeopleHub ? [
    { name: 'People Hub', href: '/people', icon: UserCog, roleLabel: 'Admin' }
  ] : []),
];
```

---

### **Option 2: Keep "People" as Separate Role (NOT RECOMMENDED)**

If you want "People" to be distinct from "Admin":

**Actions:**
1. ⚠️ Create `requirePeople` function in authMiddleware
2. ⚠️ Add "People" checks to API endpoints
3. ⚠️ Add role filtering in navigation
4. ⚠️ Define what "People" role can do vs "Admin"

**Issues:**
- More complexity
- Need to define new permission boundaries
- Currently no use case for this distinction

---

## 🔧 Recommended Changes

### **Phase 1: Simplify Role System**

**1. Remove "People" Role from UI**

Update `src/components/EditUserModal.jsx`:
```jsx
// BEFORE (4 checkboxes)
<input type="checkbox" checked={formData.roles.admin} />
<input type="checkbox" checked={formData.roles.coach} />
<input type="checkbox" checked={formData.roles.employee} />
<input type="checkbox" checked={formData.roles.people} />  // <- REMOVE THIS

// AFTER (3 checkboxes)
<input type="checkbox" checked={formData.roles.admin} />
<input type="checkbox" checked={formData.roles.coach} />
<input type="checkbox" checked={formData.roles.employee} />
```

**2. Add Navigation Role Filtering**

Update `src/components/Layout.jsx`:
```jsx
const { user } = useAuth();
const isAdmin = user?.role === 'admin';
const isCoach = user?.role === 'coach' || user?.role === 'admin';

const activeNavigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Dream Book', href: '/dream-book', icon: BookOpen },
  ...(isCoach ? [
    { name: 'Dream Team', href: '/dream-team', icon: UserPlus },
  ] : []),
  ...(isAdmin ? [
    { name: 'People Hub', href: '/people', icon: UserCog, roleLabel: 'Admin' },
  ] : []),
];
```

**3. Add Route Protection (Optional but Recommended)**

Add role check in `PeopleDashboardLayout.jsx`:
```jsx
import { useAuth } from '../../context/AuthContext';

const PeopleDashboardLayout = () => {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
        <p className="text-gray-600">You need admin privileges to access People Hub.</p>
      </div>
    );
  }
  
  // ... rest of component
};
```

---

### **Phase 2: Clean Database (Optional)**

Update existing user profiles to remove "people" flag:
```javascript
// Migration script to clean up roles object
roles: {
  admin: user.roles.admin || false,
  coach: user.roles.coach || false,
  employee: user.roles.employee !== false,
  // people: REMOVED
}
```

---

## 📋 Summary

| Role | Used in Backend? | Used in Frontend? | Recommendation |
|------|------------------|-------------------|----------------|
| **Admin** | ✅ Yes (10 endpoints) | ✅ Yes | **KEEP** - Primary admin role |
| **Coach** | ✅ Yes (team access) | ✅ Yes (Dream Team) | **KEEP** - Team management |
| **Employee** | ❌ No | ❌ No | **KEEP** - Default/label only |
| **People** | ❌ No | ❌ No | **REMOVE** - Completely unused |

---

## 🎯 Final Recommendation

**Merge "People" into "Admin":**
- Remove the "People" checkbox from Edit User modal
- Keep: Admin, Coach, Employee (3 roles)
- Add navigation filtering so only admins see People Hub
- Optionally add route protection for `/people` path

**Impact:**
- Simpler system (3 roles instead of 4)
- Clear permission model
- No behavior change (since "People" does nothing currently)
- Better security (role-based navigation)

---

**Would you like me to implement these changes?**
