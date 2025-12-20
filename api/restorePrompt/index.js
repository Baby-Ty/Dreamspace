/**
 * Azure Function: Restore Prompt from History
 * Restores AI prompts configuration from a previous version
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

  const { version, modifiedBy } = req.body || {};

  context.log('restorePrompt called:', { version, modifiedBy });

  // Validate input
  if (!version || typeof version !== 'string') {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Version ID is required' }),
      headers
    };
    return;
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

    // Get the historical version
    const historyEntry = await cosmosProvider.getPromptVersion(version);
    
    if (!historyEntry) {
      context.res = {
        status: 404,
        body: JSON.stringify({ 
          success: false,
          error: 'Version not found',
          details: `No history entry found for version: ${version}`
        }),
        headers
      };
      return;
    }

    // Get current prompts to save to history before restoring
    const currentPrompts = await cosmosProvider.getPrompts();
    
    // Save current version to history before restoring (non-blocking)
    if (currentPrompts) {
      try {
        const historySnapshot = await cosmosProvider.addPromptHistoryEntry(
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
    const restoredPrompts = await cosmosProvider.upsertPrompts(
      historyEntry.prompts, 
      modifiedBy || 'system'
    );
    
    // Clean metadata before returning
    const cleanPrompts = cosmosProvider.cleanMetadata(restoredPrompts);

    context.log(`✅ Restored prompts from version: ${version}`);

    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true,
        prompts: cleanPrompts,
        restoredFrom: {
          version: historyEntry.version,
          timestamp: historyEntry.timestamp,
          originalModifiedBy: historyEntry.modifiedBy
        }
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error restoring prompts:', error);
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

