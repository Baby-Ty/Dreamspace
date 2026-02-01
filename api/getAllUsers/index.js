const { createApiHandler } = require('../utils/apiWrapper');
const { getUserRole } = require('../utils/authMiddleware');

module.exports = createApiHandler({
  auth: 'user',
  containerName: 'users'
}, async (context, req, { container: usersContainer, user, provider }) => {
  // Check if inactive users should be included (admins only)
  const includeInactive = req.query.includeInactive === 'true';
  
  // Check caller's role to determine data access level
  // Coaches and admins get full user data; regular users get minimal data (for Dream Connect)
  let callerIsPrivileged = false;
  if (user && user.userId) {
    const { isCoach, isAdmin } = await getUserRole(user.userId, context);
    callerIsPrivileged = isCoach || isAdmin;
    context.log(`Caller ${user.userId} privilege level: ${callerIsPrivileged ? 'coach/admin' : 'regular user'}, includeInactive: ${includeInactive}`);
  }

  // Query all users from users container
  const query = {
    query: 'SELECT * FROM c WHERE c.type = @type OR NOT IS_DEFINED(c.type)',
    parameters: [
      { name: '@type', value: 'user' }
    ]
  };

  const { resources: users } = await usersContainer.items.query(query).fetchAll();
  
  // Load dreams from dreams container (v3 6-container architecture stores dreams separately)
  // This is needed because user profiles no longer contain dreamBook arrays
  const dreamsContainer = provider.getContainer('dreams');
  const dreamsQuery = {
    query: 'SELECT c.id, c.userId, c.dreams, c.dreamBook FROM c'
  };
  const { resources: dreamsDocs } = await dreamsContainer.items.query(dreamsQuery).fetchAll();
  
  // Create a map of userId -> dreams for efficient lookup
  const dreamsByUser = {};
  for (const doc of dreamsDocs) {
    const userId = doc.userId || doc.id;
    dreamsByUser[userId] = doc.dreams || doc.dreamBook || [];
  }
  
  // Transform users to match the expected format
  // Data returned depends on caller's privilege level
  const formattedUsers = users.map(userData => {
    // Extract the best available profile data - prioritize currentUser data if available
    const currentUser = userData.currentUser || {};
    const bestName = currentUser.name || userData.name || userData.displayName || 'Unknown User';
    const bestOffice = currentUser.office || userData.office || userData.officeLocation || 'Unknown';
    const bestAvatar = currentUser.avatar || userData.avatar || userData.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(bestName)}&background=6366f1&color=fff&size=100`;
    
    // Skip inactive users by default (unless includeInactive=true)
    // Note: isActive defaults to true if not set
    const isActiveUser = userData.isActive !== false;
    if (!includeInactive && !isActiveUser) {
      return null; // Will be filtered out below
    }
    
    // BASE fields returned to ALL authenticated users (for Dream Connect/Dream Team)
    // This includes what's needed to display user cards and find connection suggestions
    // For v3 users, dreams are in dreams container; for v1/v2, they're in user document
    const userIdForDreams = userData.userId || userData.id;
    const dreamsFromContainer = dreamsByUser[userIdForDreams] || [];
    const allDreams = dreamsFromContainer.length > 0 
      ? dreamsFromContainer 
      : (currentUser.dreamBook || userData.dreamBook || []);
    // Only include PUBLIC dreams for non-privileged users (frontend filters dreamBook for isPublic)
    const publicDreams = allDreams.filter(dream => dream.isPublic === true);
    
    // Extract categories from dreams if not stored on user profile
    const dreamsCategories = [...new Set(allDreams.map(d => d.category).filter(Boolean))];
    const userCategories = currentUser.dreamCategories || userData.dreamCategories || [];
    const finalCategories = userCategories.length > 0 ? userCategories : dreamsCategories;
    
    const baseUser = {
      id: userData.userId || userData.id,
      userId: userData.userId || userData.id,
      name: bestName,
      office: bestOffice,
      avatar: bestAvatar,
      cardBackgroundImage: currentUser.cardBackgroundImage || userData.cardBackgroundImage,
      score: currentUser.score || userData.score || 0,
      dreamsCount: allDreams.length || currentUser.dreamsCount || userData.dreamsCount || 0,
      connectsCount: currentUser.connectsCount || userData.connectsCount || 0,
      // Categories needed for Dream Connect matching (derived from dreams if not on profile)
      dreamCategories: finalCategories,
      // dreamBook with ONLY public dreams - frontend components filter this for display
      // This maintains backwards compatibility with ConnectionCard and TeamMemberCard
      dreamBook: publicDreams,
      // Sample dreams for connection suggestions (generated from public dreams or categories)
      sampleDreams: publicDreams.length > 0 
        ? publicDreams.slice(0, 3).map(d => ({ title: d.title, category: d.category, image: d.image }))
        : (currentUser.sampleDreams || userData.sampleDreams || []),
      isActive: userData.isActive !== false,
      isCoach: currentUser.isCoach || userData.isCoach || false
    };

    // If caller is NOT privileged (coach/admin), return only base fields
    if (!callerIsPrivileged) {
      return baseUser;
    }

    // EXTENDED fields returned only to coaches and admins
    const bestEmail = currentUser.email || userData.email || userData.userPrincipalName || userData.mail || '';
    
    const extendedUser = {
      ...baseUser,
      // Sensitive/PII fields - only for coaches/admins
      email: bestEmail,
      role: userData.role || 'user',
      roles: userData.roles || { admin: false, coach: false, employee: true },
      lastActiveAt: userData.lastActiveAt || userData.lastModified || new Date().toISOString(),
      createdAt: userData.createdAt || userData._ts ? new Date(userData._ts * 1000).toISOString() : new Date().toISOString(),
      // Profile fields for People Hub management
      title: userData.title || '',
      department: userData.department || '',
      manager: userData.manager || '',
      assignedCoachId: userData.assignedCoachId || '',
      teamName: userData.teamName || '',
      // Full dream/career data - only for coaches/admins (includes ALL dreams, not just public)
      dreamBook: allDreams,
      sampleDreams: currentUser.sampleDreams || userData.sampleDreams || [],
      careerGoals: currentUser.careerGoals || userData.careerGoals || [],
      skills: currentUser.skills || userData.skills || [],
      connects: currentUser.connects || userData.connects || []
    };
    
    return extendedUser;
  }).filter(Boolean); // Remove null entries (inactive users when includeInactive=false)

  context.log(`Successfully retrieved ${formattedUsers.length} users from Cosmos DB (privileged: ${callerIsPrivileged}, includeInactive: ${includeInactive})`);

  return {
    success: true,
    users: formattedUsers,
    count: formattedUsers.length,
    timestamp: new Date().toISOString()
  };
});
