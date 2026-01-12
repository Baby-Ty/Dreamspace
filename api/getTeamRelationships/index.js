const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user',
  containerName: 'teams'
}, async (context, req, { container: teamsContainer }) => {
  // Query all team relationships
  const query = {
    query: 'SELECT * FROM c WHERE c.type = @type',
    parameters: [
      { name: '@type', value: 'team_relationship' }
    ]
  };

  const { resources: teams } = await teamsContainer.items.query(query).fetchAll();
  
  // Transform teams to match the expected format
  const formattedTeams = teams.map(team => ({
    id: team.id, // Document ID (stable teamId)
    teamId: team.teamId || team.id, // Stable team identifier for meeting attendance
    managerId: team.managerId,
    teamMembers: team.teamMembers || [],
    teamName: team.teamName,
    managerRole: team.managerRole || 'Dream Coach',
    createdAt: team.createdAt || team._ts ? new Date(team._ts * 1000).toISOString() : new Date().toISOString(),
    lastModified: team.lastModified || new Date().toISOString(),
    isActive: team.isActive !== false
  }));

  context.log(`Successfully retrieved ${formattedTeams.length} team relationships from Cosmos DB`);

  return {
    success: true,
    teams: formattedTeams,
    count: formattedTeams.length,
    timestamp: new Date().toISOString()
  };
});
