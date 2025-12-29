const { getCosmosProvider } = require('../utils/cosmosProvider');

module.exports = async function (context, req) {
  const teamId = context.bindingData.teamId;

  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  if (!teamId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Team ID is required' }),
      headers
    };
    return;
  }
  
  // Validate teamId format
  if (typeof teamId !== 'string' || !teamId.trim()) {
    context.res = {
      status: 400,
      body: JSON.stringify({ 
        error: 'Invalid team ID',
        details: 'teamId must be a non-empty string'
      }),
      headers
    };
    return;
  }

  const cosmosProvider = getCosmosProvider();
  if (!cosmosProvider) {
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Database not configured', 
        details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required' 
      }),
      headers
    };
    return;
  }

  try {
    const attendanceContainer = cosmosProvider.getContainer('meeting_attendance');
    
    // Query meetings for this team, ordered by date descending
    // Note: Using single field ORDER BY to avoid composite index requirement
    const query = {
      query: 'SELECT * FROM c WHERE c.teamId = @teamId ORDER BY c.date DESC',
      parameters: [
        { name: '@teamId', value: teamId }
      ]
    };

    const { resources } = await attendanceContainer.items.query(query).fetchAll();
    
    // Clean metadata from results
    const meetings = resources.map(meeting => cosmosProvider.cleanMetadata(meeting));

    context.log(`✅ Successfully retrieved ${meetings.length} meeting records for team ${teamId}`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        meetings: meetings,
        count: meetings.length,
        teamId: teamId,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error retrieving meeting attendance:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to retrieve meeting attendance',
        details: error.message,
        teamId: teamId,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};

