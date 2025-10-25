const { CosmosClient } = require('@azure/cosmos');
const {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  createBotFrameworkAuthenticationFromConfiguration,
  CardFactory
} = require('botbuilder');

// Initialize Cosmos client only if environment variables are present
let client, database, usersContainer, convoContainer, teamsContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  usersContainer = database.container('users');
  convoContainer = database.container('botConversations');
  teamsContainer = database.container('teams');
}

// Initialize Bot Framework adapter only if bot credentials are present
let adapter;
if (process.env.MicrosoftAppId && process.env.MicrosoftAppPassword) {
  const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType || 'MultiTenant',
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId
  });

  const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(
    null,
    credentialsFactory
  );

  adapter = new CloudAdapter(botFrameworkAuthentication);
}

module.exports = async function (context, req) {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  const { coachId, recipientIds, messageType, messageData } = req.body || {};

  context.log('📤 Send Teams Message request:', {
    coachId,
    messageType,
    recipientCount: recipientIds?.length || 0
  });

  // Validate required fields
  if (!coachId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'coachId is required' }),
      headers
    };
    return;
  }

  if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'recipientIds array is required and must not be empty' }),
      headers
    };
    return;
  }

  if (!messageType) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'messageType is required' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!usersContainer || !convoContainer) {
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

  // Check if Bot Framework is configured
  if (!adapter) {
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Bot not configured',
        details: 'MicrosoftAppId and MicrosoftAppPassword environment variables are required'
      }),
      headers
    };
    return;
  }

  try {
    // Validate coach exists
    const { resources: coaches } = await usersContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @coachId',
        parameters: [{ name: '@coachId', value: coachId }]
      })
      .fetchAll();

    if (coaches.length === 0) {
      context.res = {
        status: 403,
        body: JSON.stringify({ error: 'Coach not found' }),
        headers
      };
      return;
    }

    const coach = coaches[0];
    context.log('✅ Coach validated:', coach.displayName || coach.name);

    // Get conversation references for recipients
    const { resources: conversations } = await convoContainer.items
      .query({
        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@userIds, c.userId)',
        parameters: [{ name: '@userIds', value: recipientIds }]
      })
      .fetchAll();

    context.log(`📱 Found ${conversations.length} conversation(s) for ${recipientIds.length} recipient(s)`);

    // Build the appropriate card/message based on type
    let activity;
    try {
      activity = buildActivity(messageType, coach, messageData, context);
    } catch (error) {
      context.res = {
        status: 400,
        body: JSON.stringify({ error: 'Invalid message type or data', details: error.message }),
        headers
      };
      return;
    }

    // Send to each recipient
    const results = {
      sent: [],
      failed: []
    };

    for (const convo of conversations) {
      try {
        await adapter.continueConversationAsync(
          process.env.MicrosoftAppId,
          convo.conversationReference,
          async (turnContext) => {
            await turnContext.sendActivity(activity);
          }
        );
        results.sent.push(convo.userId);
        context.log(`✅ Sent to user: ${convo.userId}`);
      } catch (error) {
        results.failed.push({ userId: convo.userId, error: error.message });
        context.log.error(`❌ Failed to send to ${convo.userId}:`, error.message);
      }
    }

    // Identify users without bot installed
    const sentUserIds = [...results.sent, ...results.failed.map(f => f.userId)];
    const notInstalled = recipientIds.filter(id => !sentUserIds.includes(id));

    context.log('📊 Results:', {
      sent: results.sent.length,
      failed: results.failed.length,
      notInstalled: notInstalled.length
    });

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        sent: results.sent.length,
        failed: results.failed.length,
        notInstalled: notInstalled.length,
        details: {
          sentTo: results.sent,
          failedTo: results.failed,
          notInstalledUsers: notInstalled
        }
      }),
      headers
    };
  } catch (error) {
    context.log.error('❌ Error sending Teams message:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      headers
    };
  }
};

/**
 * Build the appropriate activity (message/card) based on message type
 */
function buildActivity(messageType, coach, messageData, context) {
  const coachName = coach.displayName || coach.name || 'Your Coach';

  switch (messageType) {
    case 'checkin_request':
      return buildCheckinRequestCard(coachName, messageData);
    
    case 'goal_reminder':
      return buildGoalReminderCard(coachName, messageData);
    
    case 'celebration':
      return buildCelebrationCard(coachName, messageData);
    
    case 'custom_message':
      return {
        text: messageData.message || 'Message from your coach'
      };
    
    default:
      throw new Error(`Unknown message type: ${messageType}`);
  }
}

/**
 * Build check-in request adaptive card
 */
function buildCheckinRequestCard(coachName, data) {
  const card = {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.5",
    body: [
      {
        type: "TextBlock",
        text: `📋 Check-in Request from ${coachName}`,
        size: "Large",
        weight: "Bolder",
        color: "Accent",
        wrap: true
      },
      {
        type: "TextBlock",
        text: data.message || "Time for your weekly check-in!",
        wrap: true,
        spacing: "Medium"
      },
      {
        type: "TextBlock",
        text: "Share your progress this week:",
        weight: "Bolder",
        spacing: "Large"
      },
      {
        type: "Input.Text",
        id: "win",
        placeholder: "Biggest win this week",
        isMultiline: true,
        maxLength: 500
      },
      {
        type: "Input.Text",
        id: "challenge",
        placeholder: "Biggest challenge",
        isMultiline: true,
        maxLength: 500,
        spacing: "Small"
      },
      {
        type: "Input.Toggle",
        id: "focused",
        title: "I stayed focused on my goals",
        valueOn: "true",
        valueOff: "false",
        value: "false",
        spacing: "Medium"
      },
      {
        type: "Input.Toggle",
        id: "needHelp",
        title: "I need help from my coach",
        valueOn: "true",
        valueOff: "false",
        value: "false",
        spacing: "Small"
      }
    ],
    actions: [
      {
        type: "Action.Submit",
        title: "Submit Check-in",
        data: {
          type: "checkin_submit",
          coachName: coachName,
          requestedBy: coachName
        }
      }
    ]
  };

  return {
    attachments: [CardFactory.adaptiveCard(card)]
  };
}

/**
 * Build goal reminder adaptive card
 */
function buildGoalReminderCard(coachName, data) {
  const card = {
    type: "AdaptiveCard",
    version: "1.5",
    body: [
      {
        type: "TextBlock",
        text: `🎯 Goal Reminder from ${coachName}`,
        size: "Large",
        weight: "Bolder",
        color: "Accent",
        wrap: true
      },
      {
        type: "TextBlock",
        text: data.message || "Don't forget about your goals this week!",
        wrap: true,
        spacing: "Medium"
      }
    ],
    actions: data.goalId ? [
      {
        type: "Action.OpenUrl",
        title: "View Goal in Dreamspace",
        url: `https://dreamspace.tylerstewart.co.za/goals/${data.goalId}`
      }
    ] : []
  };

  // Add goal details if provided
  if (data.goalTitle || data.dueDate || data.progress !== undefined) {
    const facts = [];
    if (data.goalTitle) facts.push({ title: "Goal:", value: data.goalTitle });
    if (data.dueDate) facts.push({ title: "Due Date:", value: data.dueDate });
    if (data.progress !== undefined) facts.push({ title: "Progress:", value: `${data.progress}%` });

    if (facts.length > 0) {
      card.body.push({
        type: "FactSet",
        facts: facts,
        spacing: "Medium"
      });
    }
  }

  return {
    attachments: [CardFactory.adaptiveCard(card)]
  };
}

/**
 * Build celebration adaptive card
 */
function buildCelebrationCard(coachName, data) {
  const card = {
    type: "AdaptiveCard",
    version: "1.5",
    body: [
      {
        type: "TextBlock",
        text: "🎉 Celebration!",
        size: "Large",
        weight: "Bolder",
        color: "Good",
        wrap: true
      },
      {
        type: "TextBlock",
        text: data.message || `${coachName} wants to celebrate your achievement!`,
        wrap: true,
        size: "Medium",
        spacing: "Medium"
      }
    ]
  };

  return {
    attachments: [CardFactory.adaptiveCard(card)]
  };
}

