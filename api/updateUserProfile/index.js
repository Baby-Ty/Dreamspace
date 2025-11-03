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

  const userId = context.bindingData.userId;
  const profileData = req.body;

  context.log('Updating user profile for userId:', userId, 'Profile data:', JSON.stringify(profileData));
  context.log('Office/Region field mappings - region:', profileData.region, 'officeLocation:', profileData.officeLocation, 'city:', profileData.city, 'office:', profileData.office);

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID is required' }),
      headers
    };
    return;
  }

  if (!profileData) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Profile data is required' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!container) {
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Database not configured', details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required' }),
      headers
    };
    return;
  }

  try {
    // First, try to get the existing user document
    let existingDocument = null;
    try {
      const { resource } = await container.item(userId, userId).read();
      existingDocument = resource;
    } catch (error) {
      if (error.code !== 404) {
        throw error; // Re-throw if it's not a "not found" error
      }
      // User doesn't exist yet - that's okay, we'll create a new one
    }

    // Create updated document with ONLY profile data (6-container architecture)
    // Arrays (dreams, connects, etc.) are stored in separate containers
    const updatedDocument = {
      id: userId,
      userId: userId,
      // Basic profile fields
      name: profileData.displayName || profileData.name || existingDocument?.name || 'Unknown User',
      email: profileData.mail || profileData.userPrincipalName || profileData.email || existingDocument?.email || '',
      office: profileData.region || profileData.officeLocation || profileData.city || profileData.office || existingDocument?.office || 'Remote',
      avatar: profileData.picture || existingDocument?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.displayName || profileData.name || 'User')}&background=6366f1&color=fff&size=100`,
      // Additional profile fields
      title: profileData.title || existingDocument?.title || '',
      department: profileData.department || existingDocument?.department || '',
      manager: profileData.manager || existingDocument?.manager || '',
      roles: profileData.roles || existingDocument?.roles || { admin: false, coach: false, employee: true, people: false },
      // Aggregates (no arrays, just counts)
      score: existingDocument?.score || 0,
      dreamsCount: existingDocument?.dreamsCount || 0,
      connectsCount: existingDocument?.connectsCount || 0,
      weeksActiveCount: existingDocument?.weeksActiveCount || 0,
      // Current year for convenience
      currentYear: new Date().getFullYear(),
      // Structure version
      dataStructureVersion: 3,
      // Metadata
      role: existingDocument?.role || 'user',
      isActive: existingDocument?.isActive !== false,
      createdAt: existingDocument?.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      profileUpdated: new Date().toISOString()
    };

    context.log('💾 WRITE:', {
      container: 'users',
      partitionKey: userId,
      id: updatedDocument.id,
      operation: 'upsert',
      dataStructureVersion: updatedDocument.dataStructureVersion
    });
    
    const { resource } = await container.items.upsert(updatedDocument);
    
    context.log('Successfully updated user profile:', resource.id, 'Name:', resource.name, 'Office:', resource.office, 'dataStructureVersion:', resource.dataStructureVersion);
    
    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true, 
        id: resource.id,
        name: resource.name,
        email: resource.email,
        office: resource.office,
        title: resource.title,
        department: resource.department,
        manager: resource.manager,
        roles: resource.roles
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error updating user profile:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
      headers
    };
  }
};
