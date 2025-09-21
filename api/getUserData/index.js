const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});

const database = client.database('dreamspace');
const container = database.container('users');

module.exports = async function (context, req) {
  const userId = context.bindingData.userId;

  if (!userId) {
    context.res = {
      status: 400,
      body: { error: 'User ID is required' }
    };
    return;
  }

  try {
    const { resource } = await container.item(userId, userId).read();
    
    if (resource) {
      // Remove Cosmos DB specific fields
      const { id, _rid, _self, _etag, _attachments, _ts, lastUpdated, ...userData } = resource;
      
      context.res = {
        status: 200,
        body: userData,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    } else {
      context.res = {
        status: 404,
        body: { error: 'User not found' },
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }
  } catch (error) {
    if (error.code === 404) {
      context.res = {
        status: 404,
        body: { error: 'User not found' },
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    } else {
      context.log.error('Error loading user data:', error);
      context.res = {
        status: 500,
        body: { error: 'Internal server error' },
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }
  }
};
