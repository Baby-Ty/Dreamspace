# DreamSpace API

Azure Functions backend for DreamSpace application.

## 🚀 Quick Start

If you just cloned the repo and need to set up local development:

1. **Run the setup script from the project root:**
   ```powershell
   cd ..
   .\scripts\setup-local-dev.ps1
   ```

2. **Or manually create `local.settings.json`:**
   ```powershell
   Copy-Item local.settings.json.example local.settings.json
   # Then edit local.settings.json with your Azure credentials
   ```

3. **Install dependencies:**
   ```powershell
   npm install
   ```

4. **Start the API:**
   ```powershell
   npm start
   ```

The API will run on http://localhost:7071

## 📋 Configuration

The `local.settings.json` file (not in git) contains:
- Cosmos DB endpoint and key
- Azure Storage connection string
- Function runtime settings

See `local.settings.json.example` for the template.

## 🔑 Getting Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Find your Cosmos DB account
3. Go to **Keys** → Copy URI and PRIMARY KEY
4. Find your Storage Account
5. Go to **Access keys** → Copy connection string

For detailed instructions, see: `../FIRST_TIME_SETUP.md`

## 🧪 Testing

Test the health endpoint:
```powershell
curl http://localhost:7071/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "cosmosdb": { "status": "healthy" }
  }
}
```

## 📦 API Endpoints

- `GET /api/health` - Health check
- `GET /api/getUserData/{userId}` - Get user profile and items
- `POST /api/saveUserData/{userId}` - Save user profile
- `POST /api/saveItem` - Save individual item (dream, goal, etc.)
- `GET /api/getItems/{userId}` - Get all items for a user
- `DELETE /api/deleteItem/{itemId}` - Delete an item
- And 15+ more endpoints...

## 🏗️ Architecture

Uses v2 3-container architecture:
- **users** container: User profiles only
- **items** container: Dreams, goals, scoring entries
- **teams** container: Coaching relationships

## 🔒 Security

- ⚠️ `local.settings.json` contains secrets - NEVER commit it!
- ✅ It's in `.gitignore` by default
- ✅ Use the example file as a template

## 📚 More Info

- Full setup guide: `../LOCAL_DEV_SETUP.md`
- First time setup: `../FIRST_TIME_SETUP.md`
- Project docs: `../docs-deployment/`

