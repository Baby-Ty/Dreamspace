const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});

const database = client.database('dreamspace');
const container = database.container('users');

module.exports = async function (context, req) {
  const userId = context.bindingData.userId;
  const userData = req.body;

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

  if (!userData) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User data is required' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
    return;
  }

  try {
    const document = {
      id: userId,
      userId: userId,
      ...userData,
      lastUpdated: new Date().toISOString()
    };

    const { resource } = await container.items.upsert(document);
    
    context.res = {
      status: 200,
      body: JSON.stringify({ success: true, id: resource.id }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  } catch (error) {
    context.log.error('Error saving user data:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};
