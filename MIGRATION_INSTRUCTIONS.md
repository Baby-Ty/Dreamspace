# Fix Legacy Templates - Migration Instructions

## Quick Start

### Step 1: Add Migration Panel to Dashboard

Open `src/pages/dashboard/DashboardLayout.jsx` and add the migration panel temporarily:

```javascript
// Add import at top
import AdminMigrationPanel from '../../components/AdminMigrationPanel';

// Add this component at the top of the dashboard (after header, before content)
<AdminMigrationPanel />
```

### Step 2: Run the Migration

1. Refresh your app
2. You'll see a yellow panel at the top
3. Click **"Check Templates"** to see which templates need fixing
4. Click **"Fix X Templates"** to apply the fix
5. Page will auto-refresh after successful fix

### Step 3: Clean Up

After migration is complete:

1. Remove `<AdminMigrationPanel />` from your dashboard
2. Delete these files:
   - `src/utils/fixLegacyTemplates.js`
   - `src/components/AdminMigrationPanel.jsx`
   - `MIGRATION_INSTRUCTIONS.md` (this file)

---

## What It Does

The migration:
- ✅ Finds templates with missing `dreamId`
- ✅ Matches them to dreams by `dreamTitle`
- ✅ Updates templates with correct `dreamId`
- ✅ Saves updated templates to database
- ✅ Refreshes page to show changes

---

## Alternative: Browser Console Method

If you prefer, run this in your browser console (F12):

```javascript
// Copy-paste this entire block
(async function() {
  const { currentUser, weeklyGoals } = window.__dreamspaceApp || {};
  
  if (!currentUser || !weeklyGoals) {
    console.error('❌ App context not available. Make sure you are logged in.');
    return;
  }
  
  const templatesNeedingFix = weeklyGoals.filter(g => 
    g.type === 'weekly_goal_template' && !g.dreamId && g.dreamTitle
  );
  
  console.log(`📋 Found ${templatesNeedingFix.length} templates to fix`);
  
  if (templatesNeedingFix.length === 0) {
    console.log('✅ All templates already have dreamId!');
    return;
  }
  
  console.table(templatesNeedingFix.map(t => ({
    title: t.title,
    dreamTitle: t.dreamTitle,
    hasDreamId: !!t.dreamId
  })));
  
  const confirmed = confirm(`Fix ${templatesNeedingFix.length} templates?`);
  if (!confirmed) return;
  
  // Import and run fix
  const { fixLegacyTemplates } = await import('./src/utils/fixLegacyTemplates.js');
  const result = await fixLegacyTemplates(
    currentUser.id,
    weeklyGoals,
    currentUser.dreamBook
  );
  
  console.log('✅ Migration complete:', result);
  
  if (result.fixed > 0) {
    console.log('🔄 Reloading page in 3 seconds...');
    setTimeout(() => window.location.reload(), 3000);
  }
})();
```

---

## Verification

After migration, verify all goals appear:

1. Open any dream in detailed view
2. Go to Goals tab
3. All goals should now be visible
4. Check browser console - should see no warnings about missing dreamId

---

## Troubleshooting

### "No templates need fixing"
- Your templates already have `dreamId` ✅
- No action needed

### "No dream found for template"
- Template's `dreamTitle` doesn't match any dream
- Manually check/update the dream title or template

### Error during save
- Check browser console for details
- May need to retry or fix manually

---

## Support

If issues persist:
1. Check browser console (F12) for detailed error messages
2. Verify you're logged in and data is loaded
3. Try the browser console method as alternative

