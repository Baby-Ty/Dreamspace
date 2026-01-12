const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user',
  containerName: 'users'
}, async (context, req, { container: usersContainer }) => {
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
    // Extract the best available profile data - prioritize currentUser data if available
    const currentUser = user.currentUser || {};
    const bestName = currentUser.name || user.name || user.displayName || 'Unknown User';
    const bestEmail = currentUser.email || user.email || user.userPrincipalName || user.mail || '';
    const bestOffice = currentUser.office || user.office || user.officeLocation || 'Unknown';
    const bestAvatar = currentUser.avatar || user.avatar || user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(bestName)}&background=6366f1&color=fff&size=100`;
    
    const formattedUser = {
      id: user.userId || user.id,
      userId: user.userId || user.id,
      name: bestName,
      email: bestEmail,
      office: bestOffice,
      avatar: bestAvatar,
      cardBackgroundImage: currentUser.cardBackgroundImage || user.cardBackgroundImage,
      score: currentUser.score || user.score || 0,
      dreamsCount: (currentUser.dreamBook && currentUser.dreamBook.length) || (user.dreamBook && user.dreamBook.length) || currentUser.dreamsCount || user.dreamsCount || 0,
      connectsCount: currentUser.connectsCount || user.connectsCount || 0,
      role: user.role || 'user', // user, coach, manager, admin
      roles: user.roles || { admin: false, coach: false, employee: true }, // Include roles object for Edit User modal
      isActive: user.isActive !== false,
      lastActiveAt: user.lastActiveAt || user.lastModified || new Date().toISOString(),
      createdAt: user.createdAt || user._ts ? new Date(user._ts * 1000).toISOString() : new Date().toISOString(),
      // Additional profile fields for People Hub
      title: user.title || '',
      department: user.department || '',
      manager: user.manager || '',
      assignedCoachId: user.assignedCoachId || '',
      teamName: user.teamName || '',
      // Include complete dream data for Dream Connect
      dreamBook: currentUser.dreamBook || user.dreamBook || [],
      sampleDreams: currentUser.sampleDreams || user.sampleDreams || [],
      dreamCategories: currentUser.dreamCategories || user.dreamCategories || [],
      careerGoals: currentUser.careerGoals || user.careerGoals || [],
      skills: currentUser.skills || user.skills || [],
      connects: currentUser.connects || user.connects || [],
      isCoach: currentUser.isCoach || user.isCoach || false
    };
    
    // Log the data sources for debugging
    context.log(`User ${formattedUser.id}: Using name "${bestName}" from ${currentUser.name ? 'currentUser' : user.name ? 'user' : 'default'}`);
    
    return formattedUser;
  });

  context.log(`Successfully retrieved ${formattedUsers.length} users from Cosmos DB`);

  return {
    success: true,
    users: formattedUsers,
    count: formattedUsers.length,
    timestamp: new Date().toISOString()
  };
});
