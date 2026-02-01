const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'bindingData.userId',
  containerName: 'users'
}, async (context, req, { container }) => {
  const userId = context.bindingData.userId;
  const profileData = req.body;

  context.log('Updating user profile for userId:', userId, 'Profile data:', JSON.stringify(profileData));
  context.log('Office/Region field mappings - region:', profileData?.region, 'officeLocation:', profileData?.officeLocation, 'city:', profileData?.city, 'office:', profileData?.office);
  context.log('Card background image in request:', {
    hasCardBackgroundImage: profileData && 'cardBackgroundImage' in profileData,
    cardBackgroundImage: profileData?.cardBackgroundImage ? profileData.cardBackgroundImage.substring(0, 80) : profileData?.cardBackgroundImage,
    type: typeof profileData?.cardBackgroundImage
  });

  if (!userId) {
    throw { status: 400, message: 'User ID is required' };
  }

  if (!profileData) {
    throw { status: 400, message: 'Profile data is required' };
  }

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
    cardBackgroundImage: profileData.cardBackgroundImage !== undefined && profileData.cardBackgroundImage !== null && profileData.cardBackgroundImage !== '' 
      ? profileData.cardBackgroundImage 
      : (existingDocument?.cardBackgroundImage || undefined),
    // Additional profile fields
    title: profileData.title || existingDocument?.title || '',
    department: profileData.department || existingDocument?.department || '',
    manager: profileData.manager || existingDocument?.manager || '',
    // SECURITY: Never trust client-supplied roles - they must be set via admin endpoints
    // (promoteUserToCoach, assignUserToCoach, etc.) to prevent privilege escalation
    // Only preserve existing roles from the database
    roles: {
      admin: existingDocument?.roles?.admin ?? false,
      coach: existingDocument?.roles?.coach ?? false,
      employee: existingDocument?.roles?.employee ?? true
    },
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
    // Derive role from roles object (admin > coach > user)
    // SECURITY: Only use existing database roles, never client-supplied values
    role: existingDocument?.roles?.admin ? 'admin' 
        : existingDocument?.roles?.coach ? 'coach' 
        : 'user',
    // Derive isCoach from database roles for backward compatibility
    isCoach: existingDocument?.roles?.coach ?? false,
    // Allow isActive to be set from request (for deactivation/reactivation)
    // If not provided in request, preserve existing value (defaults to true)
    isActive: profileData.isActive !== undefined ? profileData.isActive : (existingDocument?.isActive !== false),
    createdAt: existingDocument?.createdAt || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    profileUpdated: new Date().toISOString()
  };

  // Debug: Log what we're about to save
  context.log('📥 RECEIVED from client:', JSON.stringify({
    profileData_roles: profileData.roles,
    existingDoc_roles: existingDocument?.roles
  }));
  
  context.log('💾 WRITE (about to save):', {
    container: 'users',
    partitionKey: userId,
    id: updatedDocument.id,
    operation: 'upsert',
    dataStructureVersion: updatedDocument.dataStructureVersion,
    role: updatedDocument.role,
    roles: updatedDocument.roles,
    isCoach: updatedDocument.isCoach,
    cardBackgroundImage: updatedDocument.cardBackgroundImage ? 'present' : 'missing'
  });
  
  const { resource } = await container.items.upsert(updatedDocument);
  
  context.log('✅ SAVED to DB:', JSON.stringify({
    id: resource.id,
    role: resource.role,
    roles: resource.roles,
    isCoach: resource.isCoach
  }));
  
  context.log('Successfully updated user profile:', resource.id, 'Name:', resource.name, 'Office:', resource.office, 'dataStructureVersion:', resource.dataStructureVersion, 'cardBackgroundImage:', resource.cardBackgroundImage ? resource.cardBackgroundImage.substring(0, 80) : 'undefined');
  
  return { 
    success: true, 
    id: resource.id,
    name: resource.name,
    email: resource.email,
    office: resource.office,
    title: resource.title,
    department: resource.department,
    manager: resource.manager,
    roles: resource.roles
  };
});
