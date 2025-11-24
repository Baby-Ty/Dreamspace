/**
 * Generate Card Backgrounds for Mock Users
 * 
 * This script generates DALL-E background images for all mock users
 * and updates their profiles with the generated image URLs.
 * 
 * Usage: 
 *   node scripts/generateMockUserBackgrounds.js          # Skip users with existing backgrounds
 *   node scripts/generateMockUserBackgrounds.js --force  # Regenerate all backgrounds
 * 
 * Requires: 
 * - COSMOS_ENDPOINT and COSMOS_KEY environment variables
 * - OPENAI_API_KEY environment variable
 */

import { CosmosClient } from '@azure/cosmos';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load from api/local.settings.json (Azure Functions style) if variables not already set
if (!process.env.COSMOS_ENDPOINT || !process.env.COSMOS_KEY || !process.env.OPENAI_API_KEY) {
  const localSettingsPath = path.join(__dirname, '..', 'api', 'local.settings.json');
  if (fs.existsSync(localSettingsPath)) {
    try {
      const localSettings = JSON.parse(fs.readFileSync(localSettingsPath, 'utf8'));
      if (localSettings.Values) {
        if (!process.env.COSMOS_ENDPOINT && localSettings.Values.COSMOS_ENDPOINT) {
          process.env.COSMOS_ENDPOINT = localSettings.Values.COSMOS_ENDPOINT;
        }
        if (!process.env.COSMOS_KEY && localSettings.Values.COSMOS_KEY) {
          process.env.COSMOS_KEY = localSettings.Values.COSMOS_KEY;
        }
        if (!process.env.OPENAI_API_KEY && localSettings.Values.OPENAI_API_KEY) {
          process.env.OPENAI_API_KEY = localSettings.Values.OPENAI_API_KEY;
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not load from local.settings.json:', error.message);
    }
  }
  
  // Try to load from .env file if still not set
  if (!process.env.COSMOS_ENDPOINT || !process.env.COSMOS_KEY || !process.env.OPENAI_API_KEY) {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envLines = envContent.split('\n');
        for (const line of envLines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
              // Handle VITE_ prefixed variables
              if (key.startsWith('VITE_')) {
                const nodeKey = key.replace(/^VITE_/, ''); // Remove VITE_ prefix for Node.js scripts
                if (!process.env[nodeKey]) {
                  process.env[nodeKey] = value;
                }
              }
              // Also set the original key
              if (!process.env[key]) {
                process.env[key] = value;
              }
            }
          }
        }
      } catch (error) {
        console.warn('⚠️  Could not load from .env file:', error.message);
      }
    }
  }
}

// Initialize Cosmos client
if (!process.env.COSMOS_ENDPOINT || !process.env.COSMOS_KEY) {
  console.error('❌ Error: COSMOS_ENDPOINT and COSMOS_KEY environment variables are required');
  console.error('   Set them via:');
  console.error('   - Environment variables: $env:COSMOS_ENDPOINT="..." (PowerShell)');
  console.error('   - api/local.settings.json: Values.COSMOS_ENDPOINT');
  console.error('   - .env file: COSMOS_ENDPOINT=...');
  process.exit(1);
}

// Check for OPENAI_API_KEY (with or without VITE_ prefix)
const openaiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
if (!openaiKey || openaiKey.includes('your-') || openaiKey.includes('placeholder')) {
  console.error('❌ Error: Valid OPENAI_API_KEY environment variable is required');
  console.error('   Set it via:');
  console.error('   - Environment variables: $env:OPENAI_API_KEY="sk-..." (PowerShell)');
  console.error('   - api/local.settings.json: Values.OPENAI_API_KEY');
  console.error('   - .env file: OPENAI_API_KEY=sk-... or VITE_OPENAI_API_KEY=sk-...');
  console.error('   Get your API key at: https://platform.openai.com/account/api-keys');
  process.exit(1);
}

// Set the key for use in the script
process.env.OPENAI_API_KEY = openaiKey;

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});

const database = client.database('dreamspace');

// API base URL - try to get from environment or use default
const API_BASE_URL = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:7071/api';

// DALL-E service implementation (adapted for Node.js)
const OPENAI_API_BASE = 'https://api.openai.com/v1';

/**
 * Build DreamSpace-style prompt from user search term
 * Optimized for user card backgrounds - vibrant, adventurous, and exciting
 */
function buildDreamSpacePrompt(userSearchTerm) {
  const baseStyle = 'vibrant and adventurous scene, exciting and dynamic atmosphere, perfect for user card background, wide landscape orientation, bold colors, energetic composition, inspiring and action-packed, cinematic quality, dramatic lighting, compelling visual storytelling';
  return `A ${userSearchTerm}, ${baseStyle}`;
}

/**
 * Generate an image using DALL-E 3
 */
async function generateImage(userSearchTerm, options = {}) {
  const {
    size = '1024x1024',
    quality = 'hd',
    model = 'dall-e-3'
  } = options;

  const prompt = buildDreamSpacePrompt(userSearchTerm.trim());

  try {
    const url = `${OPENAI_API_BASE}/images/generations`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size,
        quality
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('Invalid OpenAI API response structure');
    }

    return {
      success: true,
      url: data.data[0].url,
      revisedPrompt: data.data[0].revised_prompt || prompt
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to generate image'
    };
  }
}

/**
 * Generate a meaningful search term for a user based on their profile
 * Focused on adventure, excitement, and dynamic experiences
 */
function generateSearchTerm(user) {
  // Generate adventurous and exciting search terms based on role, office, or name
  const searchTerms = [];
  
  if (user.role === 'admin') {
    searchTerms.push(
      'mountain peak summit adventure',
      'helicopter flying over dramatic landscape',
      'rock climbing on cliff face',
      'paragliding over mountains',
      'sailing yacht on open ocean',
      'hot air balloon over scenic valley'
    );
  } else if (user.role === 'coach') {
    searchTerms.push(
      'surfing massive wave',
      'mountain biking down trail',
      'kayaking through rapids',
      'rock climbing adventure',
      'skiing down mountain slope',
      'hiking through misty forest'
    );
  } else {
    // Regular users - use office location for adventure themes
    if (user.office === 'Cape Town') {
      searchTerms.push(
        'surfing at sunset',
        'hiking Table Mountain',
        'paragliding over coastline',
        'kayaking in ocean',
        'rock climbing on cliffs',
        'mountain biking trail',
        'beach volleyball at sunset',
        'sailing yacht adventure'
      );
    } else if (user.office === 'Johannesburg') {
      searchTerms.push(
        'urban exploration adventure',
        'city skyline at golden hour',
        'street art and graffiti',
        'rooftop cityscape view',
        'urban cycling adventure',
        'city lights at night',
        'modern architecture exploration',
        'vibrant street market'
      );
    } else {
      // Default adventurous themes
      searchTerms.push(
        'travel adventure destination',
        'exploring ancient ruins',
        'tropical beach paradise',
        'desert safari adventure',
        'jungle exploration',
        'snowy mountain expedition',
        'island hopping adventure',
        'road trip through landscape'
      );
    }
  }
  
  // Return a random search term from the list
  return searchTerms[Math.floor(Math.random() * searchTerms.length)];
}

/**
 * Upload DALL-E image to blob storage via API endpoint
 * This converts temporary DALL-E URLs to permanent blob storage URLs
 */
async function uploadImageToBlobStorage(userId, dalleImageUrl) {
  try {
    console.log(`     📤 Uploading image to blob storage...`);
    
    const uploadUrl = `${API_BASE_URL}/uploadUserBackgroundImage/${encodeURIComponent(userId)}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageUrl: dalleImageUrl
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.url) {
      throw new Error('Blob storage upload failed - no URL returned');
    }
    
    console.log(`     ✅ Image uploaded to blob storage: ${result.url.substring(0, 80)}...`);
    return { success: true, url: result.url };
  } catch (error) {
    console.error(`     ❌ Blob upload error:`, error.message);
    return {
      success: false,
      error: error.message || 'Failed to upload image to blob storage'
    };
  }
}

/**
 * Update user's card background image in Cosmos DB
 */
async function updateUserBackgroundImage(userId, blobImageUrl) {
  try {
    const usersContainer = database.container('users');
    
    // Get existing user document
    let existingUser;
    try {
      const { resource } = await usersContainer.item(userId, userId).read();
      existingUser = resource;
    } catch (error) {
      if (error.code === 404) {
        throw new Error(`User ${userId} not found`);
      }
      throw error;
    }
    
    // Remove Cosmos DB metadata fields that shouldn't be included in update
    const {
      _rid,
      _self,
      _etag,
      _attachments,
      _ts,
      ...userData
    } = existingUser;
    
    // Update with new background image, preserving all user fields
    const updatedUser = {
      ...userData,
      id: userId,
      userId: userId,
      cardBackgroundImage: blobImageUrl,
      dataStructureVersion: userData.dataStructureVersion || 3,
      currentYear: userData.currentYear || new Date().getFullYear(),
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`     💾 Updating user profile with blob storage URL...`);
    const { resource: savedUser } = await usersContainer.items.upsert(updatedUser);
    
    // Verify the save worked
    if (!savedUser || !savedUser.cardBackgroundImage) {
      throw new Error('Background image was not saved correctly');
    }
    
    console.log(`     ✅ Verified: Background image saved successfully`);
    
    return { success: true };
  } catch (error) {
    console.error(`     ❌ Error details:`, error);
    return {
      success: false,
      error: error.message || 'Failed to update user background image'
    };
  }
}

/**
 * Main function
 */
async function generateBackgrounds() {
  // Check for --force flag to regenerate existing backgrounds
  const forceRegenerate = process.argv.includes('--force') || process.argv.includes('-f');
  
  console.log('🎨 Starting background generation for mock users...');
  if (forceRegenerate) {
    console.log('🔄 Force mode: Will regenerate backgrounds for all users (including existing ones)\n');
  } else {
    console.log('ℹ️  Default mode: Will skip users who already have backgrounds');
    console.log('   Use --force flag to regenerate all backgrounds\n');
  }
  
  try {
    const usersContainer = database.container('users');
    
    // Get all mock users
    const mockUserEmails = [
      'admin@netsurit.com',
      'coach1@netsurit.com',
      'coach2@netsurit.com',
      'user1@netsurit.com',
      'user2@netsurit.com',
      'user3@netsurit.com',
      'user4@netsurit.com',
      'user5@netsurit.com'
    ];
    
    console.log(`📋 Found ${mockUserEmails.length} mock users to process\n`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process each user
    for (const email of mockUserEmails) {
      try {
        // Get user from database
        const { resource: user } = await usersContainer.item(email, email).read();
        
        if (!user) {
          console.log(`  ⚠️  User ${email} not found, skipping...`);
          continue;
        }
        
        // Skip if user already has a background image (unless force mode)
        if (user.cardBackgroundImage && !forceRegenerate) {
          console.log(`  ℹ️  User ${user.name} (${email}) already has a background image, skipping...`);
          skippedCount++;
          continue;
        }
        
        if (user.cardBackgroundImage && forceRegenerate) {
          console.log(`  🔄 Regenerating background for ${user.name} (${email})...`);
        } else {
          console.log(`  🎨 Generating background for ${user.name} (${email})...`);
        }
        
        console.log(`  🎨 Generating background for ${user.name} (${email})...`);
        
        // Generate search term
        const searchTerm = generateSearchTerm(user);
        console.log(`     Search term: "${searchTerm}"`);
        
        // Generate image
        const imageResult = await generateImage(searchTerm);
        
        if (!imageResult.success) {
          console.error(`     ❌ Failed to generate image: ${imageResult.error}`);
          errorCount++;
          continue;
        }
        
        console.log(`     ✅ Image generated: ${imageResult.url.substring(0, 80)}...`);
        
        // Upload DALL-E image to blob storage (DALL-E URLs expire, blob URLs are permanent)
        const uploadResult = await uploadImageToBlobStorage(email, imageResult.url);
        
        if (!uploadResult.success) {
          console.error(`     ❌ Failed to upload to blob storage: ${uploadResult.error}`);
          console.error(`     ⚠️  Note: DALL-E URLs expire, so saving directly won't work long-term`);
          errorCount++;
          continue;
        }
        
        // Update user profile with permanent blob storage URL
        const updateResult = await updateUserBackgroundImage(email, uploadResult.url);
        
        if (!updateResult.success) {
          console.error(`     ❌ Failed to update profile: ${updateResult.error}`);
          errorCount++;
          continue;
        }
        
        // Verify the save by reading back the user
        try {
          const { resource: verifyUser } = await usersContainer.item(email, email).read();
          if (verifyUser.cardBackgroundImage === uploadResult.url) {
            console.log(`     ✅ Verified: Background image saved and persisted for ${user.name}`);
            console.log(`     📸 Permanent blob URL: ${uploadResult.url.substring(0, 100)}...\n`);
          } else {
            console.error(`     ⚠️  Warning: Background image may not have saved correctly`);
            console.error(`        Expected: ${uploadResult.url.substring(0, 80)}...`);
            console.error(`        Got: ${verifyUser.cardBackgroundImage ? verifyUser.cardBackgroundImage.substring(0, 80) : 'null'}...\n`);
          }
        } catch (verifyError) {
          console.error(`     ⚠️  Could not verify save: ${verifyError.message}\n`);
        }
        
        successCount++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ❌ Error processing ${email}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n✅ Background generation complete!');
    console.log(`\n📊 Summary:`);
    console.log(`  - Successfully generated: ${successCount}`);
    if (!forceRegenerate) {
      console.log(`  - Skipped (already had backgrounds): ${skippedCount}`);
    }
    console.log(`  - Errors: ${errorCount}`);
    console.log(`  - Total processed: ${mockUserEmails.length}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
generateBackgrounds().catch(console.error);

