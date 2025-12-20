/**
 * Azure Function: Save AI Prompts Configuration
 * Persists prompt configuration changes to Cosmos DB
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

  const { prompts, modifiedBy } = req.body || {};

  context.log('savePrompts called:', { 
    hasPrompts: !!prompts,
    modifiedBy: modifiedBy || 'unknown'
  });

  // Validate input
  if (!prompts || typeof prompts !== 'object') {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Prompts data is required' }),
      headers
    };
    return;
  }

  // Validate structure
  const requiredSections = ['imageGeneration', 'visionGeneration', 'styleModifiers'];
  for (const section of requiredSections) {
    if (!prompts[section]) {
      context.res = {
        status: 400,
        body: JSON.stringify({ error: `Missing required section: ${section}` }),
        headers
      };
      return;
    }
  }

  try {
    const cosmosProvider = getCosmosProvider();
    if (!cosmosProvider) {
      context.res = {
        status: 500,
        body: JSON.stringify({ 
          error: 'Database connection failed',
          details: 'Cosmos DB provider not initialized'
        }),
        headers
      };
      return;
    }

    // Get current prompts to save to history before updating
    const currentPrompts = await cosmosProvider.getPrompts();
    
    // Save current version to history if it exists (non-blocking - don't fail if history save fails)
    if (currentPrompts) {
      try {
        const historyEntry = await cosmosProvider.addPromptHistoryEntry(
          currentPrompts, 
          currentPrompts.modifiedBy || 'unknown',
          `Snapshot before update by ${modifiedBy || 'system'}`
        );
        if (historyEntry) {
          context.log(`📜 Saved prompt history entry: ${historyEntry.version}`);
        } else {
          context.log('⚠️ History entry not saved (container may not exist)');
        }
      } catch (historyError) {
        // Log but don't fail - history is optional
        context.log.warn('⚠️ Failed to save history entry (non-blocking):', historyError.message);
      }
    }

    // Save prompts with metadata
    const savedPrompts = await cosmosProvider.upsertPrompts(prompts, modifiedBy || 'system');
    
    // Clean metadata before returning
    const cleanPrompts = cosmosProvider.cleanMetadata(savedPrompts);

    context.log('✅ Saved prompts configuration');

    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true,
        prompts: cleanPrompts
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error saving prompts:', error);
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

