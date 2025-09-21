# 🚀 DreamSpace Azure Deployment Steps

Follow these steps in order to deploy your DreamSpace application to Azure.

## ✅ Prerequisites Completed
- [x] Code pushed to GitHub
- [x] Azure deployment configuration files created
- [x] GitHub Actions workflow updated

## 🎯 Step 1: Create Azure Static Web App

### Using Azure Portal (Recommended):

1. **Go to Azure Portal**: https://portal.azure.com
2. **Create Resource**: Click "Create a resource" (+ icon)
3. **Search**: Type "Static Web App" and select it
4. **Click**: "Create"

### Configuration:
```
Basics:
├── Subscription: [Your Azure subscription]
├── Resource Group: "dreamspace-rg" (create new)
├── Name: "dreamspace-app"
├── Plan type: "Free"
└── Region: "East US 2"

Deployment:
├── Source: "GitHub"
├── GitHub Account: [Sign in when prompted]
├── Organization: [Your GitHub username]
├── Repository: "Dreamspace"
└── Branch: "main"

Build Details:
├── Build Presets: "React"
├── App location: "/"
├── Api location: [leave empty]
└── Output location: "dist"
```

5. **Click**: "Review + create" → "Create"

⏱️ **Wait**: 2-3 minutes for deployment to complete

---

## 🔑 Step 2: Configure GitHub Secret

### Option A: Using PowerShell Script (Recommended)
```powershell
# Run this in PowerShell from your project directory
cd "C:\Users\email\OneDrive\Documents\Dreams Program\Dreamspace\Dreamspace"
.\scripts\get-deployment-info.ps1
```

### Option B: Manual Steps
1. **Azure Portal**: Go to your new Static Web App
2. **Get Token**: Overview → "Manage deployment token" → Copy
3. **GitHub**: Go to https://github.com/Baby-Ty/Dreamspace
4. **Settings**: Settings → Secrets and variables → Actions
5. **Add Secret**: 
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: [paste deployment token]
6. **Save**: Click "Add secret"

---

## 🗄️ Step 3: Set Up Database (Optional but Recommended)

### Using PowerShell Script:
```powershell
# Run this in PowerShell
cd "C:\Users\email\OneDrive\Documents\Dreams Program\Dreamspace\Dreamspace"
.\scripts\setup-cosmos-db.ps1 -ResourceGroupName "dreamspace-rg"
```

### Manual Steps:
1. **Azure Portal**: Create Resource → "Azure Cosmos DB"
2. **API**: Select "Core (SQL)"
3. **Configure**:
   - Account Name: `dreamspace-cosmos-[random]`
   - Resource Group: `dreamspace-rg`
   - Location: Same as Static Web App
   - Apply Free Tier: ✅ Yes
4. **Create**: Database `dreamspace`, Container `users`
5. **Partition Key**: `/userId`

---

## ⚙️ Step 4: Configure Environment Variables

1. **Azure Portal**: Go to your Static Web App
2. **Configuration**: Configuration → Application settings
3. **Add Settings**:
   ```
   VITE_COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
   VITE_COSMOS_KEY=your-cosmos-primary-key
   VITE_APP_ENV=production
   ```

---

## 🔐 Step 5: Update Azure AD Configuration

1. **Azure Portal**: Microsoft Entra ID → App registrations
2. **Find App**: `ebe60b7a-93c9-4b12-8375-4ab3181000e8`
3. **Authentication**: Add redirect URI
4. **New URI**: `https://dreamspace-app.azurestaticapps.net`
5. **Logout URI**: Same URL

---

## 🧪 Step 6: Test Deployment

### Trigger Deployment:
```bash
# Make a small change and push
echo "# Deployment test" >> README.md
git add README.md
git commit -m "Trigger Azure deployment"
git push origin main
```

### Monitor:
1. **GitHub**: Actions tab → Watch deployment progress
2. **Azure Portal**: Static Web App → GitHub Actions

### Test:
1. **Visit**: Your Static Web App URL
2. **Login**: Test Azure AD authentication
3. **Create**: Add a dream and verify it saves
4. **Refresh**: Verify data persists

---

## 📊 Deployment Status Checklist

- [ ] Azure Static Web App created
- [ ] GitHub secret configured
- [ ] Cosmos DB set up (optional)
- [ ] Environment variables added
- [ ] Azure AD redirect URIs updated
- [ ] Deployment successful
- [ ] Authentication working
- [ ] Data persistence working

---

## 🆘 Troubleshooting

### Deployment Fails:
- Check GitHub Actions logs
- Verify GitHub secret is correct
- Ensure build settings match

### Authentication Issues:
- Verify redirect URIs in Azure AD
- Check browser console for errors
- Ensure HTTPS is used

### Database Issues:
- Verify Cosmos DB connection strings
- Check environment variables
- Monitor Cosmos DB metrics

---

## 💰 Cost Summary

**Free Tier (First Month):**
- Static Web Apps: Free (100GB bandwidth)
- Cosmos DB: Free (400 RU/s, 5GB storage)
- Azure AD: Free (50k users/month)
- **Total**: $0

**After Free Tier:**
- Static Web Apps Standard: ~$9/month
- Cosmos DB (400 RU/s): ~$24/month
- **Total**: ~$33/month

---

## 🎉 Success!

Once all steps are complete, your DreamSpace application will be:
- ✅ Deployed to Azure Static Web Apps
- ✅ Automatically deployed on every GitHub push
- ✅ Using Azure AD for authentication
- ✅ Persisting data in Azure Cosmos DB
- ✅ Accessible at your custom Azure URL

**Next**: Configure custom domain (optional) and set up monitoring!
