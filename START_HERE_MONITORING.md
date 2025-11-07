# 🎯 START HERE: Azure Monitoring Setup

**Simple 3-step setup to monitor your DreamSpace site in Azure.**

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Run PowerShell Script
```powershell
.\docs-deployment\SETUP_MONITORING.ps1 `
  -ResourceGroup "dreamspace-rg" `
  -FunctionAppName "YOUR_FUNCTION_APP_NAME" `
  -AlertEmail "your@email.com"
```

**💡 The script will:**
- Create Application Insights in Azure
- Connect your API to monitoring
- Set up email alerts
- Give you a connection string (copy this!)

---

### Step 2: Install & Configure
```bash
# Install the monitoring package
npm install

# Add connection string to Azure Portal:
# Static Web App → Configuration → Application settings
# Name: VITE_APPINSIGHTS_CONNECTION_STRING
# Value: [paste connection string from step 1]
```

---

### Step 3: Deploy & Verify
```bash
# Build and deploy
npm run build
# (then deploy to Azure)

# Verify it's working:
# 1. Visit your site
# 2. Open browser console (F12)
# 3. Look for: ✅ Application Insights initialized
# 4. Azure Portal → Application Insights → Live Metrics
```

---

## ✅ That's It!

Your site is now being monitored. You can:

- **See real-time activity:** Azure Portal → Application Insights → Live Metrics
- **View errors:** Failures tab
- **Check performance:** Performance tab
- **Run queries:** Logs tab

---

## 📚 Need More Info?

| What You Need | Where to Go |
|---------------|-------------|
| Step-by-step checklist | `MONITORING_CHECKLIST.md` |
| Detailed guide | `docs-deployment/README_MONITORING.md` |
| Quick reference | `docs-deployment/MONITORING_CHEATSHEET.md` |
| Code examples | `docs-deployment/MONITORING_USAGE_EXAMPLES.md` |
| All documentation | `docs-deployment/MONITORING_INDEX.md` |

---

## 🔍 What Gets Monitored?

✅ **Automatically tracked (no code changes needed):**
- API requests & responses
- Errors & exceptions
- Page views & navigation
- Database queries
- Performance metrics

📊 **Optional custom tracking:**
- Business events (dreams created, goals completed)
- Feature usage
- Custom metrics

---

## 💰 Cost

**FREE** for most small-to-medium apps
- First 5 GB/month: FREE
- Typical usage: 1-3 GB/month

---

## 🆘 Troubleshooting

**No data showing?**
- Wait 2-5 minutes
- Check Live Metrics (real-time)

**Console warning?**
- Verify `VITE_APPINSIGHTS_CONNECTION_STRING` is set
- Restart app after adding env var

**Script fails?**
- Run `az login` first
- Verify resource names are correct

---

## 📊 View Monitoring in Azure

**URL:** https://portal.azure.com

1. Search for "Application Insights"
2. Click your app (ends with `-insights`)
3. Check these tabs:
   - **Live Metrics** - Real-time
   - **Failures** - Errors
   - **Performance** - Speed
   - **Logs** - Custom queries

---

## 🎉 You're Done!

Run the script and follow the 3 steps above. You'll have full monitoring in about 5 minutes.

**Questions?** Check `docs-deployment/MONITORING_INDEX.md` for all documentation.

---

**Ready?** Run `.\docs-deployment\SETUP_MONITORING.ps1` now! 🚀

