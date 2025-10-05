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

    // Create updated document with profile data
    const updatedDocument = {
      id: userId,
      userId: userId,
      // Keep existing data if it exists
      ...(existingDocument || {}),
      // Update with new profile data (both at root level and in currentUser for consistency)
      name: profileData.displayName || profileData.name || existingDocument?.name || 'Unknown User',
      email: profileData.mail || profileData.userPrincipalName || profileData.email || existingDocument?.email || '',
      office: profileData.region || profileData.officeLocation || profileData.city || profileData.office || existingDocument?.office || 'Remote',
      avatar: profileData.picture || existingDocument?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.displayName || profileData.name || 'User')}&background=6366f1&color=fff&size=100`,
      // Additional profile fields from edit modal
      title: profileData.title || existingDocument?.title || '',
      department: profileData.department || existingDocument?.department || '',
      manager: profileData.manager || existingDocument?.manager || '',
      roles: profileData.roles || existingDocument?.roles || { admin: false, coach: false, employee: true, people: false },
      
      // Update currentUser nested structure for consistency with getAllUsers API
      currentUser: {
        // Keep existing currentUser data
        ...(existingDocument?.currentUser || {}),
        // Update with new profile data
        name: profileData.displayName || profileData.name || existingDocument?.currentUser?.name || existingDocument?.name || 'Unknown User',
        email: profileData.mail || profileData.userPrincipalName || profileData.email || existingDocument?.currentUser?.email || existingDocument?.email || '',
        office: profileData.region || profileData.officeLocation || profileData.city || profileData.office || existingDocument?.currentUser?.office || existingDocument?.office || 'Remote',
        avatar: profileData.picture || existingDocument?.currentUser?.avatar || existingDocument?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.displayName || profileData.name || 'User')}&background=6366f1&color=fff&size=100`,
        title: profileData.title || existingDocument?.currentUser?.title || existingDocument?.title || '',
        department: profileData.department || existingDocument?.currentUser?.department || existingDocument?.department || '',
        manager: profileData.manager || existingDocument?.currentUser?.manager || existingDocument?.manager || '',
        roles: profileData.roles || existingDocument?.currentUser?.roles || existingDocument?.roles || { admin: false, coach: false, employee: true, people: false },
        // Keep existing currentUser fields
        score: existingDocument?.currentUser?.score || existingDocument?.score || 0,
        dreamBook: existingDocument?.currentUser?.dreamBook || existingDocument?.dreamBook || [],
        dreamsCount: existingDocument?.currentUser?.dreamsCount || existingDocument?.dreamsCount || 0,
        connectsCount: existingDocument?.currentUser?.connectsCount || existingDocument?.connectsCount || 0,
        dreamCategories: existingDocument?.currentUser?.dreamCategories || existingDocument?.dreamCategories || [],
        careerGoals: existingDocument?.currentUser?.careerGoals || existingDocument?.careerGoals || [],
        connects: existingDocument?.currentUser?.connects || existingDocument?.connects || [],
        lastUpdated: new Date().toISOString()
      },
      
      // Initialize default fields if they don't exist
      dreamBook: existingDocument?.dreamBook || [],
      careerGoals: existingDocument?.careerGoals || [],
      developmentPlan: existingDocument?.developmentPlan || [],
      score: existingDocument?.score || 0,
      connects: existingDocument?.connects || [],
      dreamCategories: existingDocument?.dreamCategories || [],
      dreamsCount: existingDocument?.dreamsCount || 0,
      connectsCount: existingDocument?.connectsCount || 0,
      role: existingDocument?.role || 'user',
      isActive: existingDocument?.isActive !== false,
      lastUpdated: new Date().toISOString(),
      profileUpdated: new Date().toISOString()
    };

    const { resource } = await container.items.upsert(updatedDocument);
    
    context.log('Successfully updated user profile:', resource.id, 'Name:', resource.name);
    context.log('Updated office fields - root office:', resource.office, 'currentUser.office:', resource.currentUser?.office);
    
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
