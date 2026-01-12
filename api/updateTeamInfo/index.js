const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'coach',
  containerName: 'teams'
}, async (context, req, { container: teamsContainer }) => {
  const managerId = context.bindingData.managerId;

  if (!managerId) {
    throw { status: 400, message: 'Manager ID is required' };
  }

  const { teamInterests, teamRegions, meetingDraft } = req.body || {};

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

  // Update team with interests, regions, and meeting draft
  const updatedTeam = {
    ...team,
    teamInterests: teamInterests !== undefined ? teamInterests : team.teamInterests,
    teamRegions: teamRegions !== undefined ? teamRegions : team.teamRegions,
    meetingDraft: meetingDraft !== undefined ? meetingDraft : team.meetingDraft,
    lastModified: new Date().toISOString()
  };

  await teamsContainer.item(team.id, team.managerId).replace(updatedTeam);

  context.log(`✅ Successfully updated team info for manager ${managerId}`);

  return {
    success: true,
    data: {
      managerId: managerId,
      teamInterests: updatedTeam.teamInterests,
      teamRegions: updatedTeam.teamRegions,
      meetingDraft: updatedTeam.meetingDraft,
      teamName: updatedTeam.teamName,
      lastModified: updatedTeam.lastModified
    }
  };
});
