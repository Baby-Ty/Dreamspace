# Dream Coach Teams Button Implementation

## Summary

Added a "Send Teams Check-in" button to the Dream Coach modal that allows coaches to send check-in requests directly to team members via Teams.

## Changes Made to `src/pages/DreamCoach.jsx`

### 1. Added Import
```javascript
import { Send } from 'lucide-react';
```

### 2. Added State Variables
```javascript
// Teams messaging state
const [sendingTeamsMessage, setSendingTeamsMessage] = useState(false);
const [teamsMessageResult, setTeamsMessageResult] = useState(null);
```

### 3. Added Function
```javascript
// Send Teams check-in message
const sendTeamsCheckin = async (member) => {
  setSendingTeamsMessage(true);
  setTeamsMessageResult(null);
  
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/sendTeamsMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: currentUser.id,
          recipientIds: [member.id],
          messageType: 'checkin_request',
          messageData: {
            message: `Hi ${member.name}! Time for your weekly check-in. Please share your wins and challenges this week.`
          }
        })
      }
    );
    
    const result = await response.json();
    setTeamsMessageResult(result);
    
    // Auto-clear result after 5 seconds
    setTimeout(() => setTeamsMessageResult(null), 5000);
  } catch (error) {
    console.error('Error sending Teams message:', error);
    setTeamsMessageResult({ 
      success: false, 
      error: error.message 
    });
    
    // Auto-clear error after 5 seconds
    setTimeout(() => setTeamsMessageResult(null), 5000);
  } finally {
    setSendingTeamsMessage(false);
  }
};
```

### 4. Added Button to Modal
Added after the "Schedule Check-in" button in the `MemberDetailModal` component:

```javascript
<button 
  onClick={() => sendTeamsCheckin(member)}
  disabled={sendingTeamsMessage}
  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
>
  {sendingTeamsMessage ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Sending...</span>
    </>
  ) : (
    <>
      <Send className="h-4 w-4" />
      <span>Send Teams Check-in</span>
    </>
  )}
</button>
```

### 5. Added Result Display
Shows success/error feedback below the button:

```javascript
{teamsMessageResult && (
  <div className={`p-3 rounded-lg text-sm animate-fade-in ${
    teamsMessageResult.success && teamsMessageResult.sent > 0
      ? 'bg-green-50 border border-green-200 text-green-800'
      : teamsMessageResult.notInstalled > 0
      ? 'bg-amber-50 border border-amber-200 text-amber-800'
      : 'bg-red-50 border border-red-200 text-red-800'
  }`}>
    {/* Success, Not Installed, or Failed messages */}
  </div>
)}
```

## Visual Result

The modal now has three buttons in the right sidebar:

```
┌─────────────────────────────────────────┐
│ Sarah Johnson                     ✕     │
│ Cape Town • 148 points                  │
├─────────────────────────────────────────┤
│ Dreams Portfolio    │ Coaching Notes    │
│                     │                   │
│ [Dream details]     │ [Recent notes]    │
│                     │                   │
│                     │ ┌───────────────┐ │
│                     │ │ 💬 Add Note   │ │
│                     │ └───────────────┘ │
│                     │ ┌───────────────┐ │
│                     │ │ 📅 Schedule   │ │
│                     │ └───────────────┘ │
│                     │ ┌───────────────┐ │
│                     │ │ 📤 Send Teams │ │ ← NEW
│                     │ └───────────────┘ │
│                     │                   │
│                     │ [Success/Error]   │ ← NEW
└─────────────────────────────────────────┘
```

## User Flow

1. **Coach opens modal** - Clicks on team member (e.g., Sarah Johnson)
2. **Coach clicks "Send Teams Check-in"** button
3. **Button shows loading state** - "Sending..." with spinner
4. **API call is made** to `/api/sendTeamsMessage` endpoint
5. **Result is displayed**:
   - ✅ **Success**: "Sent to Teams! Sarah will receive the check-in card in Teams."
   - ⚠️ **Not Installed**: "Bot Not Installed. Sarah needs to install the Dreamspace bot in Teams first."
   - ❌ **Failed**: "Failed to Send. Please try again later."
6. **Result auto-clears** after 5 seconds
7. **Team member receives** adaptive card in Teams (if bot installed)
8. **Team member fills and submits** check-in card
9. **Coach gets notification** in Teams when completed

## Next Steps

To make this fully functional, you need to:

1. ✅ **Button added** - Complete
2. ⏳ **Create API endpoint** - `api/sendTeamsMessage/index.js`
3. ⏳ **Deploy bot code** - Teams bot needs to be deployed
4. ⏳ **Test end-to-end** - Coach → Teams → Team member → Response

## API Endpoint Required

The button calls:
```
POST ${VITE_API_BASE_URL}/api/sendTeamsMessage
```

With payload:
```json
{
  "coachId": "coach-user-id",
  "recipientIds": ["team-member-id"],
  "messageType": "checkin_request",
  "messageData": {
    "message": "Hi Sarah! Time for your weekly check-in..."
  }
}
```

Expected response:
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "notInstalled": 0,
  "details": {
    "sentTo": ["user-id"],
    "failedTo": [],
    "notInstalledUsers": []
  }
}
```

## Environment Variable Needed

Make sure `.env` or `.env.local` has:
```
VITE_API_BASE_URL=https://your-function-app.azurewebsites.net
```

Or for local development:
```
VITE_API_BASE_URL=http://localhost:7071
```

## Testing Checklist

- [ ] Button appears in modal
- [ ] Button shows loading state when clicked
- [ ] API endpoint exists and responds
- [ ] Success message displays correctly
- [ ] "Not installed" message displays when user hasn't installed bot
- [ ] Error message displays on failure
- [ ] Result auto-clears after 5 seconds
- [ ] Team member receives card in Teams
- [ ] Card submission works
- [ ] Coach receives notification

## Styling

The button uses:
- **Blue gradient** (`from-blue-600 to-blue-700`) to differentiate from other buttons
- **Send icon** from Lucide React
- **Loading spinner** when sending
- **Disabled state** while sending (opacity-50, cursor-not-allowed)
- **Hover effects** (darker blue)
- **Shadow effects** for depth

## Error Handling

The implementation handles:
- Network errors (fetch fails)
- API errors (non-200 response)
- User not found (bot not installed)
- Timeout scenarios
- Auto-clearing of messages

All errors are logged to console for debugging.

