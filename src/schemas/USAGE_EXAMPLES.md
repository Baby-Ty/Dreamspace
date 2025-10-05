# Schema Usage Examples

Quick reference for using schemas in your components and services.

## 1. Loading User Data (Services)

```javascript
// src/services/databaseService.js
import { parseUserData } from '../schemas/index.js';

async loadUserData(userId) {
  try {
    const rawData = await this.fetchFromCosmosDB(userId);
    
    // Parse and validate data with safe defaults
    const userData = parseUserData(rawData);
    
    return ok(userData); // Always valid UserData
  } catch (error) {
    return fail(ErrorCodes.LOAD_ERROR, error.message);
  }
}
```

## 2. Dream Book Component

```javascript
// src/pages/DreamBook.jsx
import { useMemo } from 'react';
import { parseDreamList } from '../schemas';

function DreamBook() {
  const { userData } = useApp();
  
  // Safe parsing with automatic fallback
  const dreams = useMemo(() => 
    parseDreamList(userData?.dreamBook), 
    [userData]
  );

  // dreams is always Dream[] - safe to use
  return (
    <div>
      {dreams.length === 0 ? (
        <p>No dreams yet. Create your first dream!</p>
      ) : (
        dreams.map(dream => (
          <DreamCard key={dream.id} dream={dream} />
        ))
      )}
    </div>
  );
}
```

## 3. Career Goals Component

```javascript
// src/pages/career/CareerGoalsTab.jsx
import { parseCareerGoalList } from '../schemas';

function CareerGoalsTab({ userData }) {
  const goals = parseCareerGoalList(userData?.careerGoals);
  
  const activeGoals = goals.filter(g => g.status === 'In Progress');
  const completedGoals = goals.filter(g => g.status === 'Completed');

  return (
    <div>
      <h2>Active Goals ({activeGoals.length})</h2>
      {activeGoals.map(goal => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
      
      <h2>Completed ({completedGoals.length})</h2>
      {completedGoals.map(goal => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </div>
  );
}
```

## 4. People Dashboard

```javascript
// src/hooks/usePeopleData.js
import { parseCoachList, parseTeamMetrics } from '../schemas';

export function usePeopleData() {
  const [coaches, setCoaches] = useState([]);
  
  useEffect(() => {
    async function loadCoaches() {
      const result = await peopleService.getAllCoaches();
      
      if (result.success) {
        // Safe parsing - invalid coaches filtered out
        const validCoaches = parseCoachList(result.data);
        setCoaches(validCoaches);
      }
    }
    
    loadCoaches();
  }, []);
  
  return { coaches };
}
```

## 5. Dream Connect

```javascript
// src/hooks/useDreamConnections.js
import { parseConnectionSuggestionList } from '../schemas';

export function useDreamConnections() {
  const [connections, setConnections] = useState([]);
  
  const loadConnections = async () => {
    const users = await peopleService.getAllUsers();
    
    if (users.success) {
      // Parse with fallback for invalid data
      const suggestions = parseConnectionSuggestionList(users.data);
      setConnections(suggestions);
    }
  };
  
  return { connections, loadConnections };
}
```

## 6. Form Validation

```javascript
// Creating a new dream
import { DreamSchema } from '../schemas';

function DreamForm() {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    progress: 0
  });
  
  const [errors, setErrors] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      // Validate form data
      const validDream = DreamSchema.parse({
        id: Date.now(),
        ...formData,
        milestones: [],
        notes: [],
        history: []
      });
      
      // Save valid dream
      await saveDream(validDream);
      
    } catch (error) {
      // Show validation errors
      setErrors(error.errors.map(e => e.message));
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      {errors.length > 0 && (
        <div className="errors">
          {errors.map((err, i) => <p key={i}>{err}</p>)}
        </div>
      )}
    </form>
  );
}
```

## 7. API Response Parsing

```javascript
// src/services/peopleService.js
import { parseCoachList, parseCoachingAlertList } from '../schemas';

async getCoachingData(coachId) {
  try {
    const [metricsRes, alertsRes] = await Promise.all([
      fetch(`/api/getTeamMetrics?userId=${coachId}`),
      fetch(`/api/getCoachingAlerts?userId=${coachId}`)
    ]);
    
    const metricsData = await metricsRes.json();
    const alertsData = await alertsRes.json();
    
    // Parse with safe defaults
    const metrics = parseTeamMetrics(metricsData);
    const alerts = parseCoachingAlertList(alertsData);
    
    return ok({ metrics, alerts });
    
  } catch (error) {
    return fail(ErrorCodes.NETWORK, error.message);
  }
}
```

## 8. Custom Hook with Validation

```javascript
// src/hooks/useCareerData.js
import { parseCareerGoalList, parseDevelopmentPlanList } from '../schemas';

export function useCareerData() {
  const { userData } = useApp();
  
  const goals = useMemo(
    () => parseCareerGoalList(userData?.careerGoals),
    [userData]
  );
  
  const plans = useMemo(
    () => parseDevelopmentPlanList(userData?.developmentPlan),
    [userData]
  );
  
  const addGoal = async (newGoal) => {
    try {
      // Validate before saving
      const validGoal = CareerGoalSchema.parse(newGoal);
      const updated = [...goals, validGoal];
      await saveCareerGoals(updated);
    } catch (error) {
      console.error('Invalid goal:', error);
    }
  };
  
  return { goals, plans, addGoal };
}
```

## 9. Saving Data with Validation

```javascript
// Before saving to database
import { validateUserData } from '../schemas';

async function saveUserProfile(userData) {
  // Validate complete structure
  const { valid, errors } = validateUserData(userData);
  
  if (!valid) {
    console.error('Validation failed:', errors);
    return fail(ErrorCodes.VALIDATION, 'Invalid user data', { errors });
  }
  
  // Safe to save
  const result = await databaseService.saveUserData(userId, userData);
  return result;
}
```

## 10. Context Provider

```javascript
// src/context/AppContext.jsx
import { parseUserData } from '../schemas';

export function AppProvider({ children }) {
  const [userData, setUserData] = useState(null);
  
  const loadUserData = async (userId) => {
    const result = await databaseService.loadUserData(userId);
    
    if (result.success) {
      // Parse once at load time
      const validData = parseUserData(result.data);
      setUserData(validData);
    }
  };
  
  return (
    <AppContext.Provider value={{ userData, loadUserData }}>
      {children}
    </AppContext.Provider>
  );
}
```

## Quick Reference

| Parser | Input | Output | Use Case |
|--------|-------|--------|----------|
| `parseDream(data)` | any | Dream | Single dream validation |
| `parseDreamList(data)` | any[] | Dream[] | Dream book data |
| `parseCareerGoal(data)` | any | CareerGoal | Single goal validation |
| `parseCareerGoalList(data)` | any[] | CareerGoal[] | Career goals section |
| `parseCoach(data)` | any | Coach | Single coach validation |
| `parseCoachList(data)` | any[] | Coach[] | People dashboard |
| `parseUserData(data)` | any | UserData | Complete user profile |
| `validateUserData(data)` | any | {valid, errors?} | Pre-save validation |

## Pro Tips

### 1. Parse at Boundaries
Parse data when it enters your app (API responses, storage loads):
```javascript
// ✅ Good - parse once at entry point
const userData = parseUserData(await loadFromDB());

// ❌ Bad - parsing repeatedly in components
function Component() {
  const data = parseUserData(props.data); // Re-parsing on every render
}
```

### 2. Use in Custom Hooks
Centralize parsing logic in hooks:
```javascript
function useDreams() {
  const { userData } = useApp();
  return useMemo(() => parseDreamList(userData?.dreamBook), [userData]);
}
```

### 3. Type Guard Pattern
Use parsers as type guards:
```javascript
function isDream(data) {
  try {
    DreamSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}
```

### 4. Partial Validation
Validate specific fields only:
```javascript
const PartialDreamSchema = DreamSchema.pick({ 
  title: true, 
  category: true 
});

PartialDreamSchema.parse({ title: 'Test', category: 'Learning' });
```

---

**Remember**: All parsers are safe and never throw - use them confidently! 🎯

