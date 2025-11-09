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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  const userId = 'Tyler.Stewart@netsurit.com';

  if (!usersContainer) {
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Database not configured'
      }),
      headers
    };
    return;
  }

  try {
    context.log(`🔍 Looking for user: ${userId}`);

    // Try different query approaches
    const queries = [
      {
        name: 'By userId field',
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }]
      },
      {
        name: 'By id field',
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: userId }]
      },
      {
        name: 'Case insensitive userId',
        query: 'SELECT * FROM c WHERE LOWER(c.userId) = LOWER(@userId)',
        parameters: [{ name: '@userId', value: userId }]
      }
    ];

    let user = null;
    let queryUsed = null;

    for (const q of queries) {
      context.log(`Trying query: ${q.name}`);
      const { resources: users } = await usersContainer.items.query({
        query: q.query,
        parameters: q.parameters
      }).fetchAll();
      
      if (users.length > 0) {
        user = users[0];
        queryUsed = q.name;
        context.log(`✅ Found user with query: ${q.name}`);
        break;
      }
    }

    if (!user) {
      context.res = {
        status: 404,
        body: JSON.stringify({ 
          error: 'User not found with any query method',
          userId 
        }),
        headers
      };
      return;
    }

    context.log(`📄 Current user data:`, {
      id: user.id,
      userId: user.userId,
      role: user.role,
      isCoach: user.isCoach,
      name: user.name
    });

    // Update user role to coach
    const updatedUser = {
      ...user,
      role: 'coach',
      isCoach: true,
      lastModified: new Date().toISOString(),
      promotedAt: user.promotedAt || new Date().toISOString()
    };

    context.log(`🔧 Attempting update with:`, {
      documentId: user.id,
      partitionKey: user.userId || user.id
    });

    // Try update with both possible partition keys
    let updateSuccess = false;
    let updateMethod = null;

    try {
      // Try with userId as partition key
      context.log(`Trying replace with partition key: ${user.userId}`);
      await usersContainer.item(user.id, user.userId).replace(updatedUser);
      updateSuccess = true;
      updateMethod = 'userId partition key';
      context.log(`✅ Update successful with userId partition key`);
    } catch (error1) {
      context.log(`❌ Failed with userId partition key:`, error1.message);
      
      try {
        // Try with id as partition key
        context.log(`Trying replace with partition key: ${user.id}`);
        await usersContainer.item(user.id, user.id).replace(updatedUser);
        updateSuccess = true;
        updateMethod = 'id partition key';
        context.log(`✅ Update successful with id partition key`);
      } catch (error2) {
        context.log(`❌ Failed with id partition key:`, error2.message);
        throw new Error(`Both partition key attempts failed. userId error: ${error1.message}, id error: ${error2.message}`);
      }
    }

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: 'Tyler Stewart successfully updated to coach role',
        queryUsed,
        updateMethod,
        updatedFields: {
          role: 'coach',
          isCoach: true
        },
        timestamp: new Date().toISOString()
      }),
      headers
    };

  } catch (error) {
    context.log.error('❌ Error fixing Tyler coach role:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to fix Tyler coach role',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};

