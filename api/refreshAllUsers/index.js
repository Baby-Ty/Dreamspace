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
        // Check if the user already has good profile data
        if (user.name && user.name !== 'Unknown User' && !user.name.startsWith('User ')) {
          results.push({
            id: user.id,
            name: user.name,
            status: 'skipped - already has profile data'
          });
          continue;
        }

        // Try to extract meaningful data from existing fields
        let updatedName = user.name || 'Unknown User';
        let updatedEmail = user.email || '';
        let updatedOffice = user.office || 'Remote';

        // Check if we have any Microsoft Graph fields stored but not mapped
        if (user.displayName && user.displayName !== 'Unknown User') {
          updatedName = user.displayName;
        }
        if (user.userPrincipalName && !updatedEmail) {
          updatedEmail = user.userPrincipalName;
        }
        if (user.mail && !updatedEmail) {
          updatedEmail = user.mail;
        }
        if (user.officeLocation && user.officeLocation !== 'Unknown') {
          updatedOffice = user.officeLocation;
        }

        // If still no good name, create a more user-friendly placeholder
        if (updatedName === 'Unknown User' || updatedName.startsWith('User ')) {
          // Extract a more readable name from the ID or email
          if (updatedEmail && updatedEmail.includes('@')) {
            const emailPrefix = updatedEmail.split('@')[0];
            // Convert email prefix to a more readable format
            updatedName = emailPrefix.split('.').map(part => 
              part.charAt(0).toUpperCase() + part.slice(1)
            ).join(' ');
          } else {
            updatedName = `User ${user.id.substring(0, 8)}`;
          }
        }

        const updatedUser = {
          ...user,
          name: updatedName,
          email: updatedEmail || `${user.id.substring(0, 8)}@yourcompany.com`,
          office: updatedOffice,
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedName)}&background=6366f1&color=fff&size=100`,
          lastUpdated: new Date().toISOString(),
          profileRefreshed: new Date().toISOString()
        };

        // Update if we have improvements
        if (updatedUser.name !== user.name || updatedUser.email !== user.email || updatedUser.office !== user.office) {
          await container.items.upsert(updatedUser);
          updatedCount++;
          results.push({
            id: user.id,
            oldName: user.name,
            newName: updatedUser.name,
            oldEmail: user.email,
            newEmail: updatedUser.email,
            status: 'updated with improved data'
          });
          context.log(`Updated user ${user.id}: "${user.name}" -> "${updatedUser.name}"`);
        } else {
          results.push({
            id: user.id,
            name: user.name,
            status: 'no improvements available'
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
