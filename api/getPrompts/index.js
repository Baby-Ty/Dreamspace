/**
 * Azure Function: Get AI Prompts Configuration
 * Returns the current prompt configuration from Cosmos DB
 */

const { getCosmosProvider } = require('../utils/cosmosProvider');

module.exports = async function (context, req) {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  try {
    const cosmosProvider = getCosmosProvider();
    if (!cosmosProvider) {
      context.log.warn('Cosmos DB provider not initialized, returning default prompts');
      // Return default prompts if Cosmos DB is not available
      const defaultPrompts = {
        imageGeneration: {
          dreamPrompt: `Create an inspiring, symbolic image that represents the dream: {userSearchTerm}\n\nMake the image visually strong, motivating, and emotionally uplifting.\nUse scenery, objects, environments, silhouettes, distant figures, or hands-only shots — no identifiable people or faces.`,
          backgroundCardPrompt: `Create a clean, visually appealing background image based on the theme: "{userSearchTerm}".\n\nMake the image expressive but not distracting, with a subtle composition that works behind UI text.\nUse scenery, objects, abstract shapes, or symbolic visuals — but no identifiable people or faces.`
        },
        visionGeneration: {
          generateSystemPrompt: `You are a visionary life coach helping someone craft an inspiring personal vision statement.\nWrite in first person, present tense. Warm, authentic, aspirational — never corporate.\n\nThe tone should feel like a confident dreamer speaking from the heart.\nKeep it to around {maxWords} words. Make every word count.`,
          generateUserPrompt: `Here's what I shared about my mindset, goals, and hopes:\n"{userInput}"\n\n{dreamContext}\n\nTransform this into a powerful, personal vision statement that captures my aspirations.\nMake it sound like ME - confident, inspired, and ready to make it happen.`,
          polishSystemPrompt: `You are an editor refining a personal vision statement.\nKeep the same meaning and personal voice, but elevate clarity, confidence, and inspiration.\nWrite in first person. Around {maxWords} words.\nDo not add new concepts — just polish what's already there.`,
          polishUserPrompt: `Please polish this vision statement while keeping my voice:\n"{userInput}"\n\n{dreamContext}\n\nMake it sound more visionary and confident, but still authentically me.`
        },
        styleModifiers: {
          stylized_digital: { label: 'Stylized Digital Painting', modifier: 'stylized digital painting, soft brush textures, warm lighting, smooth gradients, gentle color exaggeration, clean modern illustration style' },
          vibrant_coastal: { label: 'Vibrant Coastal Illustration', modifier: 'vibrant illustrated scenery, warm daylight, smooth shading, gentle highlights, slightly stylized natural elements' },
          semi_realistic: { label: 'Semi-Realistic Landscape Art', modifier: 'semi-realistic environment art, crisp edges, vibrant tones, atmospheric depth, painterly highlights, detailed but not photorealistic' },
          photorealistic_cinematic: { label: 'Photorealistic Cinematic', modifier: 'photorealistic detail, cinematic lighting, shallow depth of field, soft film grain, high-contrast highlights' }
        }
      };
      
      context.res = {
        status: 200,
        body: JSON.stringify({ 
          success: true,
          prompts: defaultPrompts
        }),
        headers
      };
      return;
    }

    // Always fetch fresh prompts from Cosmos DB (no caching)
    let prompts;
    try {
      // Fetch fresh prompts from Cosmos DB
      prompts = await cosmosProvider.getPrompts();
      
      // If prompts don't exist, create defaults
      if (!prompts) {
        context.log('📝 Prompts not found, creating defaults');
        const defaultPrompts = cosmosProvider.getDefaultPrompts();
        prompts = await cosmosProvider.upsertPrompts(defaultPrompts, 'system');
      }
    } catch (promptError) {
      context.log.warn('Failed to load/create prompts from Cosmos DB, using defaults:', promptError.message);
      // Fallback to default prompts
      prompts = cosmosProvider.getDefaultPrompts();
    }
    
    // Clean metadata before returning
    const cleanPrompts = cosmosProvider.cleanMetadata(prompts);

    context.log('✅ Retrieved prompts configuration');

    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true,
        prompts: cleanPrompts
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error fetching prompts:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      headers
    };
  }
};

