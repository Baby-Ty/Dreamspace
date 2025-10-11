# Demo User Setup for DreamSpace

This guide explains how to set up the demo users in Cosmos DB for the DreamSpace application.

## Problem
The demo login was showing a white screen because the demo user (Sarah Johnson) didn't have proper data structure in Cosmos DB.

## Solution
Created a complete demo user setup with:
- **Sarah Johnson** - Senior Development Manager (Coach)
- **Mike Chen** - Frontend Developer (Team Member)
- **Jennifer Smith** - Full Stack Developer (Team Member) 
- **Alex Rodriguez** - Junior Developer (Team Member)

## Setup Steps

### 1. Create Users in Cosmos DB
Open the setup page in your browser:
```
http://localhost:7071/setup-demo-cosmos.html
```

Click the "🎯 Create Demo Users in Cosmos DB" button to create all 4 users with:
- Complete dream books with realistic goals
- Career profiles and development plans
- Coaching relationships (Sarah coaches the other 3)
- Sample interactions and progress tracking

### 2. Demo Login Flow
The demo login now:
1. Attempts to load Sarah Johnson from Cosmos DB (`sarah.johnson@netsurit.com`)
2. Falls back to mock data if Cosmos DB is unavailable
3. Sets Sarah as an admin role for full access

### 3. User Data Structure
Each user has:
- **Profile**: Name, email, office, avatar, job title
- **Dreams**: Goals with progress, milestones, notes, history
- **Career Goals**: Professional development objectives
- **Career Profile**: Current role, aspirations, preferences, skills
- **Coaching Data**: Connects, team relationships, scores

## Files Created
- `setup-demo-users.js` - User data definitions
- `setup-demo-cosmos.html` - Web interface to create users in Cosmos DB
- `DEMO_SETUP.md` - This documentation

## Code Changes
- Updated `src/context/AuthContext.jsx` to load Sarah from Cosmos DB during demo login
- Added fallback mechanism if Cosmos DB is unavailable

## Testing
The demo login should now work properly with realistic data and no white screen issues.

## Team Relationships
- **Sarah Johnson** (Coach)
  - Manages: Mike Chen, Jennifer Smith, Alex Rodriguez
  - Role: Senior Development Manager
  - Access: Admin level (can see all coaching features)

- **Team Members**
  - All report to Sarah Johnson
  - Have realistic dreams and career goals
  - Include coaching notes from Sarah
  - Different experience levels (Junior, Mid, Senior track)
