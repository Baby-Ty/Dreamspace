# People Hub - Cosmos DB Integration

## Overview

The People Hub has been successfully integrated with Azure Cosmos DB for live data management. This document outlines the architecture, schema, and deployment requirements.

## 🏗️ Architecture

### Data Flow
```
People Dashboard → peopleService → Azure Functions → Cosmos DB
                                ↓
                    localStorage (Development Fallback)
```

### Components Created

1. **peopleService.js** - Client-side service for data operations
2. **Azure Functions** - Server-side API endpoints
3. **Cosmos DB Schema** - Data structure for teams and users

## 📊 Cosmos DB Schema

### Database: `dreamspace`

#### Container 1: `users`
- **Partition Key**: `/userId` or `/id`
- **Documents**: User profiles with coaching assignments (without large arrays)
- **Structure**:
  ```json
  {
    "id": "user@example.com",
    "userId": "user@example.com",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user|coach|manager|admin",
    "isCoach": boolean,
    "assignedCoachId": number,
    "assignedTeamName": string,
    "assignedAt": "ISO date string",
    "promotedAt": "ISO date string",
    "score": number,
    "dreamsCount": number,
    "connectsCount": number,
    "dataStructureVersion": 2
  }
  ```

#### Container 2: `items` (new - 3-container architecture)
- **Partition Key**: `/userId`
- **Documents**: Individual dreams, goals, scoring entries, connects, etc.
- **Structure**:
  ```json
  {
    "id": "dream_12345",
    "userId": "user@example.com",
    "type": "dream|weekly_goal|scoring_entry|connect|career_goal|development_plan",
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string",
    ... type-specific fields ...
  }
  ```

#### Container 3: `teams`
- **Partition Key**: `/managerId`
- **Documents**: Team relationships and coaching assignments
- **Structure**:
  ```json
  {
    "id": "team_123_1698765432000",
    "type": "team_relationship",
    "managerId": 123,
    "teamMembers": [456, 789, 101],
    "teamName": "Development Team Alpha",
    "managerRole": "Dream Coach",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "lastModified": "2024-01-15T10:00:00.000Z",
    "isActive": true,
    "createdBy": "system"
  }
  ```

## 🚀 Azure Functions API

### Endpoints Created

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/getAllUsers` | GET | Retrieve all users with role info |
| `/api/getTeamRelationships` | GET | Get all team-coach relationships |
| `/api/getTeamMetrics/{managerId}` | GET | Calculate team performance metrics |
| `/api/getCoachingAlerts/{managerId}` | GET | Generate coaching alerts for manager |
| `/api/promoteUserToCoach` | POST | Promote user to coach role |
| `/api/assignUserToCoach` | POST | Assign user to existing coach |

### Request/Response Examples

#### Promote User to Coach
```http
POST /api/promoteUserToCoach
Content-Type: application/json

{
  "userId": 456,
  "teamName": "Marketing Dream Team"
}
```

#### Assign User to Coach
```http
POST /api/assignUserToCoach
Content-Type: application/json

{
  "userId": 789,
  "coachId": 123
}
```

## 🔧 Setup Requirements

### 1. Cosmos DB Containers

You need to create the `teams` container in your existing `dreamspace` database:

```bash
# Using Azure CLI
az cosmosdb sql container create \
    --account-name your-cosmos-account \
    --database-name dreamspace \
    --resource-group your-resource-group \
    --name teams \
    --partition-key-path "/managerId" \
    --throughput 400
```

### 2. Azure Functions Configuration

The new Azure Functions are already created in the `/api` directory. They will be automatically deployed with your next GitHub push.

### 3. Environment Variables

Ensure these environment variables are set in your Azure Static Web App:

```bash
VITE_APP_ENV=production
COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_KEY=your-primary-key
```

## 💻 Development Mode

In development mode (localhost), the People Hub automatically falls back to:

- **localStorage** for data persistence
- **Mock data functions** from `mockData.js` for initial population
- **Simulated CRUD operations** that update localStorage

This ensures seamless development without requiring Cosmos DB setup locally.

## 🎯 Features Implemented

### Data Management
- ✅ Load all users from Cosmos DB
- ✅ Load team relationships and coaching assignments
- ✅ Calculate real-time team metrics
- ✅ Generate coaching alerts based on user activity
- ✅ Promote users to coach role with new team creation
- ✅ Assign users to existing coaches
- ✅ Real-time data refresh after operations

### UI/UX Enhancements
- ✅ Loading states with spinners
- ✅ Error handling with retry functionality
- ✅ Success feedback for operations
- ✅ Automatic data refresh after changes
- ✅ Fallback to mock data in development

### Performance Optimizations
- ✅ Parallel data loading
- ✅ Cached metrics and alerts
- ✅ Efficient Cosmos DB queries
- ✅ Error boundary handling
- ✅ Graceful degradation

## 📈 Metrics and Analytics

The system now provides real-time analytics including:

- **Program Adoption Rate**: Percentage of users assigned to coaches
- **Coach Count**: Total number of active coaches
- **Unassigned Users**: Users not yet assigned to any coach
- **Active Alerts**: Coaching interventions required
- **Team Performance**: Individual team metrics and engagement rates
- **User Engagement**: Activity levels and dream progress tracking

## 🧪 Testing

### Development Testing
1. Run `npm run dev` to start the application
2. Navigate to the People Hub
3. Verify data loads from mock data
4. Test promotion and assignment operations
5. Check localStorage persistence

### Production Testing
1. Deploy to Azure Static Web App
2. Ensure Cosmos DB containers are created
3. Verify environment variables are set
4. Test all CRUD operations with live data
5. Monitor Azure Functions logs for errors

## 🚨 Error Handling

The system includes comprehensive error handling:

- **Network failures**: Fallback to localStorage
- **API errors**: User-friendly error messages
- **Missing data**: Graceful degradation
- **Invalid operations**: Validation and error feedback
- **Development mode**: Automatic mock data initialization

## 📝 Next Steps

1. **Deploy the changes** to Azure Static Web App
2. **Create the `teams` container** in Cosmos DB
3. **Test the integration** with live data
4. **Monitor performance** and optimize queries if needed
5. **Add more advanced features** like bulk operations and advanced analytics

## 🎉 Benefits

- **Real-time data**: Live updates from Cosmos DB
- **Scalable architecture**: Azure Functions handle load automatically  
- **Development friendly**: Works offline with mock data
- **Production ready**: Proper error handling and performance optimization
- **Cost effective**: Only pay for what you use with Cosmos DB
- **Maintainable**: Clean separation of concerns and well-documented APIs
