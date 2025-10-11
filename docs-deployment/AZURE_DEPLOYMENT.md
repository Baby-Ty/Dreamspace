# Azure Deployment Guide for DreamSpace

## Overview
This guide will help you deploy DreamSpace to Azure Static Web Apps with Azure Cosmos DB for data persistence.

## Prerequisites
- Azure account with active subscription
- GitHub account (for automated deployments)
- Azure CLI installed locally (optional)

## Step 1: Create Azure Static Web App

### Option A: Using Azure Portal (Recommended)
1. **Go to Azure Portal**: https://portal.azure.com
2. **Create Resource** → Search for "Static Web App"
3. **Configure Basic Settings**:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new "dreamspace-rg"
   - **Name**: "dreamspace-app" (or your preferred name)
   - **Plan Type**: Free (for demo) or Standard (for production)
   - **Region**: Choose closest to your users
   - **Source**: GitHub
   - **GitHub Account**: Sign in to your GitHub account
   - **Organization**: Your GitHub username
   - **Repository**: Select your DreamSpace repository
   - **Branch**: main
   - **Build Presets**: React
   - **App location**: `/` (root of repository)
   - **Api location**: (leave empty)
   - **Output location**: `dist`

4. **Review + Create** → Click "Create"

### Option B: Using Azure CLI
```bash
# Login to Azure
az login

# Create resource group
az group create --name dreamspace-rg --location "East US"

# Create Static Web App
az staticwebapp create \
  --name dreamspace-app \
  --resource-group dreamspace-rg \
  --source https://github.com/YOUR_USERNAME/YOUR_REPO_NAME \
  --location "East US" \
  --branch main \
  --app-location "/" \
  --output-location "dist"
```

## Step 2: Configure GitHub Repository Secrets

After creating the Static Web App, Azure will provide you with a deployment token:

1. **Get the Deployment Token**:
   - In Azure Portal, go to your Static Web App
   - Click "Manage deployment token"
   - Copy the token

2. **Add to GitHub Secrets**:
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: Paste the deployment token
   - Click "Add secret"

## Step 3: Set Up Azure Cosmos DB (Database)

### Create Cosmos DB Account
1. **Azure Portal** → Create Resource → "Azure Cosmos DB"
2. **Select API**: Core (SQL) - recommended for JSON documents
3. **Configure**:
   - **Account Name**: `dreamspace-cosmos`
   - **Resource Group**: `dreamspace-rg` (same as Static Web App)
   - **Location**: Same region as Static Web App
   - **Capacity Mode**: Provisioned throughput (cheaper for consistent usage)
   - **Apply Free Tier Discount**: Yes (if available)
   - **Limit total account throughput**: Yes (400 RU/s)

### Create Database and Container
1. **Go to your Cosmos DB account** → Data Explorer
2. **New Database**:
   - Database ID: `dreamspace`
   - Provision throughput: Uncheck (we'll set it on container)
3. **New Container**:
   - Database ID: Select `dreamspace`
   - Container ID: `users`
   - Partition key: `/userId`
   - Throughput: 400 RU/s (minimum for production)

### Get Connection Details
1. **Keys section** in your Cosmos DB account
2. Copy:
   - **URI** (Primary endpoint)
   - **PRIMARY KEY**

## Step 4: Configure Environment Variables

1. **Go to your Static Web App** in Azure Portal
2. **Configuration** → **Application settings**
3. **Add these settings**:
   ```
   VITE_COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
   VITE_COSMOS_KEY=your-primary-key-here
   VITE_APP_ENV=production
   ```

## Step 5: Update Azure AD App Registration

1. **Azure Portal** → **Microsoft Entra ID** → **App registrations**
2. **Find your app**: `ebe60b7a-93c9-4b12-8375-4ab3181000e8`
3. **Authentication** → **Redirect URIs**
4. **Add new URI**: Your Static Web App URL (e.g., `https://yourapp.azurestaticapps.net`)
5. **Add logout URI**: Same URL for post-logout redirect

## Step 6: Deploy and Test

### Push to GitHub
```bash
# Add all changes
git add .

# Commit changes
git commit -m "Add Azure deployment configuration"

# Push to main branch (triggers deployment)
git push origin main
```

### Monitor Deployment
1. **GitHub Actions**: Check the Actions tab in your repository
2. **Azure Portal**: Monitor deployment in your Static Web App → GitHub Actions

### Test the Application
1. **Visit your Static Web App URL**
2. **Test Azure AD login**
3. **Verify data persistence** (create a dream, refresh page)

## Step 7: Database Migration (Optional)

If you have existing localStorage data to migrate:

```javascript
// Add this to your browser console on the old site
function exportUserData() {
  const userData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('dreamspace_user_')) {
      userData[key] = JSON.parse(localStorage.getItem(key));
    }
  }
  console.log('Copy this data:', JSON.stringify(userData, null, 2));
}
exportUserData();
```

## Troubleshooting

### Deployment Issues
- **Build fails**: Check GitHub Actions logs
- **Authentication fails**: Verify redirect URIs in Azure AD
- **Environment variables**: Ensure they're set in Static Web App configuration

### Database Issues
- **Connection fails**: Verify Cosmos DB keys and endpoint
- **Throttling**: Increase RU/s if you hit limits
- **Data not saving**: Check browser console for errors

### Common Errors
1. **CORS errors**: Add your domain to Azure AD redirect URIs
2. **Build errors**: Ensure all dependencies are in package.json
3. **Environment variables not loading**: Restart Static Web App after adding variables

## Cost Optimization

### Free Tier Resources
- **Static Web Apps**: Free tier includes 100GB bandwidth/month
- **Cosmos DB**: Free tier includes 400 RU/s and 5GB storage
- **Azure AD**: Free for up to 50,000 users/month

### Estimated Monthly Costs (after free tier)
- **Static Web Apps Standard**: $9/month (if you need custom domains/auth)
- **Cosmos DB**: $24+/month (400 RU/s provisioned)
- **Total**: ~$33/month for production usage

## Production Checklist

- [ ] Custom domain configured (optional)
- [ ] SSL certificate applied (automatic with Static Web Apps)
- [ ] Azure AD redirect URIs updated
- [ ] Environment variables configured
- [ ] Database backup strategy implemented
- [ ] Monitoring and alerts set up
- [ ] Performance testing completed
- [ ] Security review completed

## Next Steps

1. **Custom Domain**: Configure your own domain name
2. **Monitoring**: Set up Application Insights for monitoring
3. **Backup**: Configure Cosmos DB backup policies
4. **Scaling**: Monitor usage and scale resources as needed
5. **Security**: Review and harden security settings

## Support Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/en-us/azure/cosmos-db/)
- [Microsoft Entra ID Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
