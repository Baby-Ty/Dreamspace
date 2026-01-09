# Weekly Rollover Function - Troubleshooting Guide

## Issue: Function Not Showing Activity in Azure Portal

**Function**: `weeklyRollover`  
**Function App**: `func-dreamspace-prod`  
**Schedule**: Every Monday at 00:00 UTC (`0 0 * * 1`)

---

## ✅ Verification Steps Completed

1. ✅ **Function is deployed** - Confirmed via `func azure functionapp list-functions`
2. ✅ **Function App is running** - State: "Running", Enabled: true
3. ✅ **Function configuration exists** - `function.json` with timer trigger configured

---

## 🔍 Root Cause Analysis

### Most Likely Causes:

1. **Schedule Not Reached Yet** ⏰
   - Function only runs on **Mondays at 00:00 UTC**
   - If deployed recently, it may not have run yet
   - **Check**: What day/time was it deployed? When is the next Monday?

2. **Timer Triggers Disabled** 🚫
   - Azure Function Apps can have timer triggers disabled globally
   - **Check**: Azure Portal → Function App → Configuration → Application Settings
   - Look for: `AzureWebJobs.<FunctionName>.Disabled` or `WEBSITE_TIME_ZONE`

3. **Function App Scale-to-Zero** 💤
   - Consumption plan apps scale to zero when idle
   - Timer triggers should wake them, but there can be delays
   - **Check**: Function App → Overview → Status

4. **Application Insights Delay** 📊
   - Portal shows "Results may be delayed for up to 5 minutes"
   - But 30 days of no activity suggests a real issue

---

## 🛠️ Troubleshooting Steps

### Step 1: Check Function Status in Azure Portal

1. Go to: [Azure Portal](https://portal.azure.com)
2. Navigate to: **Function App** → `func-dreamspace-prod` → **Functions** → `weeklyRollover`
3. Check:
   - ✅ Function exists and shows `[timerTrigger]`
   - ✅ Status is "Enabled" (not "Disabled")
   - ✅ No error messages in the function overview

### Step 2: Verify Timer Schedule

1. In Azure Portal, go to: **Function App** → `func-dreamspace-prod` → **Functions** → `weeklyRollover` → **Integration**
2. Check the timer trigger configuration:
   - **Schedule**: Should show `0 0 * * 1`
   - **Status**: Should be "Enabled"
   - **Next Run**: Should show the next Monday at 00:00 UTC

### Step 3: Check Application Settings

1. Go to: **Function App** → `func-dreamspace-prod` → **Configuration** → **Application settings**
2. Look for:
   - `AzureWebJobs.weeklyRollover.Disabled` - Should NOT exist or be `false`
   - `WEBSITE_TIME_ZONE` - Should be set to `UTC` (or not set, defaults to UTC)
   - `FUNCTIONS_WORKER_RUNTIME` - Should be `node`

### Step 4: Check Logs

1. Go to: **Function App** → `func-dreamspace-prod` → **Functions** → `weeklyRollover` → **Logs**
2. Check for:
   - Any error messages
   - Timer trigger initialization messages
   - Execution logs (if any runs occurred)

### Step 5: Check Application Insights

1. Go to: **Function App** → `func-dreamspace-prod` → **Functions** → `weeklyRollover` → **Monitor**
2. Click: **Open in Application Insights**
3. Check:
   - **Traces** - Look for timer trigger events
   - **Exceptions** - Check for any errors
   - **Metrics** - Check invocation count

### Step 6: Manually Test the Function

Since timer functions can't be directly triggered via HTTP, you can:

**Option A: Temporarily Change Schedule for Testing**

1. Edit `api/weeklyRollover/function.json`:
   ```json
   {
     "bindings": [
       {
         "name": "timer",
         "type": "timerTrigger",
         "direction": "in",
         "schedule": "0 */5 * * * *",  // Every 5 minutes for testing
         "runOnStartup": true,          // Run immediately on deployment
         "useMonitor": true
       }
     ]
   }
   ```

2. Deploy:
   ```bash
   cd api
   func azure functionapp publish func-dreamspace-prod
   ```

3. Monitor for activity (should run within 5 minutes)

4. **IMPORTANT**: Revert to original schedule after testing:
   ```json
   "schedule": "0 0 * * 1",
   "runOnStartup": false
   ```

**Option B: Use Test Function**

There's a test function available: `testWeekRollover`
- URL: `https://func-dreamspace-prod.azurewebsites.net/api/testweekrollover/{userid?}`
- This can help verify the rollover logic works

---

## 🔧 Common Fixes

### Fix 1: Enable Timer Triggers Globally

If timer triggers are disabled:

1. Azure Portal → Function App → **Configuration** → **General settings**
2. Ensure **Always On** is enabled (for Consumption plan, this may not be available)
3. Check **Platform features** → **Function app settings** → **Runtime version**

### Fix 2: Verify Time Zone

1. Azure Portal → Function App → **Configuration** → **Application settings**
2. Add/Update: `WEBSITE_TIME_ZONE` = `UTC`
3. Save and restart the Function App

### Fix 3: Redeploy Function

Sometimes a redeploy fixes timer trigger issues:

```bash
cd api
func azure functionapp publish func-dreamspace-prod
```

### Fix 4: Check Function App Plan

1. Azure Portal → Function App → **Overview**
2. Check **App Service Plan / Pricing tier**
3. Ensure it's not in a stopped state
4. For Consumption plans, ensure billing is enabled

---

## 📅 Schedule Verification

**Current Schedule**: `0 0 * * 1` (Every Monday at 00:00 UTC)

**Cron Expression Breakdown**:
- `0` - Minute (0)
- `0` - Hour (0 = midnight)
- `*` - Day of month (any)
- `*` - Month (any)
- `1` - Day of week (1 = Monday)

**Next Run Calculation**:
- Today's date: Check current date/time
- Next Monday: Calculate next Monday at 00:00 UTC
- If it's Tuesday-Sunday, the function won't run until next Monday

**To verify next run time**:
1. Azure Portal → Function App → `weeklyRollover` → **Integration**
2. Check the "Next run" time shown in the timer trigger configuration

---

## 🚨 If Still Not Working

### Check Function App Logs

1. Azure Portal → Function App → **Log stream**
2. Look for timer trigger initialization messages
3. Check for any errors during startup

### Check Kudu/SCM Site

1. Go to: `https://func-dreamspace-prod.scm.azurewebsites.net`
2. Navigate to: **Debug console** → **CMD** → **site** → **wwwroot**
3. Verify `weeklyRollover` folder exists with:
   - `function.json`
   - `index.js`

### Contact Azure Support

If none of the above work:
1. Collect:
   - Function App name: `func-dreamspace-prod`
   - Function name: `weeklyRollover`
   - Timeframe of issue
   - Screenshots of portal showing no invocations
2. Open a support ticket in Azure Portal

---

## ✅ Success Indicators

Once working, you should see:

1. **In Azure Portal** → **Invocations**:
   - Success count > 0 (on Mondays)
   - Invocation entries showing Monday 00:00 UTC runs

2. **In Logs**:
   - "🔄 Weekly Rollover Timer Triggered"
   - "📋 Found X users to process"
   - "📊 Weekly Rollover Complete"

3. **In Application Insights**:
   - Timer trigger events
   - Function execution traces
   - No exceptions

---

## 📝 Notes

- Timer triggers in Azure Functions use UTC time by default
- Consumption plan apps may have slight delays (up to 5 minutes)
- Timer triggers require the Function App to be running (not stopped)
- The function will only show activity after it actually runs (next Monday)

---

**Last Updated**: Based on current investigation  
**Status**: Function deployed and Function App running - likely waiting for next scheduled run
