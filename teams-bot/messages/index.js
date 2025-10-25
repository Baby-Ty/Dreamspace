const {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  createBotFrameworkAuthenticationFromConfiguration,
  TurnContext,
  ActivityHandler,
  CardFactory,
  ActivityTypes
} = require('botbuilder');

const { isConfigured, saveConversationRef, saveCheckin } = require('../services/cosmosService');
const { getUserByAadId, userExists } = require('../services/userService');
const { getWeeklyCheckinCard } = require('../cards/weeklyCheckin');

// Initialize Bot Framework authentication
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

const adapter = new CloudAdapter(botFrameworkAuthentication);

// Error handler
adapter.onTurnError = async (context, error) => {
  console.error('[onTurnError]:', error);
  
  await context.sendActivity('Sorry, something went wrong. Please try again later.');
  
  // Send trace activity for Bot Framework Emulator
  await context.sendTraceActivity(
    'OnTurnError Trace',
    `${error}`,
    'https://www.botframework.com/schemas/error',
    'TurnError'
  );
};

/**
 * Teams Check-in Bot
 */
class TeamsCheckinBot extends ActivityHandler {
  constructor() {
    super();

    // Handle new members added to conversation
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      
      for (const member of membersAdded) {
        // Don't greet the bot itself
        if (member.id !== context.activity.recipient.id) {
          await this.saveConversationReference(context);
          
          const welcomeMessage = 
            "👋 Welcome to Dreamspace!\n\n" +
            "I help you track your weekly wins, challenges, and goals.\n\n" +
            "**To get started:**\n" +
            "1. First, log into the Dreamspace web app to set up your profile\n" +
            "2. Then come back here and type **checkin** to start your weekly check-in\n\n" +
            "Type **help** anytime to see what I can do.";
          
          await context.sendActivity(welcomeMessage);
        }
      }
      
      await next();
    });

    // Handle regular messages
    this.onMessage(async (context, next) => {
      await this.saveConversationReference(context);
      
      const text = (context.activity.text || '').trim().toLowerCase();
      const userId = context.activity.from.aadObjectId || context.activity.from.id;
      
      // Handle help command
      if (text === 'help' || text === 'hi' || text === 'hello') {
        const helpMessage = 
          "**Dreamspace Bot Commands:**\n\n" +
          "- **checkin** - Start your weekly check-in\n" +
          "- **help** - Show this help message\n\n" +
          "Make sure you've logged into the Dreamspace web app first!";
        
        await context.sendActivity(helpMessage);
        await next();
        return;
      }
      
      // Handle checkin command
      if (text === 'checkin' || text === 'check-in' || text === 'check in') {
        // Validate user exists in Dreamspace
        try {
          const user = await getUserByAadId(userId);
          
          if (!user) {
            const errorMessage = 
              "❌ **User Not Found**\n\n" +
              "You need to log into the Dreamspace web app first to set up your profile.\n\n" +
              "Once you've logged in at least once, come back here and try again!";
            
            await context.sendActivity(errorMessage);
            await next();
            return;
          }
          
          // User exists - send the check-in card
          const card = CardFactory.adaptiveCard(getWeeklyCheckinCard());
          await context.sendActivity({ attachments: [card] });
          
        } catch (error) {
          console.error('Error validating user:', error);
          await context.sendActivity(
            "Sorry, I couldn't verify your account. Please try again later."
          );
        }
        
        await next();
        return;
      }
      
      // Default response for unknown commands
      await context.sendActivity(
        `I didn't understand that. Type **help** to see what I can do, or **checkin** to start your weekly check-in.`
      );
      
      await next();
    });

    // Handle adaptive card submissions (invoke activity)
    this.onInvokeActivity(async (context) => {
      if (context.activity.name === 'adaptiveCard/action') {
        const data = context.activity.value?.action?.data || context.activity.value;
        
        if (data.type === 'checkin_submit') {
          const userId = context.activity.from.aadObjectId || context.activity.from.id;
          
          try {
            // Validate user still exists
            const user = await getUserByAadId(userId);
            
            if (!user) {
              await context.sendActivity(
                "❌ Could not find your user account. Please log into the Dreamspace web app."
              );
              return { status: 200 };
            }
            
            // Save the check-in
            const checkin = await saveCheckin(userId, data);
            
            // Send confirmation
            let confirmationMessage = "✅ **Check-in Submitted!**\n\n";
            
            if (data.win) {
              confirmationMessage += `🎉 **Win:** ${data.win}\n\n`;
            }
            if (data.challenge) {
              confirmationMessage += `💪 **Challenge:** ${data.challenge}\n\n`;
            }
            if (data.focused === 'true') {
              confirmationMessage += "✓ Stayed focused on goals\n";
            }
            if (data.needHelp === 'true') {
              confirmationMessage += "🆘 Requested help\n\n";
              confirmationMessage += "Your coach will be notified.";
            }
            
            await context.sendActivity(confirmationMessage);
            
            console.log(`Check-in saved for user ${userId}:`, checkin.id);
            
          } catch (error) {
            console.error('Error saving check-in:', error);
            await context.sendActivity(
              "Sorry, I couldn't save your check-in. Please try again."
            );
          }
          
          return { status: 200 };
        }
      }
      
      return { status: 200 };
    });
  }

  /**
   * Save conversation reference for proactive messaging
   */
  async saveConversationReference(context) {
    try {
      const userId = context.activity.from.aadObjectId || context.activity.from.id;
      const conversationReference = TurnContext.getConversationReference(context.activity);
      
      // Determine scope based on conversation type
      const scope = context.activity.conversation.conversationType === 'personal' 
        ? 'personal' 
        : 'team';
      
      await saveConversationRef(userId, conversationReference, scope);
    } catch (error) {
      // Don't fail the conversation if we can't save the reference
      console.error('Failed to save conversation reference:', error);
    }
  }
}

// Create bot instance
const bot = new TeamsCheckinBot();

/**
 * Azure Function handler
 */
module.exports = async function (context, req) {
  // Health check endpoint
  if (req.method === 'GET') {
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'healthy',
        service: 'Dreamspace Teams Bot',
        cosmosConfigured: isConfigured(),
        timestamp: new Date().toISOString()
      })
    };
    return;
  }

  // Bot Framework messages
  if (req.method === 'POST') {
    // Check Cosmos DB configuration
    if (!isConfigured()) {
      context.res = {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Database not configured',
          details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required'
        })
      };
      return;
    }

    // Process bot activity
    await adapter.process(req, context.res, async (turnContext) => {
      await bot.run(turnContext);
    });
  }
};

