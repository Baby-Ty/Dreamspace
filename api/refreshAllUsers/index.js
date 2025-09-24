const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, container;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  container = database.container('users');
}

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

  // Check if Cosmos DB is configured
  if (!container) {
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Database not configured' }),
      headers
    };
    return;
  }

  try {
    context.log('🔄 Starting refresh of all users with "Unknown User" names...');
    
    // Query all users with "Unknown User" names
    const query = {
      query: 'SELECT * FROM c WHERE c.name = @unknownName OR c.name = @nullName OR NOT IS_DEFINED(c.name)',
      parameters: [
        { name: '@unknownName', value: 'Unknown User' },
        { name: '@nullName', value: '' }
      ]
    };

    const { resources: usersToUpdate } = await container.items.query(query).fetchAll();
    
    context.log(`Found ${usersToUpdate.length} users to potentially update`);

    let updatedCount = 0;
    const results = [];

    for (const user of usersToUpdate) {
      try {
        // For now, we'll update with placeholder data based on their ID
        // In a real scenario, you'd fetch from Microsoft Graph API
        const updatedUser = {
          ...user,
          name: user.displayName || `User ${user.id.substring(0, 8)}`,
          email: user.email || user.userPrincipalName || `user.${user.id.substring(0, 8)}@company.com`,
          office: user.office || user.officeLocation || 'Office Location',
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || `User ${user.id.substring(0, 8)}`)}&background=6366f1&color=fff&size=100`,
          lastUpdated: new Date().toISOString(),
          profileRefreshed: new Date().toISOString()
        };

        // Only update if we have better data
        if (updatedUser.name !== 'Unknown User' && updatedUser.name !== user.name) {
          await container.items.upsert(updatedUser);
          updatedCount++;
          results.push({
            id: user.id,
            oldName: user.name,
            newName: updatedUser.name,
            status: 'updated'
          });
          context.log(`Updated user ${user.id}: "${user.name}" -> "${updatedUser.name}"`);
        } else {
          results.push({
            id: user.id,
            name: user.name,
            status: 'skipped - no better data available'
          });
        }
      } catch (error) {
        context.log.error(`Error updating user ${user.id}:`, error);
        results.push({
          id: user.id,
          status: 'error',
          error: error.message
        });
      }
    }

    context.log(`✅ Refresh complete: ${updatedCount}/${usersToUpdate.length} users updated`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: `Refreshed ${updatedCount} out of ${usersToUpdate.length} users`,
        updatedCount,
        totalChecked: usersToUpdate.length,
        results
      }),
      headers
    };

  } catch (error) {
    context.log.error('Error refreshing users:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
      headers
    };
  }
};
