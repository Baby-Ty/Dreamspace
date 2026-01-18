const { createApiHandler } = require('../utils/apiWrapper');
const { 
  initializeWeekDocument, 
  extractWeeklyGoals 
} = require('../utils/weekHelpers');
const { 
  loadUserProfile, 
  loadConnects, 
  loadDreamsDocument 
} = require('../utils/userDataLoaders');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'bindingData.userId'
}, async (context, req, { provider }) => {
  const userId = context.bindingData.userId;

  if (!userId) {
    throw { status: 400, message: 'User ID is required' };
  }

  const usersContainer = provider.getContainer('users');
  const dreamsContainer = provider.getContainer('dreams');
  const connectsContainer = provider.getContainer('connects');
  const scoringContainer = provider.getContainer('scoring');
  const database = provider.database;

  // Load user profile
  const profile = await loadUserProfile(usersContainer, userId, context);
  
  if (!profile) {
    throw { status: 404, message: 'User not found' };
  }
  
  // All users are on v3 (6-container architecture)
  context.log('Loading v3 6-container structure data');
  
  const currentYear = new Date().getFullYear();
  
  // Load ALL data in parallel - dreams and connects don't depend on weekDoc
  // This significantly improves load time by not waiting for week initialization
  const [weekDoc, dreamsDoc, connects, scoringResult] = await Promise.all([
    initializeWeekDocument(database, userId, currentYear, context),
    loadDreamsDocument(dreamsContainer, userId, context),
    loadConnects(connectsContainer, userId, context),
    scoringContainer.item(`${userId}_${currentYear}_scoring`, userId).read().catch(error => {
      if (error.code === 404) {
        context.log(`No scoring document found for ${userId}`);
        return { status: 'rejected', reason: error };
      }
      throw error;
    })
  ]);
  
  // Extract data from aggregated dreams document
  const dreamBook = dreamsDoc ? (dreamsDoc.dreams || dreamsDoc.dreamBook || []) : [];
  const templates = dreamsDoc ? (dreamsDoc.weeklyGoalTemplates || []) : [];
  const rawVision = dreamsDoc?.yearVision;
  const yearVision = typeof rawVision === 'string' ? rawVision : '';
  context.log(`Loaded dreams: ${dreamBook.length} dreams, ${templates.length} templates, vision: ${yearVision ? 'yes' : 'no'}`);
  
  // Extract and flatten weekly goals from week document
  const weeklyGoals = extractWeeklyGoals(weekDoc, templates, context);
  
  // Extract scoring
  let scoringHistory = [];
  let totalScore = profile.score || 0;
  if (scoringResult && scoringResult.resource) {
    const scoringDoc = scoringResult.resource;
    scoringHistory = scoringDoc.entries || [];
    totalScore = scoringDoc.totalScore || 0;
  }
  
  // Combine into legacy format for backward compatibility
  // Exclude yearVision from profile - it belongs in dreams container, not users container
  const { _rid, _self, _etag, _attachments, _ts, lastUpdated, yearVision: _, ...cleanProfile } = profile;
  
  const userData = {
    ...cleanProfile,
    dataStructureVersion: profile.dataStructureVersion, // ✅ Keep this so frontend knows structure
    score: totalScore, // Override with score from scoring container
    dreamBook,
    yearVision, // From dreams container (source of truth)
    weeklyGoals,
    connects,
    scoringHistory,
    careerGoals: [], // Disabled in Phase 1
    developmentPlan: [] // Disabled in Phase 1
  };
  
  context.log(`✅ Loaded 6-container data: ${dreamBook.length} dreams, ${weeklyGoals.length} goals, ${connects.length} connects, ${scoringHistory.length} scoring entries`, {
    cardBackgroundImageInResponse: !!userData.cardBackgroundImage,
    cardBackgroundImage: userData.cardBackgroundImage ? userData.cardBackgroundImage.substring(0, 80) : 'undefined',
    yearVision: userData.yearVision ? `"${userData.yearVision.substring(0, 50)}${userData.yearVision.length > 50 ? '...' : ''}"` : '(empty)',
    responseKeys: Object.keys(userData).filter(k => !k.startsWith('_')).join(', ')
  });
  
  return userData;
});
