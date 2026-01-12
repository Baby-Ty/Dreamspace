/**
 * Azure Function: Generate Image using DALL-E
 * Proxies requests to OpenAI DALL-E API to keep API key server-side
 */

const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user',
  skipDbCheck: true
}, async (context, req, { provider }) => {
  const { userSearchTerm, options = {} } = req.body || {};

  context.log('generateImage called:', { 
    userSearchTermLength: userSearchTerm?.length,
    imageType: options.imageType,
    styleModifierId: options.styleModifierId
  });

  // Validate input
  if (!userSearchTerm || typeof userSearchTerm !== 'string' || !userSearchTerm.trim()) {
    throw { status: 400, message: 'userSearchTerm is required' };
  }

  // Check if OpenAI API key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw { 
      status: 500, 
      message: 'OpenAI API not configured',
      details: 'OPENAI_API_KEY environment variable is required'
    };
  }

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
    throw { 
      status: response.status, 
      message: errorData.error?.message || `OpenAI API error: ${response.status}` 
    };
  }

  const data = await response.json();
  
  // Validate response structure
  if (!data.data || !Array.isArray(data.data) || data.data.length === 0 || !data.data[0].url) {
    throw { status: 500, message: 'Invalid response from OpenAI DALL-E API' };
  }

  context.log('✅ Image generated successfully');

  return { 
    success: true,
    url: data.data[0].url,
    revisedPrompt: data.data[0].revised_prompt || prompt
  };
});
