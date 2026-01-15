# Environment Variable Validation - Usage Guide

## Overview
The `src/utils/env.js` utility validates all environment variables using Zod at app startup.

## Features
- ✅ **Type-safe**: Validates env vars with Zod schemas
- ✅ **Fail-fast**: Throws errors early in development if critical vars are missing
- ✅ **Production-safe**: Warns but doesn't crash in production
- ✅ **Auto-fallbacks**: Provides safe defaults where appropriate
- ✅ **Convenient API**: Easy-to-use config object

## Required Environment Variables

### Production Only
```env
# Azure Cosmos DB (required in production)
VITE_COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
VITE_COSMOS_KEY=your-primary-key-here
```

### Optional
```env
# Application environment (auto-detected from MODE if not set)
VITE_APP_ENV=development

# Unsplash API (optional - falls back to mock data)
VITE_UNSPLASH_ACCESS_KEY=your-unsplash-access-key

# Azure Application Insights (optional)
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://...

# Custom API base URL (defaults to /api)
VITE_API_BASE_URL=/api

# Cosmos DB names (defaults provided)
VITE_COSMOS_DATABASE=dreamspace
VITE_COSMOS_CONTAINER=users

# App metadata (optional)
VITE_APP_VERSION=1.0.0
VITE_BUILD_TIME=2024-10-04T19:00:00Z
```

## Usage

### Import the Config
```javascript
import { config, env } from './utils/env.js';
```

### Check Environment
```javascript
import { isDevelopment, isProduction } from './utils/env.js';

if (isDevelopment()) {
  console.log('Running in development mode');
}

if (isProduction()) {
  console.log('Running in production mode');
}
```

### Access Configuration
```javascript
import { config } from './utils/env.js';

// Check if Cosmos DB is configured
if (config.cosmos.isConfigured) {
  console.log('Using Cosmos DB at', config.cosmos.endpoint);
} else {
  console.log('Using localStorage for data persistence');
}

// Check if Unsplash is configured
if (config.unsplash.isConfigured) {
  const photos = await searchUnsplash(query, config.unsplash.accessKey);
} else {
  const photos = getMockPhotos(query);
}

// API base URL
const response = await fetch(`${config.api.baseUrl}/users`);

// App metadata
console.log('App version:', config.app.version);
```

### Direct Environment Access
```javascript
import { env } from './utils/env.js';

// Access validated environment variables
const endpoint = env.VITE_COSMOS_ENDPOINT;
const key = env.VITE_COSMOS_KEY;
```

## Configuration Object

### `config.env`
Current environment: `'development'`, `'production'`, or `'test'`

### `config.isDev`, `config.isProd`, `config.isTest`
Boolean flags for current environment

### `config.cosmos`
```javascript
{
  endpoint: 'https://...',
  key: 'xxx',
  database: 'dreamspace',
  container: 'users',
  isConfigured: true
}
```

### `config.unsplash`
```javascript
{
  accessKey: 'xxx',
  isConfigured: true
}
```

### `config.graph`
```javascript
{
  baseUrl: 'https://graph.microsoft.com/v1.0'
}
```

### `config.appInsights`
```javascript
{
  connectionString: 'InstrumentationKey=xxx;...',
  instrumentationKey: 'xxx',
  isConfigured: true
}
```

### `config.api`
```javascript
{
  baseUrl: '/api'
}
```

### `config.app`
```javascript
{
  version: '1.0.0',
  buildTime: '2024-10-04T19:00:00Z'
}
```

## Examples

### Database Service
```javascript
import { config } from '../utils/env.js';

class DatabaseService {
  constructor() {
    this.useCosmosDB = config.cosmos.isConfigured && config.isProd;
    this.apiBase = config.api.baseUrl;
  }

  async saveData(userId, data) {
    if (this.useCosmosDB) {
      const response = await fetch(`${this.apiBase}/saveUserData/${userId}`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    } else {
      localStorage.setItem(`user_${userId}`, JSON.stringify(data));
      return { success: true };
    }
  }
}
```

### Unsplash Service
```javascript
import { config } from '../utils/env.js';

async function searchPhotos(query) {
  if (!config.unsplash.isConfigured) {
    console.warn('Unsplash not configured, using mock data');
    return getMockPhotos(query);
  }

  const url = `https://api.unsplash.com/search/photos?query=${query}&client_id=${config.unsplash.accessKey}`;
  const response = await fetch(url);
  return response.json();
}
```

### Application Insights Setup
```javascript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { config } from './utils/env.js';
import { initializeAppInsights } from './utils/logger.js';

if (config.appInsights.isConfigured) {
  const appInsights = new ApplicationInsights({
    config: {
      connectionString: config.appInsights.connectionString
    }
  });
  appInsights.loadAppInsights();
  initializeAppInsights(appInsights);
}
```

### Conditional Features
```javascript
import { config } from './utils/env.js';

function SettingsPanel() {
  return (
    <div>
      <h2>Settings</h2>
      
      {config.cosmos.isConfigured && (
        <p>✅ Cloud sync enabled</p>
      )}
      
      {!config.cosmos.isConfigured && (
        <p>⚠️ Using local storage only</p>
      )}
      
      {config.appInsights.isConfigured && (
        <p>📊 Analytics enabled</p>
      )}
    </div>
  );
}
```

## Environment Files

### `.env` (local development)
```env
# Development environment variables (not committed to git)
VITE_UNSPLASH_ACCESS_KEY=your-local-key
```

### `.env.production` (production build)
```env
# Production environment variables
VITE_APP_ENV=production
VITE_COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
VITE_COSMOS_KEY=your-primary-key
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://...
VITE_APP_VERSION=1.0.0
```

### `.env.example` (template for team)
```env
# Copy this file to .env and fill in your values

# Optional: Unsplash API
VITE_UNSPLASH_ACCESS_KEY=

# Production only: Azure Cosmos DB
# VITE_COSMOS_ENDPOINT=
# VITE_COSMOS_KEY=

# Optional: Azure Application Insights
# VITE_APPINSIGHTS_CONNECTION_STRING=
```

## Validation Behavior

### Development
- ❌ **Throws error** if required vars are missing in production build
- ✅ **Logs warning** if optional vars are missing
- ✅ **Shows helpful error message** with setup instructions

### Production
- ⚠️ **Logs warning** if vars are invalid (doesn't crash app)
- ✅ **Falls back to safe defaults** where possible
- ✅ **Continues running** with reduced functionality

## Error Messages

### Missing Production Variables
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ⚠️  ENVIRONMENT VALIDATION FAILED ⚠️                  ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Invalid or missing environment variables:                ║
║                                                           ║
  ❌ VITE_COSMOS_ENDPOINT: Required
  ❌ VITE_COSMOS_KEY: Required
║                                                           ║
║  📝 Create a .env file in your project root with:         ║
║                                                           ║
║     VITE_COSMOS_ENDPOINT=https://your-cosmos.documents... ║
║     VITE_COSMOS_KEY=your-cosmos-key                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

## Testing

### Mock Environment
```javascript
import { vi } from 'vitest';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.mock('./utils/env.js', () => ({
      config: {
        cosmos: { isConfigured: false },
        unsplash: { isConfigured: false },
        isDev: true,
        isProd: false
      }
    }));
  });

  it('should use localStorage when Cosmos is not configured', () => {
    // Test implementation
  });
});
```

## Best Practices

### 1. Always Use `config` Object
```javascript
// Good
import { config } from './utils/env.js';
const endpoint = config.cosmos.endpoint;

// Avoid
const endpoint = import.meta.env.VITE_COSMOS_ENDPOINT;
```

### 2. Check Configuration Before Use
```javascript
// Good
if (config.unsplash.isConfigured) {
  await fetchRealPhotos();
} else {
  return getMockPhotos();
}

// Avoid
await fetch(`...?key=${config.unsplash.accessKey}`); // Might be undefined
```

### 3. Provide Fallbacks
```javascript
// Good
const baseUrl = config.api.baseUrl || '/api';

// Avoid
const baseUrl = config.api.baseUrl; // Might be undefined
```

### 4. Don't Log Secrets
```javascript
// Good
console.log('Cosmos configured:', config.cosmos.isConfigured);

// NEVER do this
console.log('Cosmos key:', config.cosmos.key);
```

## Integration with Existing Code

### Update databaseService.js
```javascript
import { config } from '../utils/env.js';

class DatabaseService {
  constructor() {
    this.useCosmosDB = config.cosmos.isConfigured && config.isProd;
    // Rest of implementation
  }
}
```

### Update unsplashService.js
```javascript
import { config } from '../utils/env.js';

export function UnsplashService() {
  if (!config.unsplash.isConfigured) {
    return null; // Use mock service
  }
  
  return {
    search: async (query) => {
      const url = `https://api.unsplash.com/search/photos?query=${query}&client_id=${config.unsplash.accessKey}`;
      // ...
    }
  };
}
```

### Update main.jsx
```javascript
import { config, logConfig } from './utils/env.js';

// Log configuration on app startup
if (config.isDev) {
  logConfig();
}

// Initialize App Insights if configured
if (config.appInsights.isConfigured) {
  // Setup Application Insights
}
```

---

**Result**: Type-safe, validated environment configuration! 🔧
