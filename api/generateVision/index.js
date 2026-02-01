/**
 * Azure Function: Generate Vision Statement using GPT
 * Proxies requests to Azure AI Foundry to avoid CORS issues
 */

const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user',
  skipDbCheck: true
}, async (context, req, { provider }) => {
  const { userInput, dreams, action } = req.body || {};

  context.log('generateVision called:', { 
    action, 
    userInputLength: userInput?.length,
    dreamsCount: dreams?.length 
  });

  // Validate input
  if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
    throw { status: 400, message: 'userInput is required' };
  }

  // Check if Azure AI Foundry is configured
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const baseUrl = process.env.AZURE_OPENAI_BASE_URL;
  const chatModel = process.env.AZURE_OPENAI_CHAT_MODEL || 'gpt-4.1-nano';
  
  if (!apiKey || !baseUrl) {
    throw { 
      status: 500, 
      message: 'Azure AI Foundry not configured',
      details: 'AZURE_OPENAI_API_KEY and AZURE_OPENAI_BASE_URL environment variables are required'
    };
  }

  const maxWords = 100;
  
  // Build context from dreams
  const dreamContext = Array.isArray(dreams) && dreams.length > 0
    ? `Their dreams include: ${dreams.map(d => `"${d.title}" (${d.category || 'General'})`).join(', ')}.`
    : '';

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
  if (!prompts || !prompts.visionGeneration) {
    if (provider) {
      prompts = { visionGeneration: provider.getDefaultPrompts().visionGeneration };
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
  context.log('Calling Azure AI Foundry API...');

  const response = await fetch(`${baseUrl}/models/chat/completions?api-version=2024-05-01-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      model: chatModel,
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
    context.log.error('Azure AI Foundry API error:', response.status, errorData);
    throw { 
      status: response.status, 
      message: errorData.error?.message || `Azure AI Foundry API error: ${response.status}` 
    };
  }

  const data = await response.json();
  
  // Extract the generated text
  const generatedText = data.choices?.[0]?.message?.content?.trim();
  
  if (!generatedText) {
    throw { status: 500, message: 'No text generated from Azure AI Foundry' };
  }

  // Remove surrounding quotes if present
  const cleanedText = generatedText.replace(/^["']|["']$/g, '');

  context.log('✅ Vision generated successfully');

  return { success: true, text: cleanedText };
});
