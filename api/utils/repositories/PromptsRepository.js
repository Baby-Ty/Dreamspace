/**
 * PromptsRepository
 * Handles AI prompt configuration and history operations
 */

const BaseRepository = require('./BaseRepository');

class PromptsRepository extends BaseRepository {
  /**
   * Get prompts configuration
   * @returns {Promise<object|null>} Prompts document or null if not found
   */
  async getPrompts() {
    try {
      const container = this.getContainer('prompts');
      const docId = 'ai-prompts';
      const partitionKey = 'config';
      try {
        const { resource } = await container.item(docId, partitionKey).read();
        return resource;
      } catch (error) {
        // Handle document not found (404) or container not found
        if (error.code === 404 || error.code === 'NotFound') {
          return null;
        }
        // If it's a container not found error, return null to trigger creation
        if (error.message && error.message.includes('Container') && error.message.includes('not found')) {
          return null;
        }
        throw error;
      }
    } catch (error) {
      // If container doesn't exist in config or other initialization error, return null
      if (error.message && error.message.includes('not found in configuration')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Upsert prompts configuration
   * @param {object} promptsData - Prompts data
   * @param {string} modifiedBy - User email who made the change
   * @returns {Promise<object>} Saved prompts document
   */
  async upsertPrompts(promptsData, modifiedBy) {
    try {
      const container = this.getContainer('prompts');
      const docId = 'ai-prompts';
      const partitionKey = 'config';
      
      const document = {
        id: docId,
        partitionKey: partitionKey,
        ...promptsData,
        lastModified: new Date().toISOString(),
        modifiedBy: modifiedBy || 'system'
      };
      
      const { resource } = await container.items.upsert(document);
      return resource;
    } catch (error) {
      // If container doesn't exist, try to create it first
      if (error.message && (error.message.includes('Container') || error.message.includes('not found'))) {
        // Container will be auto-created on first write in Cosmos DB, but if that fails,
        // we'll let the error propagate
        throw new Error(`Prompts container not found. Please ensure the 'prompts' container exists in Cosmos DB with partition key '/partitionKey'. Error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get default prompts configuration
   * @returns {object} Default prompts structure
   */
  getDefaultPrompts() {
    return {
      imageGeneration: {
        dreamPrompt: `Create an inspiring, symbolic image that represents the dream: {userSearchTerm}

Make the image visually strong, motivating, and emotionally uplifting.  
Use scenery, objects, environments, silhouettes, distant figures, or hands-only shots — no identifiable people or faces.`,
        backgroundCardPrompt: `Create a clean, visually appealing background image based on the theme: "{userSearchTerm}".

Make the image expressive but not distracting, with a subtle composition that works behind UI text.  
Use scenery, objects, abstract shapes, or symbolic visuals — but no identifiable people or faces.`
      },
      visionGeneration: {
        generateSystemPrompt: `You are a visionary life coach helping someone craft an inspiring personal vision statement. 
Write in first person, present tense. Warm, authentic, aspirational — never corporate.

The tone should feel like a confident dreamer speaking from the heart.
Keep it to around {maxWords} words. Make every word count.`,
        generateUserPrompt: `Here's what I shared about my mindset, goals, and hopes:
"{userInput}"

{dreamContext}

Transform this into a powerful, personal vision statement that captures my aspirations. 
Make it sound like ME - confident, inspired, and ready to make it happen.`,
        polishSystemPrompt: `You are an editor refining a personal vision statement.
Keep the same meaning and personal voice, but elevate clarity, confidence, and inspiration.
Write in first person. Around {maxWords} words.
Do not add new concepts — just polish what's already there.`,
        polishUserPrompt: `Please polish this vision statement while keeping my voice:
"{userInput}"

{dreamContext}

Make it sound more visionary and confident, but still authentically me.`
      },
      styleModifiers: {
        stylized_digital: {
          label: 'Stylized Digital Painting',
          modifier: 'stylized digital painting, soft brush textures, warm lighting, smooth gradients, gentle color exaggeration, clean modern illustration style'
        },
        vibrant_coastal: {
          label: 'Vibrant Coastal Illustration',
          modifier: 'vibrant illustrated scenery, warm daylight, smooth shading, gentle highlights, slightly stylized natural elements'
        },
        semi_realistic: {
          label: 'Semi-Realistic Landscape Art',
          modifier: 'semi-realistic environment art, crisp edges, vibrant tones, atmospheric depth, painterly highlights, detailed but not photorealistic'
        },
        photorealistic_cinematic: {
          label: 'Photorealistic Cinematic',
          modifier: 'photorealistic detail, cinematic lighting, shallow depth of field, soft film grain, high-contrast highlights'
        }
      },
      // AI Usage Limits - controls cost by limiting image generation
      aiLimits: {
        imageGeneration: {
          dailyLimitPerUser: 25,       // Max images per user per day
          dailyLimitTotal: 500,        // Max images org-wide per day
          perMinuteLimit: 10,          // Max requests per minute (burst protection)
          costPerRequest: 0.08,        // Cost in USD per DALL-E 3 HD image
          modelName: 'DALL-E 3 HD'     // Display name for the model
        },
        visionGeneration: {
          dailyLimitPerUser: 100,      // Max vision requests per user per day
          dailyLimitTotal: 2000,       // Max vision requests org-wide per day
          perMinuteLimit: 20,          // Max requests per minute
          costPerRequest: 0.00015,     // Cost in USD per GPT-4o-mini request
          modelName: 'GPT-4o-mini'     // Display name for the model
        }
      }
    };
  }

  /**
   * Ensure prompts document exists with defaults
   * @param {object} context - Optional Azure Function context for logging
   * @returns {Promise<object>} Prompts document (existing or newly created)
   */
  async ensurePromptsExist(context = null) {
    let prompts = await this.getPrompts();
    
    if (!prompts) {
      const logFn = context?.log || console.log;
      logFn('📝 Creating default prompts configuration');
      
      const defaultPrompts = this.getDefaultPrompts();
      prompts = await this.upsertPrompts(defaultPrompts, 'system');
      logFn('✅ Default prompts configuration created');
    }
    
    return prompts;
  }

  /**
   * Add a prompt history entry (snapshot before changes)
   * @param {object} promptsData - Current prompts data to snapshot
   * @param {string} modifiedBy - User email who made the change
   * @param {string} changeDescription - Optional description of what changed
   * @returns {Promise<object>} Created history entry
   */
  async addPromptHistoryEntry(promptsData, modifiedBy, changeDescription = null) {
    try {
      // Use same 'prompts' container but with 'history' partition key
      const container = this.getContainer('prompts');
      const timestamp = new Date().toISOString();
      const version = `history_${Date.now()}`;
      
      // Create a clean copy of prompts (remove metadata)
      const { id, partitionKey, _rid, _self, _etag, _attachments, _ts, lastModified, modifiedBy: prevModifier, ...promptsSnapshot } = promptsData;
      
      const historyEntry = {
        id: version,
        partitionKey: 'history',  // Different partition key from 'config' used by main prompts
        type: 'prompt-history',
        version: version,
        timestamp: timestamp,
        modifiedBy: modifiedBy || 'system',
        changeDescription: changeDescription,
        prompts: promptsSnapshot
      };
      
      const { resource } = await container.items.upsert(historyEntry);
      return resource;
    } catch (error) {
      // Fail gracefully - history is optional, don't break the main save operation
      console.warn('Failed to save prompt history entry:', error.message || error);
      return null;
    }
  }

  /**
   * Get prompt history entries
   * @param {number} limit - Maximum number of entries to return (default 50)
   * @returns {Promise<Array>} Array of history entries, newest first
   */
  async getPromptHistory(limit = 50) {
    try {
      // Query history entries from the 'prompts' container (partition key = 'history')
      const container = this.getContainer('prompts');
      const query = {
        query: `SELECT * FROM c WHERE c.partitionKey = @partitionKey AND c.type = @type ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit`,
        parameters: [
          { name: '@partitionKey', value: 'history' },
          { name: '@type', value: 'prompt-history' },
          { name: '@limit', value: limit }
        ]
      };
      const { resources } = await container.items.query(query).fetchAll();
      return resources;
    } catch (error) {
      // Fail gracefully - return empty array if any error
      console.warn('Failed to get prompt history:', error.message || error);
      return [];
    }
  }

  /**
   * Get a specific prompt version from history
   * @param {string} version - Version ID to retrieve
   * @returns {Promise<object|null>} History entry or null if not found
   */
  async getPromptVersion(version) {
    try {
      // Read from 'prompts' container with 'history' partition key
      const container = this.getContainer('prompts');
      const { resource } = await container.item(version, 'history').read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      // Fail gracefully - return null if any error
      console.warn('Failed to get prompt version:', error.message || error);
      return null;
    }
  }
}

module.exports = PromptsRepository;
