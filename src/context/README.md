# Context Documentation

## AuthContext

The `AuthContext` provides authentication state and Microsoft Graph API utilities throughout the application.

### Usage

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, graph, getToken, isAuthenticated, isLoading } = useAuth();
  
  // Access user data
  console.log(user.name, user.email);
  
  // Use Graph API
  const fetchProfile = async () => {
    const result = await graph.getMe();
    if (result.success) {
      console.log(result.data);
    }
  };
  
  // Get access token for custom API calls
  const token = await getToken();
}
```

### Provided Values

| Property | Type | Description |
|----------|------|-------------|
| `user` | Object \| null | Current authenticated user data |
| `userRole` | String \| null | User's role (admin, coach, etc.) |
| `isAuthenticated` | Boolean | Whether user is logged in |
| `isLoading` | Boolean | Whether auth is loading |
| `loginError` | String \| null | Login error message |
| `login` | Function | Initiates login flow |
| `logout` | Function | Logs out current user |
| `clearLoginError` | Function | Clears login error |
| `getToken` | Function | Returns access token (async) |
| `graph` | Object | Microsoft Graph API service |

### Graph Service

The `graph` object provides authenticated Microsoft Graph API methods:

```javascript
// Get current user profile
const result = await graph.getMe();

// Get user by ID
const result = await graph.getUser(userId);

// Search users
const result = await graph.searchUsers('john');

// Get user photo
const result = await graph.getMyPhoto();
```

All methods return `{ success, data?, error? }` format.

## AppContext

The `AppContext` (when implemented) provides application-wide state management using `useReducer`.

See `AppContext.new.jsx` for the refactored version using:
- `useReducer` for state management
- `usePersistence` for localStorage sync
- Action creators from `state/actions.js`

### Future Migration

To migrate to the new AppContext:
1. Replace `AppContext.jsx` with `AppContext.new.jsx`
2. Move domain logic to custom hooks
3. Update components to use `useAppContext()` hook

