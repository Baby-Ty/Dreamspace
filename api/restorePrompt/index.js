/**
 * Azure Function: Restore Prompt from History
 * Restores AI prompts configuration from a previous version
 */

const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'admin'
}, async (context, req, { provider }) => {
  const { version, modifiedBy } = req.body || {};

  context.log('restorePrompt called:', { version, modifiedBy });

  // Validate input
  if (!version || typeof version !== 'string') {
    throw { status: 400, message: 'Version ID is required' };
  }

  // Get the historical version
  const historyEntry = await provider.getPromptVersion(version);
  
  if (!historyEntry) {
    throw { 
      status: 404, 
      message: 'Version not found',
      details: `No history entry found for version: ${version}`
    };
  }

  // Get current prompts to save to history before restoring
  const currentPrompts = await provider.getPrompts();
  
  // Save current version to history before restoring (non-blocking)
  if (currentPrompts) {
    try {
      const historySnapshot = await provider.addPromptHistoryEntry(
        currentPrompts, 
        currentPrompts.modifiedBy || 'unknown',
        `Snapshot before restore to ${version} by ${modifiedBy || 'system'}`
      );
      if (historySnapshot) {
        context.log(`📜 Saved prompt history entry before restore: ${historySnapshot.version}`);
      } else {
        context.log('⚠️ History entry not saved (container may not exist)');
      }
    } catch (historyError) {
      // Log but don't fail - history is optional
      context.log.warn('⚠️ Failed to save history entry before restore (non-blocking):', historyError.message);
    }
  }

  // Restore the prompts from history
  const restoredPrompts = await provider.upsertPrompts(
    historyEntry.prompts, 
    modifiedBy || 'system'
  );
  
  // Clean metadata before returning
  const cleanPrompts = provider.cleanMetadata(restoredPrompts);

  context.log(`✅ Restored prompts from version: ${version}`);

  return { 
    success: true,
    prompts: cleanPrompts,
    restoredFrom: {
      version: historyEntry.version,
      timestamp: historyEntry.timestamp,
      originalModifiedBy: historyEntry.modifiedBy
    }
  };
});
