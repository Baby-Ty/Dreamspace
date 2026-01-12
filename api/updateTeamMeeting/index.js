const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'coach',
  containerName: 'teams'
}, async (context, req, { container: teamsContainer }) => {
  const managerId = context.bindingData.managerId;

  if (!managerId) {
    throw { status: 400, message: 'Manager ID is required' };
  }

  const { meeting } = req.body || {};

  if (meeting === undefined) {
    throw { status: 400, message: 'Meeting data is required' };
  }

  // Find the team relationship for this manager
  const teamQuery = {
    query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
    parameters: [
      { name: '@type', value: 'team_relationship' },
      { name: '@managerId', value: managerId }
    ]
  };

  const { resources: teams } = await teamsContainer.items.query(teamQuery).fetchAll();
  
  if (teams.length === 0) {
    throw { status: 404, message: 'No team found for this manager', details: managerId };
  }

  const team = teams[0];

  // Update team with meeting data
  const updatedTeam = {
    ...team,
    nextMeeting: {
      date: meeting.date || null,
      time: meeting.time || null,
      location: meeting.location || null,
      agenda: meeting.agenda || null,
      updatedAt: new Date().toISOString()
    },
    lastModified: new Date().toISOString()
  };

  await teamsContainer.item(team.id, team.managerId).replace(updatedTeam);

  context.log(`✅ Successfully updated team meeting for manager ${managerId}`);

  return {
    success: true,
    data: {
      managerId: managerId,
      nextMeeting: updatedTeam.nextMeeting,
      teamName: updatedTeam.teamName,
      lastModified: updatedTeam.lastModified
    }
  };
});
