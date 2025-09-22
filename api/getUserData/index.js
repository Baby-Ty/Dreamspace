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
      body: JSON.stringify({ error: 'User ID is required' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
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
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    } else {
      context.res = {
        status: 404,
        body: JSON.stringify({ error: 'User not found' }),
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
        body: JSON.stringify({ error: 'User not found' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    } else {
      context.log.error('Error loading user data:', error);
      context.res = {
        status: 500,
        body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }
  }
};
