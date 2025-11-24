// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
// DoD: validated I/O with Zod; consistent error shape; unit tested; CI green; health check passing.

/**
 * Environment Variable Validation
 * Validates all required environment variables using Zod
 * Throws early in development if critical vars are missing
 */

import { z } from 'zod';

/**
 * Environment type enum
 */
export const Environment = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
};

/**
 * Zod schema for environment variables
 * All VITE_* variables are accessible in the browser
 */
const envSchema = z.object({
  // Environment mode
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  
  // Application environment (custom)
  VITE_APP_ENV: z.enum(['development', 'production', 'test']).optional(),

  // Azure AD / Microsoft Entra ID
  VITE_AZURE_CLIENT_ID: z.string().uuid({
    message: 'VITE_AZURE_CLIENT_ID must be a valid UUID'
  }).optional(), // Optional because it's hardcoded in authConfig currently

  VITE_AZURE_TENANT_ID: z.string().uuid({
    message: 'VITE_AZURE_TENANT_ID must be a valid UUID'
  }).optional(),

  // Azure Cosmos DB (required in production)
  VITE_COSMOS_ENDPOINT: z.string().url({
    message: 'VITE_COSMOS_ENDPOINT must be a valid URL'
  }).optional(),

  VITE_COSMOS_KEY: z.string().min(1, {
    message: 'VITE_COSMOS_KEY must not be empty'
  }).optional(),

  VITE_COSMOS_DATABASE: z.string().min(1).default('dreamspace'),
  VITE_COSMOS_CONTAINER: z.string().min(1).default('users'),

  // API Configuration
  VITE_API_BASE_URL: z.string().default('/api'),

  // Unsplash API (optional - falls back to mock data)
  VITE_UNSPLASH_ACCESS_KEY: z.string().min(1).optional(),

  // OpenAI API (optional - for DALL-E image generation)
  VITE_OPENAI_API_KEY: z.string().min(1).optional(),

  // Microsoft Graph API
  VITE_GRAPH_API_BASE: z.string().url().default('https://graph.microsoft.com/v1.0'),

  // Application Insights (optional)
  VITE_APPINSIGHTS_CONNECTION_STRING: z.string().optional(),
  VITE_APPINSIGHTS_INSTRUMENTATION_KEY: z.string().optional(),

  // Feature flags
  VITE_ENABLE_COSMOS: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  VITE_ENABLE_UNSPLASH: z.enum(['true', 'false']).transform(val => val === 'true').optional(),

  // Build info
  VITE_APP_VERSION: z.string().optional(),
  VITE_BUILD_TIME: z.string().optional(),
});

/**
 * Custom validation rules for production environment
 */
const productionSchema = envSchema.refine(
  (data) => {
    const isProduction = data.VITE_APP_ENV === 'production' || data.MODE === 'production';
    
    if (isProduction) {
      // Cosmos DB is required in production
      if (!data.VITE_COSMOS_ENDPOINT || !data.VITE_COSMOS_KEY) {
        return false;
      }
    }
    
    return true;
  },
  {
    message: 'VITE_COSMOS_ENDPOINT and VITE_COSMOS_KEY are required in production environment',
    path: ['VITE_COSMOS_ENDPOINT']
  }
);

/**
 * Validate environment variables
 */
function validateEnv() {
  try {
    // Parse and validate
    const parsed = productionSchema.parse(import.meta.env);
    
    return {
      success: true,
      data: parsed,
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors
      };
    }
    
    return {
      success: false,
      data: null,
      errors: [{ message: error.message }]
    };
  }
}

/**
 * Format validation errors for display
 */
function formatValidationErrors(errors) {
  return errors.map(error => {
    const path = error.path.join('.');
    return `  ❌ ${path}: ${error.message}`;
  }).join('\n');
}

/**
 * Get environment type
 */
function getEnvironment() {
  const appEnv = import.meta.env.VITE_APP_ENV;
  const mode = import.meta.env.MODE;
  
  if (appEnv === 'production' || mode === 'production') {
    return Environment.PRODUCTION;
  }
  
  if (appEnv === 'test' || mode === 'test') {
    return Environment.TEST;
  }
  
  return Environment.DEVELOPMENT;
}

/**
 * Check if running in production
 */
export function isProduction() {
  return getEnvironment() === Environment.PRODUCTION;
}

/**
 * Check if running in development
 */
export function isDevelopment() {
  return getEnvironment() === Environment.DEVELOPMENT;
}

/**
 * Check if running in test
 */
export function isTest() {
  return getEnvironment() === Environment.TEST;
}

/**
 * Validate environment variables and throw if invalid in development
 */
const validation = validateEnv();

if (!validation.success) {
  const errorMessage = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ⚠️  ENVIRONMENT VALIDATION FAILED ⚠️                  ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Invalid or missing environment variables:                ║
║                                                           ║
${formatValidationErrors(validation.errors)}
║                                                           ║
║  📝 Create a .env file in your project root with:         ║
║                                                           ║
║     VITE_COSMOS_ENDPOINT=https://your-cosmos.documents... ║
║     VITE_COSMOS_KEY=your-cosmos-key                       ║
║     VITE_UNSPLASH_ACCESS_KEY=your-unsplash-key            ║
║     VITE_OPENAI_API_KEY=your-openai-api-key               ║
║                                                           ║
║  📚 See SETUP_UNSPLASH.md and AZURE_DEPLOYMENT.md         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`;

  // Throw in development, warn in production
  if (isDevelopment()) {
    console.error(errorMessage);
    throw new Error('Environment validation failed. Check console for details.');
  } else {
    console.warn(errorMessage);
  }
}

/**
 * Validated and typed environment variables
 * Safe to use throughout the app
 */
export const env = validation.data || {
  // Fallback to safe defaults if validation failed in production
  MODE: import.meta.env.MODE || 'development',
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  VITE_COSMOS_ENDPOINT: import.meta.env.VITE_COSMOS_ENDPOINT,
  VITE_COSMOS_KEY: import.meta.env.VITE_COSMOS_KEY,
  VITE_COSMOS_DATABASE: import.meta.env.VITE_COSMOS_DATABASE || 'dreamspace',
  VITE_COSMOS_CONTAINER: import.meta.env.VITE_COSMOS_CONTAINER || 'users',
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  VITE_UNSPLASH_ACCESS_KEY: import.meta.env.VITE_UNSPLASH_ACCESS_KEY,
  VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
  VITE_GRAPH_API_BASE: import.meta.env.VITE_GRAPH_API_BASE || 'https://graph.microsoft.com/v1.0',
  VITE_APPINSIGHTS_CONNECTION_STRING: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING,
  VITE_APPINSIGHTS_INSTRUMENTATION_KEY: import.meta.env.VITE_APPINSIGHTS_INSTRUMENTATION_KEY,
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
  VITE_BUILD_TIME: import.meta.env.VITE_BUILD_TIME,
};

/**
 * Convenience getters for common environment checks
 */
export const config = {
  // Environment
  env: getEnvironment(),
  isDev: isDevelopment(),
  isProd: isProduction(),
  isTest: isTest(),

  // Azure Cosmos DB
  cosmos: {
    endpoint: env.VITE_COSMOS_ENDPOINT,
    key: env.VITE_COSMOS_KEY,
    database: env.VITE_COSMOS_DATABASE,
    container: env.VITE_COSMOS_CONTAINER,
    isConfigured: !!(env.VITE_COSMOS_ENDPOINT && env.VITE_COSMOS_KEY),
  },

  // Unsplash API
  unsplash: {
    accessKey: env.VITE_UNSPLASH_ACCESS_KEY,
    isConfigured: !!env.VITE_UNSPLASH_ACCESS_KEY,
  },

  // OpenAI API
  openai: {
    apiKey: env.VITE_OPENAI_API_KEY,
    isConfigured: !!env.VITE_OPENAI_API_KEY,
  },

  // Microsoft Graph API
  graph: {
    baseUrl: env.VITE_GRAPH_API_BASE,
  },

  // Azure Application Insights
  appInsights: {
    connectionString: env.VITE_APPINSIGHTS_CONNECTION_STRING,
    instrumentationKey: env.VITE_APPINSIGHTS_INSTRUMENTATION_KEY,
    isConfigured: !!(env.VITE_APPINSIGHTS_CONNECTION_STRING || env.VITE_APPINSIGHTS_INSTRUMENTATION_KEY),
  },

  // API
  api: {
    baseUrl: env.VITE_API_BASE_URL,
  },

  // App metadata
  app: {
    version: env.VITE_APP_VERSION,
    buildTime: env.VITE_BUILD_TIME,
  }
};

/**
 * Log environment configuration (safe for console, no secrets)
 */
export function logConfig() {
  console.log('🔧 Environment Configuration:');
  console.log('  Environment:', config.env);
  console.log('  Cosmos DB:', config.cosmos.isConfigured ? '✅ Configured' : '❌ Not configured');
  console.log('  Unsplash API:', config.unsplash.isConfigured ? '✅ Configured' : '❌ Not configured (using mocks)');
  console.log('  OpenAI API:', config.openai.isConfigured ? '✅ Configured' : '❌ Not configured (AI image generation disabled)');
  console.log('  App Insights:', config.appInsights.isConfigured ? '✅ Configured' : '❌ Not configured');
  
  if (config.app.version) {
    console.log('  Version:', config.app.version);
  }
  
  if (config.app.buildTime) {
    console.log('  Build Time:', config.app.buildTime);
  }
}

// Log configuration in development
if (isDevelopment()) {
  logConfig();
}

export default env;

