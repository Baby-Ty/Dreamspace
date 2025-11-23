# Mock Data Creation Script

This script creates realistic mock users, dreams, goals, teams, connects, and scoring data for testing the admin and team sections of DreamSpace.

## What It Creates

The script creates the following data structures exactly as they would be created through the app:

### Users (8 total)
- **1 Admin**: `admin@netsurit.com` (Sarah Johnson)
- **2 Coaches**: 
  - `coach1@netsurit.com` (Michael Chen) - Team Alpha
  - `coach2@netsurit.com` (Emma Williams) - Team Beta
- **5 Regular Users**:
  - `user1@netsurit.com` (David Thompson) - Team Alpha
  - `user2@netsurit.com` (Lisa Anderson) - Team Alpha
  - `user3@netsurit.com` (James Wilson) - Team Beta
  - `user4@netsurit.com` (Rachel Martinez) - Team Beta
  - `user5@netsurit.com` (Alex Brown) - Team Alpha

### Dreams & Goals
- Each user gets 2-5 dreams with realistic titles and descriptions
- Each dream has 1-2 goals (consistency and/or deadline goals)
- Weekly goal templates are created from consistency goals
- Goals use the unified tracking system (`targetWeeks` and `weeksRemaining`)

### Current Week Goals
- Active goal instances for the current week
- Mix of completed and incomplete goals
- Properly linked to dreams and templates

### Past Weeks History
- Historical summaries for the last 5 weeks
- Includes completion stats and scores

### Teams
- **Team Alpha**: Coach Michael Chen with 3 members
- **Team Beta**: Coach Emma Williams with 2 members

### Connects
- Each user has 2-6 connects with other users
- Linked to specific dreams
- Realistic dates and notes

### Scoring
- Scoring documents for the current year
- Entries for dreams (10 points), connects (5 points), and weekly goals (3 points)
- Total scores match user profiles

## Usage

### Prerequisites

1. Ensure you have Node.js installed
2. Set up your Cosmos DB connection environment variables:
   ```bash
   export COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
   export COSMOS_KEY="your-primary-key"
   ```

   Or on Windows PowerShell:
   ```powershell
   $env:COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
   $env:COSMOS_KEY="your-primary-key"
   ```

### Running the Script

```bash
node scripts/createMockData.js
```

The script will:
1. Create all users in the `users` container
2. Create dreams and weekly goal templates in the `dreams` container
3. Create current week goal instances in the `currentWeek` container
4. Create past weeks history in the `pastWeeks` container
5. Create team relationships in the `teams` container
6. Create connects in the `connects` container
7. Create scoring documents in the `scoring` container

### Output

The script provides progress output showing:
- ✅ Successfully created items
- ⚠️ Warnings (e.g., skipped items)
- ❌ Errors (if any)

At the end, you'll see a summary of what was created.

## Data Structure Compliance

All data created follows the exact structure used by the app:

- **Users**: Minimal profiles with no large arrays
- **Dreams**: Aggregated document per user with `dreamBook` and `weeklyGoalTemplates` arrays
- **Current Week**: One document per user with `goals` array
- **Past Weeks**: One document per user with `weekHistory` object
- **Teams**: Team relationship documents with `teamMembers` array
- **Connects**: Individual connect documents
- **Scoring**: Yearly scoring documents with `entries` array

## Testing Admin & Team Sections

After running the script, you can:

1. **Test Admin Features**:
   - Log in as `admin@netsurit.com`
   - View all users in People Hub
   - See team metrics and coaching alerts
   - Assign users to coaches

2. **Test Coach Features**:
   - Log in as `coach1@netsurit.com` or `coach2@netsurit.com`
   - View your team members
   - See team metrics
   - View coaching alerts

3. **Test User Features**:
   - Log in as any `user*@netsurit.com` account
   - View your dreams and goals
   - See your current week goals
   - View your connects and scoring

## Notes

- The script uses `upsert`, so running it multiple times will update existing data
- All dates are realistic (past dates for history, current date for active data)
- Goals use the unified tracking system with `targetWeeks` and `weeksRemaining`
- Scoring follows the app's rules: dream=10, connect=5, weekly goal=3

## Troubleshooting

If you encounter errors:

1. **"Database not configured"**: Check your environment variables
2. **"Container not found"**: Ensure all containers exist in your Cosmos DB
3. **"Partition key error"**: Verify container partition keys match the script expectations

For container setup, see `scripts/createNewContainers.cjs` or `scripts/setup-cosmos-db.ps1`.



