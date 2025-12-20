# AI Prompts Configuration Setup Guide

This guide explains how to set up and use the AI Prompts editor in the People Hub to manage prompts used for image and text generation in DreamSpace.

## Overview

The AI Prompts feature allows administrators to edit the prompts used by:
- **DALL-E Image Generation** - For dream images and background cards
- **GPT Vision Statement Generation** - For generating and polishing vision statements
- **Style Modifiers** - For image style customization

All prompts are stored in Cosmos DB and loaded fresh on each request, ensuring that updates take effect immediately.

## Prerequisites

- Cosmos DB account configured
- `dreamspace` database exists
- Azure CLI installed (for setup scripts)

## Setup Steps

### 1. Create the Prompts Container

Run the setup script to create the `prompts` container in Cosmos DB:

**PowerShell:**
```powershell
.\scripts\setup-prompts-container.ps1 -CosmosAccountName "your-cosmos-account" -ResourceGroupName "your-resource-group"
```

**Bash:**
```bash
./scripts/setup-prompts-container.sh "your-cosmos-account" "your-resource-group"
```

Or set environment variables:
```powershell
$env:COSMOS_ACCOUNT_NAME = "your-cosmos-account"
$env:RESOURCE_GROUP_NAME = "your-resource-group"
.\scripts\setup-prompts-container.ps1
```

The container will be created with:
- **Name:** `prompts`
- **Partition Key:** `/partitionKey`
- **Throughput:** 400 RU/s

### 2. Verify Container Creation

The prompts container will be automatically seeded with default prompts on first access. You can verify it exists in the Azure Portal or by accessing the People Hub → AI Prompts section.

## Using the Prompts Editor

### Accessing the Editor

1. Navigate to **People Hub** in DreamSpace
2. Click the **"AI Prompts"** button in the header
3. You'll see three collapsible sections:
   - **Image Generation** - Dream and background card prompts
   - **Vision Statement Generation** - System and user prompts for generate/polish
   - **Style Modifiers** - Image style customization options

### Editing Prompts

1. Expand the section you want to edit
2. Modify the prompt text in the textarea fields
3. Use template variables where needed:
   - `{userSearchTerm}` - Replaced with user's search term (image generation)
   - `{maxWords}` - Replaced with word limit (vision generation)
   - `{userInput}` - Replaced with user's input text (vision generation)
   - `{dreamContext}` - Replaced with user's dreams context (vision generation)
4. Click **"Save Changes"** when done
5. Changes take effect immediately for new generations

### Resetting to Defaults

Click **"Reset"** to discard unsaved changes and reload the current saved prompts from Cosmos DB.

### Viewing History & Rolling Back

1. Click the **"History"** button in the header
2. View all previous versions with:
   - Timestamp (relative and absolute)
   - Who made the change
   - What triggered the snapshot
3. Click **"Preview"** to see the prompts in a version
4. Click **"Restore"** to roll back to that version
   - Current prompts are automatically saved to history before restoring
   - After restore, the editor reloads with the restored prompts

## How It Works

### Data Flow

```
People Hub Editor → savePrompts API → Cosmos DB
                                              ↓
User Generates Image/Vision → generateImage/generateVision API → Cosmos DB (fresh load)
```

### Key Points

1. **No Caching** - Prompts are always loaded fresh from Cosmos DB on each request
2. **Immediate Updates** - Changes take effect as soon as they're saved
3. **Automatic Seeding** - Default prompts are created automatically if they don't exist
4. **Fallback Support** - If Cosmos DB is unavailable, default prompts are used

## Template Variables Reference

### Image Generation Prompts

- `{userSearchTerm}` - The user's search term or dream description

**Example:**
```
Create an inspiring, symbolic image that represents the dream: {userSearchTerm}
```

### Vision Generation Prompts

- `{maxWords}` - Word limit (typically 100)
- `{userInput}` - User's input text describing their vision
- `{dreamContext}` - Formatted list of user's dreams

**Example:**
```
Here's what I shared about my mindset, goals, and hopes:
"{userInput}"

{dreamContext}

Transform this into a powerful, personal vision statement...
```

## Troubleshooting

### Prompts Not Updating

1. Verify the `prompts` container exists in Cosmos DB
2. Check that prompts were saved successfully (look for success toast)
3. Verify Cosmos DB connection is working
4. Check Azure Function logs for errors

### Container Not Found

Run the setup script again to create the container:
```powershell
.\scripts\setup-prompts-container.ps1
```

### Default Prompts Not Loading

Default prompts are created automatically on first access. If they're not loading:
1. Check Cosmos DB connection
2. Verify container exists
3. Check Azure Function logs for errors
4. Try accessing the AI Prompts editor - it will trigger default creation

## API Endpoints

### Core Prompts
- `GET /api/getPrompts` - Fetch current prompts
- `POST /api/savePrompts` - Save updated prompts (automatically creates history entry)

### History & Rollback
- `GET /api/getPromptHistory?limit=50` - Fetch prompt version history
- `POST /api/restorePrompt` - Restore a specific version (body: `{ version, modifiedBy }`)

### Response Structure

Prompts endpoints return:
```json
{
  "success": true,
  "prompts": {
    "imageGeneration": {
      "dreamPrompt": "...",
      "backgroundCardPrompt": "..."
    },
    "visionGeneration": {
      "generateSystemPrompt": "...",
      "generateUserPrompt": "...",
      "polishSystemPrompt": "...",
      "polishUserPrompt": "..."
    },
    "styleModifiers": {
      "stylized_digital": {
        "label": "...",
        "modifier": "..."
      },
      ...
    },
    "lastModified": "2025-12-20T...",
    "modifiedBy": "user@example.com"
  }
}
```

## Security Notes

- Only users with access to People Hub can edit prompts
- Changes are tracked with `modifiedBy` field
- **Full version history** is preserved for audit and rollback
- Prompts are stored in Cosmos DB with proper access controls
- No sensitive data should be included in prompts
- History entries include who made the change and when

