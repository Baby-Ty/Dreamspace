# Environment Validation - Quick Reference

## Import
```javascript
import { config, isDevelopment, isProduction } from './utils/env.js';
```

## Config Object
```javascript
config.cosmos.isConfigured    // true if Cosmos DB is ready
config.unsplash.isConfigured  // true if Unsplash is ready
config.appInsights.isConfigured // true if App Insights is ready
config.isDev                  // true in development
config.isProd                 // true in production
```

## Common Patterns

### Conditional Service Usage
```javascript
if (config.cosmos.isConfigured) {
  await saveToCosmosDB(data);
} else {
  saveToLocalStorage(data);
}
```

### Check Before API Calls
```javascript
if (config.unsplash.isConfigured) {
  const photos = await fetchPhotos(query);
} else {
  const photos = getMockPhotos(query);
}
```

### Environment-Specific Code
```javascript
if (isDevelopment()) {
  console.log('Debug info:', data);
}

if (isProduction()) {
  sendToAnalytics(event);
}
```

## Access Values
```javascript
// Cosmos DB
const { endpoint, key, database, container } = config.cosmos;

// API
const url = `${config.api.baseUrl}/users`;

// Unsplash
const key = config.unsplash.accessKey;
```

## Required Env Vars (Production)
```env
VITE_COSMOS_ENDPOINT=https://...
VITE_COSMOS_KEY=xxx
```

## Optional Env Vars
```env
VITE_UNSPLASH_ACCESS_KEY=xxx
VITE_APPINSIGHTS_CONNECTION_STRING=xxx
```

## Error Handling
- **Development**: Throws error if production vars missing
- **Production**: Logs warning, continues with fallbacks

## Security
✅ DO: `config.cosmos.isConfigured`  
❌ DON'T: `console.log(config.cosmos.key)`

---

**Full docs**: `ENV_USAGE.md`

