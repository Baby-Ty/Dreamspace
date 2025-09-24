const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, usersContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  usersContainer = database.container('users');
}

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

  // Check if Cosmos DB is configured
  if (!usersContainer) {
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Database not configured', 
        details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required' 
      }),
      headers
    };
    return;
  }

  try {
    // Query all users
    const query = {
      query: 'SELECT * FROM c WHERE c.type = @type OR NOT IS_DEFINED(c.type)',
      parameters: [
        { name: '@type', value: 'user' }
      ]
    };

    const { resources: users } = await usersContainer.items.query(query).fetchAll();
    
    // Transform users to match the expected format
    const formattedUsers = users.map(user => {
      const formattedUser = {
        id: user.userId || user.id,
        name: user.name || user.displayName || 'Unknown User',
        email: user.email || user.userPrincipalName || '',
        office: user.office || user.officeLocation || 'Unknown',
        avatar: user.avatar || user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=6366f1&color=fff&size=100`,
        score: user.score || 0,
        dreamsCount: (user.dreamBook && user.dreamBook.length) || 0,
        connectsCount: user.connectsCount || 0,
        role: user.role || 'user', // user, coach, manager, admin
        isActive: user.isActive !== false,
        lastActiveAt: user.lastActiveAt || user.lastModified || new Date().toISOString(),
        createdAt: user.createdAt || user._ts ? new Date(user._ts * 1000).toISOString() : new Date().toISOString()
      };
      
      // Log raw vs formatted for debugging
      context.log('Raw user data:', JSON.stringify(user));
      context.log('Formatted user:', JSON.stringify(formattedUser));
      
      return formattedUser;
    });

    context.log(`Successfully retrieved ${formattedUsers.length} users from Cosmos DB`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        users: formattedUsers,
        count: formattedUsers.length,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error retrieving users:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to retrieve users',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};
