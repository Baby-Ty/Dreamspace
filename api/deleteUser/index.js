const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'admin',
  containerName: 'users'
}, async (context, req, { provider }) => {
  const userId = context.bindingData.userId;

  context.log('🗑️ DELETE USER REQUEST - userId:', userId);

  if (!userId) {
    throw { status: 400, message: 'userId is required' };
  }

  // STEP 1: Validate user exists
  const usersContainer = provider.getContainer('users');
  let userToDelete;
  try {
    const { resource } = await usersContainer.item(userId, userId).read();
    userToDelete = resource;
    context.log('✅ Found user to delete:', userToDelete.name, userToDelete.email);
  } catch (error) {
    if (error.code === 404) {
      throw { status: 404, message: `User ${userId} not found` };
    }
    throw error;
  }

  // STEP 2: Check if user is a coach with team members (BLOCK deletion)
  const teamsContainer = provider.getContainer('teams');
  const { resources: userTeams } = await teamsContainer.items.query({
    query: 'SELECT c.id, c.teamId, c.teamMembers, c.teamName FROM c WHERE c.managerId = @userId',
    parameters: [{ name: '@userId', value: userId }]
  }).fetchAll();

  if (userTeams && userTeams.length > 0) {
    const teamWithMembers = userTeams.find(team => team.teamMembers && team.teamMembers.length > 0);
    if (teamWithMembers) {
      context.log.warn(`❌ BLOCKED: User ${userId} is a coach with ${teamWithMembers.teamMembers.length} team members`);
      throw {
        status: 409,
        message: `Cannot delete user: This user is a coach with ${teamWithMembers.teamMembers.length} team member(s). Please replace the coach or reassign team members before deletion.`,
        teamName: teamWithMembers.teamName,
        teamMembers: teamWithMembers.teamMembers
      };
    }
  }

  // STEP 3: Remove user from any team's teamMembers array
  const { resources: allTeams } = await teamsContainer.items.query({
    query: 'SELECT * FROM c'
  }).fetchAll();

  let teamsUpdated = 0;
  for (const team of allTeams) {
    if (team.teamMembers && team.teamMembers.includes(userId)) {
      team.teamMembers = team.teamMembers.filter(id => id !== userId);
      team.lastModified = new Date().toISOString();
      await teamsContainer.items.upsert(team);
      teamsUpdated++;
      context.log(`✅ Removed ${userId} from team: ${team.teamName}`);
    }
  }

  // STEP 4: Delete user data from all 6 containers
  let deletionResults = {
    userId: userId,
    userName: userToDelete.name,
    userEmail: userToDelete.email,
    teamsUpdated: teamsUpdated,
    deletedDocuments: []
  };

  // 4.1: Delete user profile
  try {
    await usersContainer.item(userId, userId).delete();
    deletionResults.deletedDocuments.push({ container: 'users', id: userId });
    context.log('✅ Deleted user profile');
  } catch (error) {
    if (error.code !== 404) {
      context.log.warn('⚠️ Error deleting user profile:', error.message);
    }
  }

  // 4.2: Delete dreams document
  const dreamsContainer = provider.getContainer('dreams');
  try {
    await dreamsContainer.item(userId, userId).delete();
    deletionResults.deletedDocuments.push({ container: 'dreams', id: userId });
    context.log('✅ Deleted dreams document');
  } catch (error) {
    if (error.code !== 404) {
      context.log.warn('⚠️ Error deleting dreams:', error.message);
    }
  }

  // 4.3: Delete all connects documents
  const connectsContainer = provider.getContainer('connects');
  try {
    const { resources: connects } = await connectsContainer.items.query({
      query: 'SELECT c.id FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }]
    }).fetchAll();

    for (const connect of connects) {
      await connectsContainer.item(connect.id, userId).delete();
      deletionResults.deletedDocuments.push({ container: 'connects', id: connect.id });
    }
    context.log(`✅ Deleted ${connects.length} connect documents`);
  } catch (error) {
    context.log.warn('⚠️ Error deleting connects:', error.message);
  }

  // 4.4: Delete scoring documents
  const scoringContainer = provider.getContainer('scoring');
  try {
    const { resources: scoringDocs } = await scoringContainer.items.query({
      query: 'SELECT c.id FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }]
    }).fetchAll();

    for (const doc of scoringDocs) {
      await scoringContainer.item(doc.id, userId).delete();
      deletionResults.deletedDocuments.push({ container: 'scoring', id: doc.id });
    }
    context.log(`✅ Deleted ${scoringDocs.length} scoring documents`);
  } catch (error) {
    context.log.warn('⚠️ Error deleting scoring:', error.message);
  }

  // 4.5: Delete currentWeek document
  const currentWeekContainer = provider.getContainer('currentWeek');
  try {
    await currentWeekContainer.item(userId, userId).delete();
    deletionResults.deletedDocuments.push({ container: 'currentWeek', id: userId });
    context.log('✅ Deleted currentWeek document');
  } catch (error) {
    if (error.code !== 404) {
      context.log.warn('⚠️ Error deleting currentWeek:', error.message);
    }
  }

  // 4.6: Delete pastWeeks document
  const pastWeeksContainer = provider.getContainer('pastWeeks');
  try {
    await pastWeeksContainer.item(userId, userId).delete();
    deletionResults.deletedDocuments.push({ container: 'pastWeeks', id: userId });
    context.log('✅ Deleted pastWeeks document');
  } catch (error) {
    if (error.code !== 404) {
      context.log.warn('⚠️ Error deleting pastWeeks:', error.message);
    }
  }

  // STEP 5: Delete coach's team if they were a coach with no members
  if (userTeams && userTeams.length > 0) {
    for (const team of userTeams) {
      try {
        await teamsContainer.item(team.id, userId).delete();
        deletionResults.deletedDocuments.push({ container: 'teams', id: team.id });
        context.log(`✅ Deleted coach's team: ${team.teamName}`);
      } catch (error) {
        if (error.code !== 404) {
          context.log.warn('⚠️ Error deleting team:', error.message);
        }
      }
    }
  }

  context.log('🗑️ USER DELETION COMPLETE:', {
    userId: userId,
    documentsDeleted: deletionResults.deletedDocuments.length,
    teamsUpdated: teamsUpdated
  });

  return {
    success: true,
    message: `User ${userToDelete.name} (${userToDelete.email}) has been permanently deleted`,
    ...deletionResults,
    timestamp: new Date().toISOString()
  };
});
