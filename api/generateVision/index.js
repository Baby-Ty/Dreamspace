/**
 * Azure Function: Generate Vision Statement using GPT
 * Proxies requests to OpenAI API to avoid CORS issues
 */

const { getCosmosProvider } = require('../utils/cosmosProvider');

module.exports = async function (context, req) {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  const { userInput, dreams, action } = req.body || {};

  context.log('generateVision called:', { 
    action, 
    userInputLength: userInput?.length,
    dreamsCount: dreams?.length 
  });

  // Validate input
  if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userInput is required' }),
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
    const maxWords = 100;
    
    // Build context from dreams
    const dreamContext = Array.isArray(dreams) && dreams.length > 0
      ? `Their dreams include: ${dreams.map(d => `"${d.title}" (${d.category || 'General'})`).join(', ')}.`
      : '';

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
    if (!prompts || !prompts.visionGeneration) {
      const cosmosProvider = getCosmosProvider();
      if (cosmosProvider) {
        prompts = { visionGeneration: cosmosProvider.getDefaultPrompts().visionGeneration };
      } else {
        // Ultimate fallback to hardcoded defaults
        prompts = {
          visionGeneration: {
            generateSystemPrompt: `You are a visionary life coach helping someone craft an inspiring personal vision statement. 
Write in first person, present tense. Warm, authentic, aspirational — never corporate.

The tone should feel like a confident dreamer speaking from the heart.
Keep it to around {maxWords} words. Make every word count.`,
            generateUserPrompt: `Here's what I shared about my mindset, goals, and hopes:
"{userInput}"

{dreamContext}

Transform this into a powerful, personal vision statement that captures my aspirations. 
Make it sound like ME - confident, inspired, and ready to make it happen.`,
            polishSystemPrompt: `You are an editor refining a personal vision statement.
Keep the same meaning and personal voice, but elevate clarity, confidence, and inspiration.
Write in first person. Around {maxWords} words.
Do not add new concepts — just polish what's already there.`,
            polishUserPrompt: `Please polish this vision statement while keeping my voice:
"{userInput}"

{dreamContext}

Make it sound more visionary and confident, but still authentically me.`
          }
        };
      }
    }

    let systemPromptTemplate, userPromptTemplate;

    if (action === 'polish') {
      // Polish existing vision
      systemPromptTemplate = prompts.visionGeneration.polishSystemPrompt;
      userPromptTemplate = prompts.visionGeneration.polishUserPrompt;
    } else {
      // Generate new vision
      systemPromptTemplate = prompts.visionGeneration.generateSystemPrompt;
      userPromptTemplate = prompts.visionGeneration.generateUserPrompt;
    }

    // Replace template variables
    const systemPrompt = systemPromptTemplate
      .replace(/{maxWords}/g, maxWords.toString());
    
    const userPrompt = userPromptTemplate
      .replace(/{userInput}/g, userInput.trim())
      .replace(/{dreamContext}/g, dreamContext);

    context.log(`Using prompts from: ${promptsSource}`);
    context.log('Calling OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 150,
        temperature: action === 'polish' ? 0.7 : 0.8
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      context.log.error('OpenAI API error:', response.status, errorData);
      context.res = {
        status: response.status,
        body: JSON.stringify({ 
          error: errorData.error?.message || `OpenAI API error: ${response.status}` 
        }),
        headers
      };
      return;
    }

    const data = await response.json();
    
    // Extract the generated text
    const generatedText = data.choices?.[0]?.message?.content?.trim();
    
    if (!generatedText) {
      context.res = {
        status: 500,
        body: JSON.stringify({ error: 'No text generated from OpenAI' }),
        headers
      };
      return;
    }

    // Remove surrounding quotes if present
    const cleanedText = generatedText.replace(/^["']|["']$/g, '');

    context.log('✅ Vision generated successfully');

    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true, 
        text: cleanedText 
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error generating vision:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      headers
    };
  }
};
