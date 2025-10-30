# 🔧 Quick Fix: 'func' is not recognized

## Problem
When running `npm start` in the `api` folder, you get:
```
'func' is not recognized as an internal or external command
```

## Solution: Install Azure Functions Core Tools

### Option 1: Using npm (Recommended for Windows)

```powershell
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

Wait for installation to complete (may take a few minutes), then:

```powershell
# Verify installation
func --version

# Should show something like: 4.x.x
```

### Option 2: Using Chocolatey (if you have it)

```powershell
choco install azure-functions-core-tools-4
```

### Option 3: Using MSI Installer

1. Download from: https://aka.ms/func-tools-4
2. Run the installer
3. Restart your terminal
4. Test: `func --version`

## After Installation

1. **Close and reopen your terminal** (important!)
2. Navigate back to the api folder:
   ```powershell
   cd C:\work\Dreamspace\api
   ```
3. Try starting again:
   ```powershell
   npm start
   ```

## Verify It Works

You should see:
```
Azure Functions Core Tools
Core Tools Version: 4.x.x
Function Runtime Version: 4.x.x

Functions:
  health: [GET] http://localhost:7071/api/health
  ...
```

## Still Having Issues?

If after installing you still get the error:

1. **Restart VS Code completely**
2. **Restart Windows** (to update PATH)
3. **Check PATH environment variable:**
   ```powershell
   $env:PATH -split ';' | Select-String func
   ```

## Alternative: Use the Full Setup Script

From the project root:
```powershell
.\scripts\setup-local-dev.ps1
```

This will check for all prerequisites and guide you through setup.

---

**After fixing this, continue with the normal startup:** `.\START_LOCAL_DEV.ps1`

