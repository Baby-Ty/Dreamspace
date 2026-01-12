/**
 * Azure Function: Save AI Prompts Configuration
 * Persists prompt configuration changes to Cosmos DB
 */

const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'admin'
}, async (context, req, { provider }) => {
  const { prompts, modifiedBy } = req.body || {};

  context.log('savePrompts called:', { 
    hasPrompts: !!prompts,
    modifiedBy: modifiedBy || 'unknown'
  });

  // Validate input
  if (!prompts || typeof prompts !== 'object') {
    throw { status: 400, message: 'Prompts data is required' };
  }

  // Validate structure
  const requiredSections = ['imageGeneration', 'visionGeneration', 'styleModifiers'];
  for (const section of requiredSections) {
    if (!prompts[section]) {
      throw { status: 400, message: `Missing required section: ${section}` };
    }
  }

  // Get current prompts to save to history before updating
  const currentPrompts = await provider.getPrompts();
  
  // Save current version to history if it exists (non-blocking - don't fail if history save fails)
  if (currentPrompts) {
    try {
      const historyEntry = await provider.addPromptHistoryEntry(
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
  const savedPrompts = await provider.upsertPrompts(prompts, modifiedBy || 'system');
  
  // Clean metadata before returning
  const cleanPrompts = provider.cleanMetadata(savedPrompts);

  context.log('✅ Saved prompts configuration');

  return { success: true, prompts: cleanPrompts };
});
