# Riddle Gameplay Implementation

This document describes the complete riddle gameplay system for Bergvlei.

## Overview

The gameplay system is a complete AI-powered riddle game with:
- **Backend-driven riddle system** - All riddles loaded from PostgreSQL database
- Dynamic riddle generation using Gemini AI (backend)
- Smart hint system with predefined and AI-generated hints
- **Custom riddle creation** - Premium users can generate riddles by category or custom answer
- Answer validation with server-side validation and AI fuzzy matching
- Scoring system with difficulty-based points
- Daily riddle limits for freemium model (enforced server-side via Redis)
- Progress tracking and statistics (persistent in database)
- RevenueCat integration for premium subscriptions

## Architecture

The mobile app is a **thin client** that communicates with a Node.js backend API:

```
Mobile App (React Native)
    ↓
Backend API (Node.js + Express)
    ↓
├── PostgreSQL (riddles, users, attempts, stats)
├── Redis (caching, daily limits, leaderboards)
└── Google Gemini AI (riddle generation, hints)
```

**Key Principle**: All AI operations happen on the backend for security, cost control, and centralized management.

## File Structure

```
mobile/
├── app/
│   ├── game.tsx                      # Game route wrapper
│   └── (tabs)/
│       ├── index.tsx                 # Home screen
│       ├── play.tsx                  # Play screen
│       ├── create.tsx                # Custom riddle creation (NEW)
│       └── profile.tsx               # Profile screen
├── src/
│   ├── screens/
│   │   ├── RiddleGameScreen.tsx     # Main gameplay screen
│   │   └── CreateRiddleScreen.tsx   # Custom riddle generator (NEW)
│   ├── stores/
│   │   ├── gameStore.ts             # Game state management
│   │   └── authStore.ts             # Authentication state
│   ├── services/
│   │   ├── api.ts                   # Backend API client
│   │   └── purchases.ts             # RevenueCat integration
│   └── components/
│       └── PurchaseModal.tsx        # Subscription UI
```

**Removed Files:**
- ❌ `src/services/ai.ts` - Deprecated (moved to backend)
- ❌ `src/utils/testAI.ts` - Deprecated
- ❌ `src/components/AITestScreen.tsx` - Deprecated

## Screens

### 1. Home Screen (`app/(tabs)/index.tsx`)

**Features:**
- Displays user statistics (streak, solved today, total score)
- Quick Play button for immediate gameplay
- Shows remaining riddles for free users (X/5)
- Premium upgrade prompt when daily limit reached

**Key Components:**
- Real-time stats from gameStore (fetched from backend)
- Conditional rendering based on daily limit
- Navigation to game screen

**Data Flow:**
```typescript
useEffect(() => {
  gameStore.fetchStats(); // GET /api/riddles/stats
}, []);
```

### 2. Play Screen (`app/(tabs)/play.tsx`)

**Features:**
- Difficulty selector (Easy, Medium, Hard)
- Current stats display (score, riddles solved)
- Start Playing button
- Freemium information

**Key Components:**
- Difficulty buttons with active state
- Stats cards showing today's progress
- Navigation to game screen with selected difficulty

### 3. Create Screen (`app/(tabs)/create.tsx`) - NEW

**Features:**
- **Premium-only feature** - Shows upgrade prompt for free users
- Two generation modes:
  - **Category Mode**: Select from 8 predefined categories (Nature, Animals, Science, etc.)
  - **Custom Answer Mode**: Enter a custom answer to generate a riddle around
- Difficulty selector (Easy, Medium, Hard, Expert)
- Riddle preview after generation
- Two action options:
  - **Play Now**: Immediately play the generated riddle
  - **Save for Later**: Save to user's collection

**User Flow:**
```
1. Select mode (Category or Custom Answer)
2. Choose category OR enter custom answer
3. Select difficulty level
4. Tap "Generate Riddle"
5. AI generates riddle via backend
6. Preview riddle
7. Choose: Play Now → Game Screen
         OR Save for Later → Saved to collection
```

**API Integration:**
```typescript
// Generate by category
const riddle = await api.generateAIRiddle('HARD', 'nature');

// Generate by custom answer
const riddle = await api.generateAIRiddle('MEDIUM', undefined, 'bicycle');

// Save for later
await api.saveCustomRiddle(riddle.id);
```

### 4. Riddle Game Screen (`src/screens/RiddleGameScreen.tsx`)

**Main Gameplay Screen**

**Features:**
- Displays riddles loaded from database
- Text input for answers
- Hint system with predefined hints from database
- Answer validation via backend API
- Score calculation (server-side)
- Skip riddle option
- Auto-progression to next riddle

**Game Flow:**
1. Load riddle from backend (`GET /api/riddles?difficulty=MEDIUM`)
2. Display riddle to user
3. User can request hints (`GET /api/riddles/{id}/hint?hintNumber=0`)
4. User submits answer (`POST /api/riddles/submit`)
5. Backend validates answer and calculates score
6. Show feedback (correct/incorrect)
7. Auto-load next riddle (if correct)

## State Management (Zustand)

### gameStore

**State:**
```typescript
{
  currentRiddle: RiddleResponse | null;
  currentHints: string[];
  riddleAttempts: RiddleAttempt[];
  riddlesSolvedToday: number;
  hintsUsed: number;
  hintsRemaining: number;
  score: number;
  isLoading: boolean;
  error: string | null;
  currentDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  stats: UserStats | null;
  riddleStartTime: number | null;
  customRiddleMode: boolean;             // NEW
  savedCustomRiddles: RiddleResponse[];  // NEW
}
```

**Actions:**
```typescript
// Core gameplay
fetchNewRiddle(difficulty?): Promise<boolean>
  → GET /api/riddles?difficulty=X

submitAnswer(answer): Promise<{ correct: boolean; message: string }>
  → POST /api/riddles/submit

requestHint(): Promise<string | null>
  → GET /api/riddles/{id}/hint?hintNumber=X

fetchStats(): Promise<void>
  → GET /api/riddles/stats

// Custom riddles (NEW)
generateCustomRiddle(difficulty, categoryOrAnswer, isCustomAnswer): Promise<RiddleResponse | null>
  → GET /api/riddles/generate-ai?difficulty=X&category=Y
  → GET /api/riddles/generate-ai?difficulty=X&customAnswer=Y

saveCustomRiddle(riddleId): Promise<boolean>
  → POST /api/riddles/save-custom

playCustomRiddle(riddle): void
  → Sets riddle as current and navigates to game

loadSavedRiddles(): Promise<void>
  → GET /api/riddles/saved-riddles

// State management
setCurrentRiddle(riddle)
addHint(hint)
clearHints()
setLoading(loading)
setDifficulty(difficulty)
resetCurrentGame()
clearError()
```

### authStore

**State:**
```typescript
{
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Key User Properties:**
```typescript
{
  id: string;
  email: string;
  username: string | null;
  isPremium: boolean;
  subscriptionTier: 'FREE' | 'PREMIUM';
  createdAt: string;
}
```

## Gameplay Mechanics

### 1. Riddle Loading

**Database-first approach:**
```typescript
// Fetch riddle from backend
const response = await api.getRiddle('MEDIUM');

// Backend logic:
// 1. Check user's daily limit (Redis cache)
// 2. Query PostgreSQL for unsolved riddles
// 3. Exclude already-solved riddles
// 4. Return random riddle matching difficulty
// 5. Create RiddleAttempt record
// 6. Increment daily counter in cache
```

**API Endpoint:**
```
GET /api/riddles?difficulty=EASY|MEDIUM|HARD|EXPERT
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "riddle-123",
    "question": "I speak without a mouth...",
    "difficulty": "MEDIUM",
    "category": "Logic",
    "hintsAvailable": 3
  }
}
```

### 2. Hint System

**Predefined Hints** (stored in database):
```typescript
// Request next hint
const response = await api.getHint(riddleId);

// Backend returns hint from riddle.hints array
// Premium check: Non-premium users only get first hint (index 0)
```

**AI-Generated Hints** (Premium feature):
```typescript
// Request dynamic AI hint
const response = await api.getAIHint(riddleId);

// Backend:
// 1. Checks user isPremium
// 2. Gets previous hints from attempt
// 3. Calls Gemini AI with context
// 4. Returns contextual hint
```

**Hint Behavior:**
- **Free users**: 1 predefined hint only
- **Premium users**: 3 predefined hints + unlimited AI hints
- Each hint costs points (HINT_PENALTY = 5 points)
- Hints progressively reveal more information

### 3. Answer Validation

**Server-side validation:**
```typescript
const response = await api.submitAnswer({
  riddleId,
  answer,
  timeSpent,
  hintsUsed
});

// Backend logic:
// 1. Simple case-insensitive match first
// 2. If close, use AI fuzzy matching
// 3. Update RiddleAttempt record
// 4. Calculate score
// 5. Update user stats
// 6. Update leaderboards
// 7. Return result with score
```

**Validation Logic:**
- Exact match (case-insensitive): `answer.toLowerCase() === correctAnswer.toLowerCase()`
- AI fuzzy matching for close answers (handles typos, synonyms)
- Fallback: Levenshtein distance calculation

**API Endpoint:**
```
POST /api/riddles/submit
Body: { riddleId, answer, timeSpent?, hintsUsed? }
```

### 4. Scoring System

**Base Points (server-side):**
- Easy: 10 points
- Medium: 25 points
- Hard: 50 points
- Expert: 75 points

**Penalties:**
- Each hint used: -5 points

**Calculation (backend):**
```typescript
const basePoints = {
  EASY: 10,
  MEDIUM: 25,
  HARD: 50,
  EXPERT: 75
}[difficulty];

const hintPenalty = hintsUsed * 5;
const finalPoints = Math.max(0, basePoints - hintPenalty);

// Update user stats
await prisma.userStats.update({
  where: { userId },
  data: {
    totalRiddlesSolved: { increment: 1 },
    totalHintsUsed: { increment: hintsUsed }
  }
});
```

### 5. Freemium Limits

**Free Users:**
- 5 riddles per day (enforced server-side via Redis)
- 1 hint per riddle only
- No custom riddle generation
- Ads after every 3 riddles (configured, not yet implemented)

**Premium Users:**
- Unlimited riddles per day
- 3 predefined hints + unlimited AI hints
- Custom riddle generation with categories or answers
- Save custom riddles
- No ads

**Daily Limit Enforcement:**
```typescript
// Backend checks Redis cache
const dailyCount = await cacheService.getDailyRiddleCount(userId);

if (!user.isPremium && dailyCount >= 5) {
  throw new AppError(403, 'Daily riddle limit reached');
}
```

## Custom Riddle Generation

### Feature Overview

Premium users can generate personalized riddles using AI:
- **Category Mode**: Select from 8 predefined categories
- **Custom Answer Mode**: Provide a specific answer to generate a riddle around
- All difficulty levels available (Easy, Medium, Hard, Expert)
- Preview before playing or saving
- Save to personal collection for later

### Categories

```typescript
const CATEGORIES = [
  'Nature',       // 🌿 Animals, plants, weather
  'Animals',      // 🦁 Creatures, behaviors
  'Science',      // 🔬 Physics, chemistry, biology
  'History',      // 📜 Events, figures, eras
  'Technology',   // 💻 Gadgets, innovations
  'Food & Drink', // 🍕 Culinary topics
  'Entertainment',// 🎬 Movies, music, arts
  'Sports'        // ⚽ Games, athletes
];
```

### API Integration

**Generate by Category:**
```typescript
GET /api/riddles/generate-ai?difficulty=HARD&category=nature

// Backend flow:
// 1. Check user isPremium
// 2. Check daily limit
// 3. Call Gemini AI with category constraint
// 4. Parse AI response (question, answer, hints, category)
// 5. Store in PostgreSQL
// 6. Create RiddleAttempt
// 7. Return riddle
```

**Generate by Custom Answer:**
```typescript
GET /api/riddles/generate-ai?difficulty=MEDIUM&customAnswer=bicycle

// Backend flow:
// 1. Check user isPremium
// 2. Check daily limit
// 3. Call Gemini AI with custom answer constraint
// 4. AI creates riddle where answer IS "bicycle"
// 5. Store in PostgreSQL with aiGenerated=true
// 6. Return riddle
```

**Save Custom Riddle:**
```typescript
POST /api/riddles/save-custom
Body: { riddleId }

// Backend flow:
// 1. Create SavedRiddle record
// 2. Link to user and riddle
// 3. Prevent duplicates (unique constraint)
```

**Get Saved Riddles:**
```typescript
GET /api/riddles/saved-riddles

// Backend flow:
// 1. Query SavedRiddle records for user
// 2. Include Riddle details
// 3. Order by savedAt DESC
```

### User Flow

```
1. User taps "Create" tab
2. If not premium → Show upgrade prompt
3. Select mode: Category or Custom Answer
4. Category Mode:
   a. Choose category (e.g., "Science")
   b. Select difficulty
   c. Tap "Generate Riddle"
5. Custom Answer Mode:
   a. Enter answer (e.g., "telescope")
   b. Select difficulty
   c. Tap "Generate Riddle"
6. AI generates riddle (5-10 seconds)
7. Preview riddle with question and category
8. Choose action:
   → Play Now: Navigate to game screen with riddle
   → Save for Later: Save to collection, show success
9. Reset form for another generation
```

## User Flow

### Standard Gameplay Flow

```
1. Home Screen
   ├─> Quick Play → Fetch Riddle → Game Screen
   └─> Play Tab → Select Difficulty → Fetch Riddle → Game Screen

2. Game Screen
   ├─> Load riddle from backend (GET /api/riddles)
   ├─> Display riddle
   ├─> User Actions:
   │   ├─> Request Hint (GET /api/riddles/{id}/hint)
   │   ├─> Submit Answer (POST /api/riddles/submit)
   │   └─> Skip Riddle (confirm dialog)
   ├─> Backend validates and calculates score
   ├─> Feedback
   │   ├─> Correct: Show score → Auto-load next riddle (2s)
   │   └─> Incorrect: Prompt to try again or get hint
   └─> Repeat

3. Daily Limit Reached (Free Users)
   └─> 429 Error from backend → Show Premium Upgrade Prompt

4. Create Custom Riddle (Premium Only)
   ├─> Select Category or Enter Custom Answer
   ├─> Generate (GET /api/riddles/generate-ai)
   ├─> Preview riddle
   └─> Play Now OR Save for Later
```

### Authentication Flow

```
1. App Launch
   ├─> Check AsyncStorage for token
   └─> If token exists:
       ├─> Validate with GET /api/auth/profile
       ├─> Initialize RevenueCat with user ID
       └─> Load user stats

2. Login/Register
   ├─> POST /api/auth/login or /api/auth/register
   ├─> Receive JWT token
   ├─> Store in AsyncStorage
   ├─> Identify user in RevenueCat
   └─> Navigate to Home

3. Logout
   ├─> Clear AsyncStorage token
   ├─> Reset auth store
   ├─> Logout from RevenueCat
   └─> Navigate to Auth screen
```

## UI/UX Features

### Visual Feedback

**Success (Correct Answer):**
- Green feedback banner
- Shows points earned
- Auto-advances after 2 seconds

**Error (Incorrect):**
- Red feedback banner
- Suggests getting a hint

### Loading States

- Shows ActivityIndicator during:
  - Riddle loading from API
  - Hint fetching
  - Answer submission
  - Custom riddle generation
- Disables buttons during loading

### Keyboard Handling

- KeyboardAvoidingView for proper input visibility
- Submit on Enter/Return key
- Input auto-focuses on load

### Premium Gates

**Free users see upgrade prompts when:**
- Accessing Create tab
- Daily limit reached (5 riddles)
- Attempting to get more than 1 hint
- Attempting to use AI hints

## Error Handling

### HTTP Status Codes

- **200**: Success
- **401**: Unauthorized - JWT token invalid or missing
  - Action: Clear token, navigate to login
- **403**: Forbidden - Premium feature or daily limit
  - Action: Show upgrade prompt or limit message
- **404**: Not found - Riddle or user not found
  - Action: Show error, navigate back
- **429**: Too many requests - Rate limited
  - Action: Show "Daily limit reached" message
- **500**: Server error - Backend failure
  - Action: Show error, allow retry

### Network Errors

```typescript
try {
  const response = await api.getRiddle('MEDIUM');
  if (!response.success) {
    // Handle API error
    Alert.alert('Error', response.error?.message);
  }
} catch (error) {
  // Handle network error
  Alert.alert('Network Error', 'Please check your connection');
}
```

### API Error Messages

```typescript
// Backend standardized error format
{
  "success": false,
  "error": {
    "message": "Daily riddle limit reached. Upgrade to premium for unlimited riddles.",
    "code": "LIMIT_REACHED"
  }
}
```

### Edge Cases

- **Empty answer submission**: Client-side validation prompts user
- **No current riddle**: Shows loading state, auto-fetches
- **Daily limit**: Backend returns 403, shows upgrade prompt
- **Invalid token**: Navigates to login screen
- **Backend down**: Shows error with retry button

## API Reference

### Authentication

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
```

### Riddles

```
GET  /api/riddles?difficulty=EASY|MEDIUM|HARD|EXPERT
POST /api/riddles/submit
GET  /api/riddles/:riddleId/hint?hintNumber=0
GET  /api/riddles/:riddleId/ai-hint (Premium)
GET  /api/riddles/stats
POST /api/riddles/validate-ai
GET  /api/riddles/generate-ai?difficulty=X&category=Y (Premium)
GET  /api/riddles/generate-ai?difficulty=X&customAnswer=Y (Premium)
POST /api/riddles/save-custom (Premium)
GET  /api/riddles/saved-riddles (Premium)
```

### Subscription

```
GET  /api/subscription/status
POST /api/subscription/sync
GET  /api/subscription/offerings
```

### Leaderboard

```
GET  /api/leaderboard?period=daily|weekly|monthly|alltime
GET  /api/leaderboard/rank
```

## Testing

### Manual Testing Steps

**Prerequisites:**
- Backend server running (`npm run dev` in backend/)
- Database seeded with riddles
- Valid user account created

1. **Start Game**
   ```
   - Launch app and login
   - Go to Home screen
   - Tap "Quick Play"
   - Verify riddle loads from backend
   - Check network tab shows GET /api/riddles
   ```

2. **Request Hint**
   ```
   - Tap "Get Hint" button
   - Verify hint appears in UI
   - Check network: GET /api/riddles/{id}/hint
   - Verify hint count increments
   ```

3. **Submit Answer**
   ```
   - Enter correct answer
   - Verify success feedback
   - Check network: POST /api/riddles/submit
   - Verify score increases
   - Confirm auto-advance to next riddle
   ```

4. **Test Wrong Answer**
   ```
   - Enter incorrect answer
   - Verify error feedback
   - Check score doesn't change
   ```

5. **Daily Limit (Free User)**
   ```
   - Solve 5 riddles
   - Attempt 6th riddle
   - Verify 403 error from backend
   - Check upgrade prompt appears
   ```

6. **Custom Riddle Generation (Premium)**
   ```
   - Login as premium user
   - Navigate to Create tab
   - Select category "Nature"
   - Select difficulty "Hard"
   - Tap "Generate Riddle"
   - Verify API call: GET /api/riddles/generate-ai
   - Verify riddle preview appears
   - Test "Play Now" button
   - Test "Save for Later" button
   ```

7. **Custom Answer Generation**
   ```
   - On Create tab, switch to "Custom Answer"
   - Enter "telescope"
   - Generate riddle
   - Verify API call includes customAnswer param
   - Check riddle makes sense for "telescope"
   ```

8. **Premium Gate**
   ```
   - Login as free user
   - Navigate to Create tab
   - Verify upgrade prompt appears
   - Check "Upgrade to Premium" button works
   ```

### Backend Integration Testing

Test with different user states:
```bash
# Free user - daily limit
curl -H "Authorization: Bearer FREE_USER_TOKEN" \
  http://localhost:3001/api/riddles

# Premium user - unlimited
curl -H "Authorization: Bearer PREMIUM_USER_TOKEN" \
  http://localhost:3001/api/riddles/generate-ai?difficulty=HARD&category=science
```

## Performance Considerations

### Backend Caching

1. **Redis Caching**
   - User stats cached (15 min TTL)
   - Daily riddle counts cached (24h TTL)
   - Leaderboards cached (5 min TTL)

2. **Database Optimization**
   - Indexes on frequently queried fields
   - Pagination for large result sets
   - Connection pooling

3. **Mobile Optimization**
   - Zustand for efficient state updates
   - Only subscribe to needed state slices
   - Minimize re-renders with selective selectors

### AI Cost Optimization

1. **Backend Centralization**
   - All AI calls server-side
   - Easier to monitor costs
   - Can switch providers easily

2. **Riddle Reuse**
   - Store AI-generated riddles in database
   - Serve same riddle to multiple users
   - Reduces API calls

3. **Caching**
   - Cache AI responses where possible
   - Store hints with riddles

## Known Limitations

1. ✅ **Backend Integrated**: Fully functional backend API
2. ✅ **Authentication**: JWT-based auth implemented
3. ✅ **Persistence**: All data stored in PostgreSQL
4. ✅ **Daily Limits**: Enforced server-side via Redis
5. ✅ **Premium Features**: RevenueCat integration complete
6. ❌ **Ads**: Ad integration not implemented
7. ❌ **Offline Mode**: Requires internet connection

## Development Notes

### Adding New Features

To add a new gameplay feature:

1. **Backend First**:
   - Add endpoint to `backend/src/routes/`
   - Implement logic in `backend/src/services/`
   - Update controller in `backend/src/controllers/`

2. **Mobile Integration**:
   - Update `src/services/api.ts` with new method
   - Add action to `gameStore.ts` or relevant store
   - Update UI in screen components
   - Test API integration

3. **Documentation**:
   - Update this GAMEPLAY.md
   - Add API endpoint to documentation
   - Update user flow diagrams

### Debugging

**Backend Logs:**
```bash
# Start backend with logs
cd backend && npm run dev

# Watch logs
tail -f logs/app.log
```

**Mobile Logs:**
```bash
# React Native logs
npx expo start
# Press 'j' to open debugger

# View network requests
# React Native Debugger shows all API calls
```

**Common Debug Points:**
```typescript
console.log('API Request:', endpoint, params);
console.log('API Response:', response);
console.log('Store State:', gameStore.getState());
console.log('Auth Token:', await AsyncStorage.getItem('@bergvlei_token'));
```

### Common Issues

**Issue**: 401 Unauthorized errors
- Check JWT token in AsyncStorage
- Verify token not expired
- Ensure Bearer token in API headers

**Issue**: 403 Forbidden (daily limit)
- Check Redis cache for user's daily count
- Verify user's `riddlesPerDayLimit`
- Confirm backend daily reset logic

**Issue**: Riddles not loading
- Verify backend is running
- Check database has seeded riddles
- Review backend logs for errors

**Issue**: Custom riddle generation failing
- Check Gemini API key in backend `.env`
- Verify user isPremium
- Review AI service logs

**Issue**: Premium status not updating
- Check RevenueCat webhook setup
- Verify subscription sync endpoint
- Review subscription service logs

## Resources

- [Backend API Documentation](../backend/README.md)
- [API Client](src/services/api.ts)
- [Type Definitions](src/types/)
- [Game Constants](src/constants/game.ts)
- [State Stores](src/stores/)
- [RevenueCat Integration](src/services/purchases.ts)
