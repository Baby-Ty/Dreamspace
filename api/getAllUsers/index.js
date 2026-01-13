const { createApiHandler } = require('../utils/apiWrapper');
const { getUserRole } = require('../utils/authMiddleware');

module.exports = createApiHandler({
  auth: 'user',
  containerName: 'users'
}, async (context, req, { container: usersContainer, user }) => {
  // Check caller's role to determine data access level
  // Coaches and admins get full user data; regular users get minimal data (for Dream Connect)
  let callerIsPrivileged = false;
  if (user && user.userId) {
    const { isCoach, isAdmin } = await getUserRole(user.userId, context);
    callerIsPrivileged = isCoach || isAdmin;
    context.log(`Caller ${user.userId} privilege level: ${callerIsPrivileged ? 'coach/admin' : 'regular user'}`);
  }

  // Query all users
  const query = {
    query: 'SELECT * FROM c WHERE c.type = @type OR NOT IS_DEFINED(c.type)',
    parameters: [
      { name: '@type', value: 'user' }
    ]
  };

  const { resources: users } = await usersContainer.items.query(query).fetchAll();
  
  // Transform users to match the expected format
  // Data returned depends on caller's privilege level
  const formattedUsers = users.map(user => {
    // Extract the best available profile data - prioritize currentUser data if available
    const currentUser = user.currentUser || {};
    const bestName = currentUser.name || user.name || user.displayName || 'Unknown User';
    const bestOffice = currentUser.office || user.office || user.officeLocation || 'Unknown';
    const bestAvatar = currentUser.avatar || user.avatar || user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(bestName)}&background=6366f1&color=fff&size=100`;
    
    // BASE fields returned to ALL authenticated users (for Dream Connect)
    // This includes only what's needed to find and display connection suggestions
    const baseUser = {
      id: user.userId || user.id,
      userId: user.userId || user.id,
      name: bestName,
      office: bestOffice,
      avatar: bestAvatar,
      score: currentUser.score || user.score || 0,
      dreamsCount: (currentUser.dreamBook && currentUser.dreamBook.length) || (user.dreamBook && user.dreamBook.length) || currentUser.dreamsCount || user.dreamsCount || 0,
      connectsCount: currentUser.connectsCount || user.connectsCount || 0,
      // Categories needed for Dream Connect matching (no personal dream details)
      dreamCategories: currentUser.dreamCategories || user.dreamCategories || [],
      isActive: user.isActive !== false,
      isCoach: currentUser.isCoach || user.isCoach || false
    };

    // If caller is NOT privileged (coach/admin), return only base fields
    if (!callerIsPrivileged) {
      return baseUser;
    }

    // EXTENDED fields returned only to coaches and admins
    const bestEmail = currentUser.email || user.email || user.userPrincipalName || user.mail || '';
    
    const extendedUser = {
      ...baseUser,
      // Sensitive/PII fields - only for coaches/admins
      email: bestEmail,
      cardBackgroundImage: currentUser.cardBackgroundImage || user.cardBackgroundImage,
      role: user.role || 'user',
      roles: user.roles || { admin: false, coach: false, employee: true },
      lastActiveAt: user.lastActiveAt || user.lastModified || new Date().toISOString(),
      createdAt: user.createdAt || user._ts ? new Date(user._ts * 1000).toISOString() : new Date().toISOString(),
      // Profile fields for People Hub management
      title: user.title || '',
      department: user.department || '',
      manager: user.manager || '',
      assignedCoachId: user.assignedCoachId || '',
      teamName: user.teamName || '',
      // Full dream/career data - only for coaches/admins
      dreamBook: currentUser.dreamBook || user.dreamBook || [],
      sampleDreams: currentUser.sampleDreams || user.sampleDreams || [],
      careerGoals: currentUser.careerGoals || user.careerGoals || [],
      skills: currentUser.skills || user.skills || [],
      connects: currentUser.connects || user.connects || []
    };
    
    return extendedUser;
  });

  context.log(`Successfully retrieved ${formattedUsers.length} users from Cosmos DB (privileged: ${callerIsPrivileged})`);

  return {
    success: true,
    users: formattedUsers,
    count: formattedUsers.length,
    timestamp: new Date().toISOString()
  };
});
