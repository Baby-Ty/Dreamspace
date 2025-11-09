// DoD: no fetch in UI; <400 lines; early return for loading/error
// Azure Function to patch missing recurrence property on week goal instances

const { CosmosClient } = require('@azure/cosmos');

module.exports = async function (context, req) {
  const userId = req.query.userId || (req.body && req.body.userId);
  const year = req.query.year || (req.body && req.body.year);

  // Validate inputs
  if (!userId || !year) {
    context.res = {
      status: 400,
      body: JSON.stringify({ 
        error: 'Missing required parameters: userId and year are required' 
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
    return;
  }

  try {
    const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
    const database = client.database('dreamspace');
    
    // Get the weeks document
    const weeksContainer = database.container(`weeks${year}`);
    const weekDocId = `${userId}_${year}`;
    
    const { resource: weekDoc } = await weeksContainer.item(weekDocId, userId).read();
    
    if (!weekDoc) {
      context.res = {
        status: 404,
        body: JSON.stringify({ error: 'Week document not found' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
      return;
    }

    // Get templates from dreams document
    const dreamsContainer = database.container('dreams');
    const { resource: dreamsDoc } = await dreamsContainer.item(userId, userId).read();
    
    if (!dreamsDoc || !dreamsDoc.weeklyGoalTemplates) {
      context.res = {
        status: 404,
        body: JSON.stringify({ error: 'No templates found for user' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
      return;
    }

    // Create a map of templates by ID for quick lookup
    const templateMap = {};
    dreamsDoc.weeklyGoalTemplates.forEach(template => {
      templateMap[template.id] = template;
    });

    // Patch missing recurrence properties
    let patchedCount = 0;
    let totalInstances = 0;
    const patchedWeeks = [];

    for (const [weekId, weekData] of Object.entries(weekDoc.weeks || {})) {
      if (!weekData.goals || weekData.goals.length === 0) continue;

      let weekModified = false;
      weekData.goals = weekData.goals.map(goal => {
        totalInstances++;
        
        // Check if this instance is missing recurrence property
        if (!goal.recurrence && goal.templateId && templateMap[goal.templateId]) {
          const template = templateMap[goal.templateId];
          
          if (template.recurrence) {
            context.log(`✅ Patching ${weekId}: "${goal.title}" - adding recurrence: ${template.recurrence}`);
            patchedCount++;
            weekModified = true;
            
            return {
              ...goal,
              recurrence: template.recurrence,
              // Also add other missing properties from template if needed
              goalType: goal.goalType || template.goalType,
              targetWeeks: goal.targetWeeks || template.targetWeeks,
              targetMonths: goal.targetMonths || template.targetMonths
            };
          }
        }
        
        return goal;
      });

      if (weekModified) {
        patchedWeeks.push(weekId);
      }
    }

    // Save the patched document if changes were made
    if (patchedCount > 0) {
      weekDoc.updatedAt = new Date().toISOString();
      await weeksContainer.item(weekDocId, userId).replace(weekDoc);
      
      context.log(`✅ Patched ${patchedCount} instances across ${patchedWeeks.length} weeks`);
    } else {
      context.log(`ℹ️ No instances needed patching`);
    }

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        totalInstances,
        patchedCount,
        patchedWeeks,
        message: patchedCount > 0 
          ? `Successfully patched ${patchedCount} goal instances`
          : 'No instances needed patching'
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };

  } catch (error) {
    context.log.error('Error patching week goals:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};

