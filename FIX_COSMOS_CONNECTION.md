# Fix Cosmos DB Connection for Azure Functions

## Problem
Your Azure Functions are returning **500 Internal Server Error** because they can't connect to Cosmos DB. The environment variables `COSMOS_ENDPOINT` and `COSMOS_KEY` are not configured.

## Symptoms
- Console errors: `SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input`
- API endpoints returning 500 errors:
  - `POST https://dreamspace.tylerstewart.co.za/api/saveUserData/1`
  - `GET https://dreamspace.tylerstewart.co.za/api/getUserData/1`
- Data exists in Cosmos DB but isn't loading in the app

---

## Solution: Configure Environment Variables in Azure Portal

### Step 1: Get Cosmos DB Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Resource Groups** → `rg-dreamspace-prod-eastus`
3. Find and click on your **Cosmos DB account** (name starts with `cosmos-dreamspace-prod-`)
4. In the left menu, click **Keys**
5. Copy these two values:
   - **URI** (this is your `COSMOS_ENDPOINT`)
   - **PRIMARY KEY** (this is your `COSMOS_KEY`)

   Example:
   ```
   URI: https://cosmos-dreamspace-prod-20251020.documents.azure.com:443/
   PRIMARY KEY: [long key string]
   ```

6. Keep this window open - you'll need these values in the next step

---

### Step 2: Configure Static Web App (Most Likely Your Setup)

1. In the same resource group `rg-dreamspace-prod-eastus`
2. Find your **Static Web App** resource (look for type "Static Web App")
3. Click on it to open
4. In the left menu under **Settings**, click **Configuration**
5. You'll see a list of application settings
6. Click **+ Add** to add a new setting:
   
   **Setting 1:**
   - Name: `COSMOS_ENDPOINT`
   - Value: (paste the URI you copied from Step 1)
   - Click **OK**
   
   **Setting 2:**
   - Click **+ Add** again
   - Name: `COSMOS_KEY`
   - Value: (paste the PRIMARY KEY you copied from Step 1)
   - Click **OK**

7. Click **Save** at the top of the page
8. Click **Yes** to confirm
9. Wait 30-60 seconds for changes to apply

---

### Step 3: Restart Your App (Optional but Recommended)

**For Static Web App:**
1. In the Static Web App, click **Overview** in the left menu
2. Click **Restart** at the top
3. Wait for the status to show "Running"

**For Function App (if you have a separate one):**
1. Navigate to your Function App in the same resource group
2. Click **Overview** in the left menu
3. Click **Restart** at the top
4. Wait for the status to show "Running"

---

### Step 4: Verify the Fix

1. **Clear your browser cache**:
   - Press `Ctrl + Shift + Delete`
   - Select "Cached images and files"
   - Clear data

2. **Test the health endpoint**:
   - Open: https://dreamspace.tylerstewart.co.za/api/health
   - You should see: `{ "status": "healthy" }` or similar

3. **Refresh your app**:
   - Go to: https://dreamspace.tylerstewart.co.za
   - Log in as Sarah Johnson
   - Your data should now load from Cosmos DB!

4. **Check the console** (F12):
   - You should see: "✅ Cosmos DB data loaded: Found data"
   - No more 500 errors

---

## Alternative: If You're Using GitHub Actions Deployment

If your app deploys via GitHub Actions, you may need to add these as **GitHub Secrets**:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:
   - `COSMOS_ENDPOINT`: (your Cosmos DB URI)
   - `COSMOS_KEY`: (your Cosmos DB primary key)
4. Re-run your deployment workflow

---

## Troubleshooting

### Still getting 500 errors after configuration?

1. **Verify settings were saved**:
   - Go back to Configuration in Azure Portal
   - Check that `COSMOS_ENDPOINT` and `COSMOS_KEY` are listed
   - Values should show as "Hidden value. Click to show value"

2. **Check the values are correct**:
   - Click "Show value" on each setting
   - Verify the endpoint starts with `https://` and ends with `.documents.azure.com:443/`
   - Verify the key is a long base64-encoded string

3. **Check Function App logs**:
   - In Azure Portal, go to your Static Web App or Function App
   - Click **Log stream** in the left menu
   - Refresh your web app and watch for errors
   - Look for lines like "Database not configured" or "Error loading user data"

4. **Verify Cosmos DB containers exist**:
   - Go to your Cosmos DB account
   - Click **Data Explorer**
   - Expand the `dreamspace` database
   - You should see three containers:
     - `users` (partition key: `/userId`)
     - `items` (partition key: `/userId`)
     - `teams` (partition key: `/managerId`)

5. **Check Cosmos DB firewall**:
   - In Cosmos DB, click **Networking** in the left menu
   - Under **Firewall and virtual networks**:
     - Make sure "Allow access from Azure Portal" is checked
     - Make sure "Allow access from Azure services" is checked

---

## Summary Checklist

- [ ] Got Cosmos DB URI and PRIMARY KEY from Azure Portal
- [ ] Added `COSMOS_ENDPOINT` to Static Web App Configuration
- [ ] Added `COSMOS_KEY` to Static Web App Configuration
- [ ] Saved the configuration
- [ ] Restarted the app
- [ ] Cleared browser cache
- [ ] Tested health endpoint
- [ ] Verified data loads in the app
- [ ] No more 500 errors in console

---

## Need Help?

If you're still having issues:

1. Take a screenshot of:
   - Azure Portal → Static Web App → Configuration → Application settings
   - Browser console (F12) showing the errors
   - Azure Portal → Function App → Log stream (if available)

2. Check these common issues:
   - Typo in setting names (must be exactly `COSMOS_ENDPOINT` and `COSMOS_KEY`)
   - Missing `/` at the end of endpoint URL (should be `.documents.azure.com:443/`)
   - Using wrong key (use PRIMARY KEY, not PRIMARY CONNECTION STRING)
   - Firewall blocking access
   - App not restarted after configuration change

