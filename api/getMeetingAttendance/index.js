const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'coach'
}, async (context, req, { provider }) => {
  const teamId = context.bindingData.teamId;

  if (!teamId) {
    throw { status: 400, message: 'Team ID is required' };
  }
  
  // Validate teamId format
  if (typeof teamId !== 'string' || !teamId.trim()) {
    throw { 
      status: 400, 
      message: 'Invalid team ID',
      details: 'teamId must be a non-empty string'
    };
  }

  const attendanceContainer = provider.getContainer('meeting_attendance');
  
  // Query meetings for this team without ORDER BY to avoid composite index requirement
  const query = {
    query: 'SELECT * FROM c WHERE c.teamId = @teamId',
    parameters: [{ name: '@teamId', value: teamId }]
  };

  const { resources: meetings } = await attendanceContainer.items.query(query).fetchAll();

  // Sort in JavaScript (more reliable than SQL ORDER BY)
  meetings.sort((a, b) => {
    // Primary sort: by date (newest first)
    const aDate = new Date(a.date || 0).getTime();
    const bDate = new Date(b.date || 0).getTime();
    if (aDate !== bDate) return bDate - aDate;
    
    // Secondary sort: by createdAt (newest first)
    const aCreated = new Date(a.createdAt || 0).getTime();
    const bCreated = new Date(b.createdAt || 0).getTime();
    return bCreated - aCreated;
  });

  context.log(`✅ Retrieved ${meetings.length} meetings for team ${teamId}`);

  return {
    success: true,
    meetings,
    count: meetings.length
  };
});
