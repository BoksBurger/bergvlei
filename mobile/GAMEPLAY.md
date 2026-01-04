# Riddle Gameplay Implementation

This document describes the complete riddle gameplay system for Bergvlei.

## Overview

The gameplay system is a complete AI-powered riddle game with:
- Dynamic riddle generation using Gemini AI
- Smart hint system that progressively reveals information
- Answer validation with fuzzy matching
- Scoring system with difficulty-based points
- Daily riddle limits for freemium model
- Progress tracking and statistics

## File Structure

```
mobile/
├── app/
│   ├── game.tsx                    # Game route
│   └── (tabs)/
│       ├── index.tsx               # Home screen (updated)
│       └── play.tsx                # Play screen (updated)
├── src/
│   ├── screens/
│   │   └── RiddleGameScreen.tsx   # Main gameplay screen
│   └── stores/
│       └── gameStore.ts           # Game state management (updated)
```

## Screens

### 1. Home Screen (`app/(tabs)/index.tsx`)

**Features:**
- Displays user statistics (streak, solved today, total score)
- Quick Play button for immediate gameplay
- Shows remaining riddles for free users
- Premium upgrade prompt when daily limit reached

**Key Components:**
- Real-time stats from gameStore
- Conditional rendering based on daily limit
- Navigation to game screen

### 2. Play Screen (`app/(tabs)/play.tsx`)

**Features:**
- Difficulty selector (Easy, Medium, Hard)
- Current stats display (score, riddles solved)
- Start Playing button
- Freemium information

**Key Components:**
- Difficulty buttons with active state
- Stats cards
- Navigation to game screen with selected difficulty

### 3. Riddle Game Screen (`src/screens/RiddleGameScreen.tsx`)

**Main Gameplay Screen**

**Features:**
- Displays AI-generated riddles
- Text input for answers
- Hint system with AI-generated progressive hints
- Answer validation with feedback
- Score calculation
- Skip riddle option
- Auto-progression to next riddle

**Game Flow:**
1. Load new riddle from Gemini AI
2. Display riddle to user
3. User can request hints (with point penalty)
4. User submits answer
5. AI validates answer (exact match or fuzzy matching)
6. Show feedback (correct, close, incorrect)
7. Calculate and award points
8. Auto-load next riddle (if correct)

## State Management

### gameStore (Zustand)

**State:**
```typescript
{
  currentRiddle: Riddle | null;
  currentHints: string[];
  riddleAttempts: RiddleAttempt[];
  riddlesSolvedToday: number;
  hintsUsed: number;
  score: number;
  isLoading: boolean;
  currentDifficulty: 'easy' | 'medium' | 'hard';
}
```

**Actions:**
- `setCurrentRiddle`: Set the active riddle
- `addHint`: Add a hint to current hints
- `clearHints`: Reset hints for new riddle
- `addAttempt`: Record an answer attempt
- `incrementRiddlesSolved`: Increment daily counter
- `useHint`: Increment hint counter
- `addScore`: Add points to total score
- `setLoading`: Set loading state
- `setDifficulty`: Change difficulty level
- `resetDailyProgress`: Reset daily counters
- `resetCurrentGame`: Reset current game state

## Gameplay Mechanics

### 1. Riddle Generation

Uses `generateNewRiddle(difficulty)` from AI service:
```typescript
const riddle = await generateNewRiddle(currentDifficulty);
// Returns: { question: string, answer: string }
```

### 2. Hint System

Generates progressive hints using `generateHint()`:
```typescript
const hintResponse = await generateHint({
  riddle: currentRiddle.question,
  previousHints: currentHints,
  difficulty: currentDifficulty,
});
```

**Hint Behavior:**
- First hint is subtle and thought-provoking
- Subsequent hints become progressively more revealing
- Each hint costs points (HINT_PENALTY per hint)

### 3. Answer Validation

Uses `validateAnswer()` for smart matching:
```typescript
const validation = await validateAnswer(userAnswer, correctAnswer);
// Returns: { isCorrect: boolean, similarity: number }
```

**Validation Logic:**
- Exact match (case-insensitive): isCorrect = true
- AI fuzzy matching: Handles typos, synonyms, variations
- Fallback: Levenshtein distance calculation
- Similarity thresholds:
  - >0.8: Correct
  - 0.6-0.8: Close (show encouragement)
  - <0.6: Incorrect

### 4. Scoring System

**Base Points:**
- Easy: 10 points
- Medium: 25 points
- Hard: 50 points

**Penalties:**
- Each hint used: -5 points

**Calculation:**
```typescript
const basePoints = POINTS_PER_RIDDLE[difficulty];
const hintPenalty = hintsUsed * HINT_PENALTY;
const finalPoints = Math.max(0, basePoints - hintPenalty);
```

### 5. Freemium Limits

**Free Users:**
- 5 riddles per day
- Hints deduct points
- Ads after every 3 riddles (configured, not yet implemented)

**Premium Users (Future):**
- Unlimited riddles
- No ads
- Exclusive content

## User Flow

### Standard Gameplay Flow

```
1. Home Screen
   ├─> Quick Play → Game Screen
   └─> Play Tab → Select Difficulty → Game Screen

2. Game Screen
   ├─> Load Riddle (AI generates)
   ├─> Display Riddle
   ├─> User Actions:
   │   ├─> Request Hint (AI generates progressive hint)
   │   ├─> Submit Answer (AI validates)
   │   └─> Skip Riddle (confirm dialog)
   ├─> Feedback
   │   ├─> Correct: Award points → Auto-load next riddle (2s)
   │   ├─> Close: Encourage to try again
   │   └─> Incorrect: Prompt for hint or retry
   └─> Repeat

3. Daily Limit Reached
   └─> Show Premium Upgrade Prompt
```

## UI/UX Features

### Visual Feedback

**Success (Correct Answer):**
- Green feedback banner
- Shows points earned
- Auto-advances after 2 seconds

**Close (Almost Correct):**
- Yellow feedback banner
- Encouraging message: "You're close! Try again."

**Error (Incorrect):**
- Red feedback banner
- Suggests getting a hint

### Loading States

- Shows ActivityIndicator during:
  - Riddle generation
  - Hint generation
  - Answer validation
- Disables buttons during loading

### Keyboard Handling

- KeyboardAvoidingView for proper input visibility
- Submit on Enter/Return key
- Input auto-focuses on load

## Error Handling

### Network Errors
- Try-catch blocks on all AI operations
- User-friendly error alerts
- Graceful fallback to previous state

### API Failures
- Validates API key existence
- Retry logic (implicit in AI service)
- Error messages guide user actions

### Edge Cases
- Empty answer submission: Prompts user
- No current riddle: Shows loading state
- Daily limit: Shows upgrade prompt
- Validation errors: Falls back to string similarity

## Testing the Gameplay

### Manual Testing Steps

1. **Start Game**
   ```
   - Go to Home screen
   - Tap "Quick Play"
   - Verify riddle loads
   ```

2. **Request Hint**
   ```
   - Tap "Get Hint" button
   - Verify hint appears in UI
   - Check hint is contextual
   - Verify hint count increments
   ```

3. **Submit Answer**
   ```
   - Enter correct answer
   - Verify success feedback
   - Check score increases
   - Confirm auto-advance to next riddle
   ```

4. **Test Wrong Answer**
   ```
   - Enter incorrect answer
   - Verify error feedback
   - Check score doesn't change
   ```

5. **Test Close Answer**
   ```
   - Enter similar answer (typo)
   - Verify "close" feedback
   ```

6. **Skip Riddle**
   ```
   - Tap "Skip Riddle"
   - Confirm dialog appears
   - Verify new riddle loads
   ```

7. **Daily Limit**
   ```
   - Solve 5 riddles
   - Verify limit reached message
   - Check upgrade prompt appears
   ```

8. **Difficulty Levels**
   ```
   - Go to Play screen
   - Select different difficulties
   - Verify riddles match difficulty
   ```

### AI Integration Testing

Test each AI function:
```typescript
import { runAllAITests } from '@utils/testAI';
await runAllAITests();
```

Or use the visual test screen:
```typescript
import AITestScreen from '@components/AITestScreen';
// Add to navigation for testing
```

## Performance Considerations

### Optimization Strategies

1. **AI Response Caching**
   - Cache generated riddles
   - Store hints to avoid regeneration
   - Future: AsyncStorage for persistence

2. **Lazy Loading**
   - Only load one riddle at a time
   - Pre-generate next riddle in background (future)

3. **State Management**
   - Zustand provides efficient re-renders
   - Only subscribe to needed state slices

4. **Network Efficiency**
   - Batch AI requests where possible
   - Implement request debouncing
   - Handle offline gracefully

## Future Enhancements

### Planned Features

1. **Persistence**
   - Save progress to AsyncStorage
   - Restore game state on app restart
   - Sync with backend

2. **Multiplayer**
   - Challenge friends
   - Real-time competitions
   - Shared riddles

3. **Categories**
   - Topic-specific riddles
   - User preferences
   - Custom difficulty per category

4. **Achievements**
   - Badge system
   - Milestone rewards
   - Unlock special riddles

5. **Analytics**
   - Track user behavior
   - Optimize difficulty progression
   - A/B test hint strategies

6. **Premium Features**
   - Unlimited riddles
   - Exclusive content
   - Ad-free experience
   - Custom themes

## Known Limitations

1. **No Persistence**: Progress resets on app restart
2. **No Backend**: Everything is client-side
3. **No Authentication**: No user accounts
4. **No Ads**: Ad integration not implemented
5. **No Payments**: Premium upgrade is placeholder
6. **Daily Limit**: Not enforced across app restarts

## Development Notes

### Adding New Features

To add a new gameplay feature:

1. Update `gameStore.ts` with new state/actions
2. Modify `RiddleGameScreen.tsx` UI
3. Add new AI functions in `ai.ts` if needed
4. Update constants in `game.ts`
5. Test with `testAI.ts` utilities

### Debugging

Enable console logs for:
```typescript
console.log('Riddle loaded:', currentRiddle);
console.log('Hint generated:', hintResponse);
console.log('Answer validation:', validation);
console.log('Score calculated:', finalPoints);
```

### Common Issues

**Issue**: Riddle not loading
- Check API key configuration
- Verify network connection
- Check console for AI errors

**Issue**: Hints not showing
- Verify hint state in gameStore
- Check AI response format
- Review hint generation prompts

**Issue**: Score not updating
- Check scoring calculation
- Verify addScore action called
- Review state updates in store

## Resources

- [AI Service Documentation](src/services/README.md)
- [Type Definitions](src/types/)
- [Game Constants](src/constants/game.ts)
- [State Store](src/stores/gameStore.ts)
