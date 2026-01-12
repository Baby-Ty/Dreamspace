const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'bindingData.userId',
  containerName: 'scoring'
}, async (context, req, { container: scoringContainer }) => {
  const userId = context.bindingData.userId;
  
  context.log(`getAllYearsScoring called with userId: ${userId}`);

  if (!userId) {
    throw { status: 400, message: 'User ID is required' };
  }

  // Query all scoring documents for this user across all years
  const query = {
    query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.year DESC',
    parameters: [{ name: '@userId', value: userId }]
  };
  
  context.log(`🔍 Querying scoring container for user: ${userId}`);
  
  const { resources } = await scoringContainer.items.query(query).fetchAll();
  
  context.log(`✅ Found ${resources.length} scoring document(s) for user ${userId}`);
  
  // Calculate all-time total
  const allTimeTotal = resources.reduce((sum, doc) => sum + (doc.totalScore || 0), 0);
  
  context.log(`📊 All-time total: ${allTimeTotal} points across ${resources.length} year(s)`);
  
  // Return array of scoring documents sorted by year descending
  return resources;
});
