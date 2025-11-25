/**
 * Azure Function: Generate Vision Statement using GPT
 * Proxies requests to OpenAI API to avoid CORS issues
 */

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
  // Try multiple possible environment variable names
  const rawApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  const apiKey = rawApiKey ? rawApiKey.trim() : null;
  
  if (!apiKey || apiKey.length === 0) {
    context.log.error('OPENAI_API_KEY not found or empty in environment variables');
    const relevantEnvVars = Object.keys(process.env).filter(k => 
      k.includes('OPENAI') || k.includes('API') || k.includes('KEY')
    );
    context.log('Available env vars with OPENAI/API/KEY:', relevantEnvVars);
    context.log('OPENAI_API_KEY exists?', !!process.env.OPENAI_API_KEY);
    context.log('VITE_OPENAI_API_KEY exists?', !!process.env.VITE_OPENAI_API_KEY);
    if (process.env.OPENAI_API_KEY) {
      context.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY.length);
      context.log('OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY.substring(0, 10));
    }
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'OpenAI API not configured',
        details: 'OPENAI_API_KEY environment variable is required but not found. Please verify it is set in Azure Function App Settings → Configuration → Application settings and restart the function app.'
      }),
      headers
    };
    return;
  }
  
  // Log that API key is present (but don't log the actual key)
  context.log('OpenAI API key found, length:', apiKey.length, 'starts with:', apiKey.substring(0, 7));

  try {
    const maxWords = 50;
    
    // Build context from dreams
    const dreamContext = Array.isArray(dreams) && dreams.length > 0
      ? `Their dreams include: ${dreams.map(d => `"${d.title}" (${d.category || 'General'})`).join(', ')}.`
      : '';

    let systemPrompt, userPrompt;

    if (action === 'polish') {
      // Polish existing vision
      systemPrompt = `You are a skilled editor helping refine personal vision statements.
Keep the same meaning and personal voice, but make it more powerful and inspiring.
Write in first person. Be concise - around 40-60 words. 
Don't add new ideas, just polish what's there.`;

      userPrompt = `Please polish this vision statement while keeping my voice:
"${userInput.trim()}"

${dreamContext}

Make it sound more visionary and confident, but still authentically me.`;
    } else {
      // Generate new vision
      systemPrompt = `You are a visionary life coach helping someone craft an inspiring, personal vision statement. 
Write in first person, present tense. Be warm, authentic, and aspirational - not corporate or generic.
The tone should feel like a confident dreamer speaking from the heart.
Keep it to ${maxWords} words maximum. Make every word count.`;

      userPrompt = `Here's what I shared about my mindset, goals, and hopes:
"${userInput.trim()}"

${dreamContext}

Transform this into a powerful, personal vision statement that captures my aspirations. 
Make it sound like ME - confident, inspired, and ready to make it happen.`;
    }

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

