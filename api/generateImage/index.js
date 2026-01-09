/**
 * Azure Function: Generate Image using DALL-E
 * Proxies requests to OpenAI DALL-E API to keep API key server-side
 */

const { getCosmosProvider } = require('../utils/cosmosProvider');
const { requireAuth, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

module.exports = async function (context, req) {
  // Set CORS headers
  const headers = getCorsHeaders();

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  // AUTH CHECK: Authenticated users only (uses OpenAI credits)
  if (isAuthRequired()) {
    const user = await requireAuth(context, req);
    if (!user) return; // 401 already sent
    context.log(`User ${user.email} generating image`);
  }

  const { userSearchTerm, options = {} } = req.body || {};

  context.log('generateImage called:', { 
    userSearchTermLength: userSearchTerm?.length,
    imageType: options.imageType,
    styleModifierId: options.styleModifierId
  });

  // Validate input
  if (!userSearchTerm || typeof userSearchTerm !== 'string' || !userSearchTerm.trim()) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userSearchTerm is required' }),
      headers
    };
    return;
  }

  // Check if OpenAI API key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'OpenAI API not configured',
        details: 'OPENAI_API_KEY environment variable is required'
      }),
      headers
    };
    return;
  }

  try {
    // Extract options with defaults
    const {
      size = '1024x1024',
      quality = 'hd',
      model = 'dall-e-3',
      imageType = 'dream',
      styleModifierId = null,
      customStyle = null
    } = options;

    // Load prompts from Cosmos DB (always fetch fresh, no caching)
    let prompts;
    let promptsSource = 'defaults';
    try {
      const cosmosProvider = getCosmosProvider();
      if (cosmosProvider) {
        // Always fetch fresh prompts from Cosmos DB
        prompts = await cosmosProvider.getPrompts();
        // If prompts don't exist, create defaults
        if (!prompts) {
          context.log('📝 Prompts not found in Cosmos DB, creating defaults');
          const defaultPrompts = cosmosProvider.getDefaultPrompts();
          prompts = await cosmosProvider.upsertPrompts(defaultPrompts, 'system');
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
      const cosmosProvider = getCosmosProvider();
      if (cosmosProvider) {
        prompts = { imageGeneration: cosmosProvider.getDefaultPrompts().imageGeneration, styleModifiers: cosmosProvider.getDefaultPrompts().styleModifiers };
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
    context.log('Calling OpenAI DALL-E API...');

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1, // DALL-E 3 only supports n=1
        size,
        quality
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      context.log.error('OpenAI DALL-E API error:', response.status, errorData);
      context.res = {
        status: response.status,
        body: JSON.stringify({ 
          success: false,
          error: errorData.error?.message || `OpenAI API error: ${response.status}` 
        }),
        headers
      };
      return;
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0 || !data.data[0].url) {
      context.res = {
        status: 500,
        body: JSON.stringify({ 
          success: false,
          error: 'Invalid response from OpenAI DALL-E API' 
        }),
        headers
      };
      return;
    }

    context.log('✅ Image generated successfully');

    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true,
        url: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt || prompt
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error generating image:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      }),
      headers
    };
  }
};

