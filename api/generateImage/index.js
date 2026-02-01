/**
 * Azure Function: Generate Image using Azure AI Foundry
 * Proxies requests to Azure AI Foundry Image API to keep API key server-side
 * 
 * Rate Limits (configurable via People Hub > AI Prompts Configuration):
 * - Per-minute: handled by rateLimiter.js
 * - Per-day per-user: configurable in Cosmos DB (default: 25)
 * - Per-day total: configurable in Cosmos DB (default: 500)
 */

const { createApiHandler } = require('../utils/apiWrapper');

// Default limits (used if Cosmos DB config not available)
const DEFAULT_LIMITS = {
  dailyLimitPerUser: 25,
  dailyLimitTotal: 500
};

// In-memory daily usage tracking (resets on function restart, but that's OK for soft limits)
const dailyUsage = {
  date: new Date().toISOString().split('T')[0],
  users: new Map(),
  total: 0
};

function resetIfNewDay() {
  const today = new Date().toISOString().split('T')[0];
  if (dailyUsage.date !== today) {
    dailyUsage.date = today;
    dailyUsage.users.clear();
    dailyUsage.total = 0;
  }
}

function checkDailyLimit(userId, limits, context) {
  resetIfNewDay();
  
  const dailyLimitPerUser = limits?.dailyLimitPerUser || DEFAULT_LIMITS.dailyLimitPerUser;
  const dailyLimitTotal = limits?.dailyLimitTotal || DEFAULT_LIMITS.dailyLimitTotal;
  
  const userCount = dailyUsage.users.get(userId) || 0;
  
  // Check per-user daily limit
  if (userCount >= dailyLimitPerUser) {
    context.log.warn(`Daily limit reached for user ${userId}: ${userCount}/${dailyLimitPerUser}`);
    return { 
      allowed: false, 
      reason: `Daily image generation limit reached (${dailyLimitPerUser} per day). Try again tomorrow.`,
      userCount,
      totalCount: dailyUsage.total,
      dailyLimitPerUser,
      dailyLimitTotal
    };
  }
  
  // Check organization-wide daily limit
  if (dailyUsage.total >= dailyLimitTotal) {
    context.log.warn(`Organization daily limit reached: ${dailyUsage.total}/${dailyLimitTotal}`);
    return { 
      allowed: false, 
      reason: `Organization daily image limit reached. Try again tomorrow.`,
      userCount,
      totalCount: dailyUsage.total,
      dailyLimitPerUser,
      dailyLimitTotal
    };
  }
  
  return { allowed: true, userCount, totalCount: dailyUsage.total, dailyLimitPerUser, dailyLimitTotal };
}

function recordUsage(userId) {
  resetIfNewDay();
  const current = dailyUsage.users.get(userId) || 0;
  dailyUsage.users.set(userId, current + 1);
  dailyUsage.total++;
}

module.exports = createApiHandler({
  auth: 'user',
  skipDbCheck: true
}, async (context, req, { provider, user }) => {
  const { userSearchTerm, options = {} } = req.body || {};
  
  // Load limits from Cosmos DB prompts config (or use defaults)
  let aiLimits = null;
  try {
    if (provider) {
      const prompts = await provider.getPrompts();
      aiLimits = prompts?.aiLimits?.imageGeneration;
    }
  } catch (err) {
    context.log.warn('Failed to load AI limits from config, using defaults:', err.message);
  }
  
  // Check daily limits before processing
  const dailyCheck = checkDailyLimit(user?.userId || 'anonymous', aiLimits, context);
  if (!dailyCheck.allowed) {
    throw { 
      status: 429, 
      message: dailyCheck.reason,
      details: {
        dailyUserUsage: dailyCheck.userCount,
        dailyTotalUsage: dailyCheck.totalCount,
        dailyUserLimit: dailyCheck.dailyLimitPerUser,
        dailyTotalLimit: dailyCheck.dailyLimitTotal
      }
    };
  }

  context.log('generateImage called:', { 
    userSearchTermLength: userSearchTerm?.length,
    imageType: options.imageType,
    styleModifierId: options.styleModifierId,
    dailyUserUsage: dailyCheck.userCount + 1,
    dailyTotalUsage: dailyCheck.totalCount + 1,
    limitsSource: aiLimits ? 'cosmos-db' : 'defaults'
  });

  // Validate input
  if (!userSearchTerm || typeof userSearchTerm !== 'string' || !userSearchTerm.trim()) {
    throw { status: 400, message: 'userSearchTerm is required' };
  }

  // Check if Azure AI Foundry is configured
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const baseUrl = process.env.AZURE_OPENAI_BASE_URL;
  const imageModel = process.env.AZURE_OPENAI_IMAGE_MODEL || 'gpt-image-1-mini';
  
  if (!apiKey || !baseUrl) {
    throw { 
      status: 500, 
      message: 'Azure AI Foundry not configured',
      details: 'AZURE_OPENAI_API_KEY and AZURE_OPENAI_BASE_URL environment variables are required'
    };
  }

  // Extract options with defaults
  // Note: output_format/output_compression removed - not supported by OpenAI API
  // Compression is handled server-side by Sharp in upload APIs
  const {
    size = '1024x1024',
    quality = 'medium',
    model = 'gpt-image-1-mini',
    imageType = 'dream',
    styleModifierId = null,
    customStyle = null
  } = options;

  // Load prompts from Cosmos DB (always fetch fresh, no caching)
  let prompts;
  let promptsSource = 'defaults';
  try {
    if (provider) {
      // Always fetch fresh prompts from Cosmos DB
      prompts = await provider.getPrompts();
      // If prompts don't exist, create defaults
      if (!prompts) {
        context.log('📝 Prompts not found in Cosmos DB, creating defaults');
        const defaultPrompts = provider.getDefaultPrompts();
        prompts = await provider.upsertPrompts(defaultPrompts, 'system');
        promptsSource = 'cosmos-db (newly created)';
      } else {
        promptsSource = 'cosmos-db';
        context.log('✅ Loaded prompts from Cosmos DB');
      }
    }
  } catch (promptError) {
    context.log.warn('Failed to load prompts from Cosmos DB, using defaults:', promptError.message);
  }

  // Fallback to default prompts if Cosmos DB load failed
  if (!prompts || !prompts.imageGeneration || !prompts.styleModifiers) {
    if (provider) {
      prompts = { imageGeneration: provider.getDefaultPrompts().imageGeneration, styleModifiers: provider.getDefaultPrompts().styleModifiers };
    } else {
      // Ultimate fallback to hardcoded defaults
      prompts = {
        imageGeneration: {
          dreamPrompt: `Create an inspiring, symbolic image that represents the dream: {userSearchTerm}

Make the image visually strong, motivating, and emotionally uplifting.  
Use scenery, objects, environments, silhouettes, distant figures, or hands-only shots — no identifiable people or faces.`,
          backgroundCardPrompt: `Create a clean, visually appealing background image based on the theme: "{userSearchTerm}".

Make the image expressive but not distracting, with a subtle composition that works behind UI text.  
Use scenery, objects, abstract shapes, or symbolic visuals — but no identifiable people or faces.`
        },
        styleModifiers: {
          stylized_digital: { modifier: 'stylized digital painting, soft brush textures, warm lighting, smooth gradients, gentle color exaggeration, clean modern illustration style' },
          vibrant_coastal: { modifier: 'vibrant illustrated scenery, warm daylight, smooth shading, gentle highlights, slightly stylized natural elements' },
          semi_realistic: { modifier: 'semi-realistic environment art, crisp edges, vibrant tones, atmospheric depth, painterly highlights, detailed but not photorealistic' },
          photorealistic_cinematic: { modifier: 'photorealistic detail, cinematic lighting, shallow depth of field, soft film grain, high-contrast highlights' }
        }
      };
    }
  }

  // Get style modifier text - prefer custom style if provided
  let styleModifier = '';
  if (customStyle && customStyle.trim()) {
    styleModifier = customStyle.trim();
  } else if (styleModifierId && prompts.styleModifiers[styleModifierId]) {
    styleModifier = prompts.styleModifiers[styleModifierId].modifier || prompts.styleModifiers[styleModifierId];
  }

  // Build prompt based on image type
  let promptTemplate;
  if (imageType === 'background_card') {
    promptTemplate = prompts.imageGeneration.backgroundCardPrompt;
  } else {
    // Default to dream image type
    promptTemplate = prompts.imageGeneration.dreamPrompt;
  }

  // Replace template variables
  let prompt = promptTemplate.replace(/{userSearchTerm}/g, userSearchTerm.trim());

  // Add style modifier if provided
  if (styleModifier) {
    prompt += `\n\nStyle: ${styleModifier}`;
  }

  context.log(`Using prompts from: ${promptsSource}`);
  context.log('Calling Azure AI Foundry Image API...');

  // Use the model from env var, falling back to options model if needed
  const deploymentModel = imageModel || model;
  
  const response = await fetch(`${baseUrl}/openai/deployments/${deploymentModel}/images/generations?api-version=2025-04-01-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      prompt,
      n: 1,
      size,
      quality
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    context.log.error('Azure AI Foundry Image API error:', response.status, errorData);
    throw { 
      status: response.status, 
      message: errorData.error?.message || `Azure AI Foundry API error: ${response.status}` 
    };
  }

  const data = await response.json();
  
  // Validate response structure - gpt-image models return b64_json
  if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
    context.log.error('Invalid Azure AI Foundry response structure:', JSON.stringify(data).substring(0, 500));
    throw { status: 500, message: 'Invalid response from Azure AI Foundry Image API' };
  }

  const imageData = data.data[0];
  
  // Handle both URL and base64 responses
  let imageUrl;
  if (imageData.url) {
    imageUrl = imageData.url;
  } else if (imageData.b64_json) {
    // Convert base64 to data URL for display
    imageUrl = `data:image/png;base64,${imageData.b64_json}`;
  } else {
    context.log.error('No url or b64_json in response:', Object.keys(imageData));
    throw { status: 500, message: 'Invalid response from Azure AI Foundry Image API - no image data' };
  }

  // Record successful usage for daily limits
  recordUsage(user?.userId || 'anonymous');
  
  const finalUserCount = dailyUsage.users.get(user?.userId || 'anonymous') || 0;
  const userLimit = dailyCheck.dailyLimitPerUser;
  
  context.log('✅ Image generated successfully', {
    dailyUserUsage: finalUserCount,
    dailyTotalUsage: dailyUsage.total,
    responseType: imageData.url ? 'url' : 'b64_json'
  });

  return { 
    success: true,
    url: imageUrl,
    revisedPrompt: imageData.revised_prompt || prompt,
    // Include usage info so frontend can show remaining
    usage: {
      dailyUserUsage: finalUserCount,
      dailyUserLimit: userLimit,
      dailyUserRemaining: userLimit - finalUserCount
    }
  };
});
