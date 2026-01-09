# Migration Guide: Client-Side AI → Server-Side AI

This guide helps you migrate from using direct AI calls in the mobile app to using backend API endpoints.

## Why This Change?

**Security**: API keys should never be exposed in client applications
**Cost Control**: Centralized AI usage monitoring and rate limiting
**Consistency**: Single source of truth for AI-generated content
**Flexibility**: Easy to switch AI providers or add caching without client updates

## Quick Reference

### Before (❌ Deprecated)

```typescript
import { generateHint, validateAnswer, generateNewRiddle } from '@services/ai';

// Direct AI calls (DEPRECATED)
const hint = await generateHint({ riddle, previousHints, difficulty });
const validation = await validateAnswer(userAnswer, correctAnswer);
const newRiddle = await generateNewRiddle(difficulty, category);
```

### After (✅ Current)

```typescript
import { api } from '@services/api';

// Backend API calls (SECURE)
const hint = await api.getAIHint(riddleId);
const validation = await api.validateAnswerWithAI(riddleId, userAnswer);
const newRiddle = await api.generateAIRiddle(difficulty, category);
```

## Step-by-Step Migration

### 1. Replace Hint Generation

**Before:**
```typescript
import { generateHint } from '@services/ai';

const getHint = async () => {
  const hintResponse = await generateHint({
    riddle: currentRiddle.question,
    previousHints: hints,
    difficulty: 'medium',
  });
  setHint(hintResponse.hint);
};
```

**After:**
```typescript
import { api } from '@services/api';

const getHint = async () => {
  const response = await api.getAIHint(currentRiddle.id);
  if (response.success && response.data) {
    setHint(response.data.hint);
    // response.data also includes: confidence, isAIGenerated
  } else {
    console.error('Failed to get hint:', response.error);
  }
};
```

### 2. Replace Answer Validation

**Before:**
```typescript
import { validateAnswer } from '@services/ai';

const checkAnswer = async (userAnswer: string) => {
  const validation = await validateAnswer(userAnswer, riddle.answer);
  if (validation.isCorrect) {
    showSuccess();
  } else if (validation.similarity > 0.7) {
    showCloseMessage();
  }
};
```

**After:**
```typescript
import { api } from '@services/api';

const checkAnswer = async (userAnswer: string) => {
  const response = await api.validateAnswerWithAI(riddle.id, userAnswer);
  if (response.success && response.data) {
    const { isCorrect, similarity, feedback } = response.data;
    if (isCorrect) {
      showSuccess(feedback);
    } else if (similarity > 0.7) {
      showCloseMessage(feedback);
    }
  } else {
    console.error('Failed to validate:', response.error);
  }
};
```

### 3. Replace Riddle Generation

**Before:**
```typescript
import { generateNewRiddle } from '@services/ai';

const createNewRiddle = async () => {
  const riddle = await generateNewRiddle('hard', 'Nature');
  setCurrentRiddle({
    question: riddle.question,
    answer: riddle.answer,
  });
};
```

**After:**
```typescript
import { api } from '@services/api';

const createNewRiddle = async () => {
  const response = await api.generateAIRiddle('HARD', 'Nature');
  if (response.success && response.data) {
    setCurrentRiddle(response.data);
    // response.data includes: id, question, difficulty, category, hintsAvailable
  } else {
    console.error('Failed to generate riddle:', response.error);
  }
};
```

## New API Methods Reference

### `api.getAIHint(riddleId: string)`

Generate an AI-powered hint for a riddle.

**Parameters:**
- `riddleId` - The riddle ID

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    hint: string;           // The generated hint
    confidence: number;     // AI confidence score (0-1)
    isAIGenerated: boolean; // Always true
  };
  error?: { message: string };
}
```

**Example:**
```typescript
const response = await api.getAIHint('riddle-123');
if (response.success) {
  console.log('Hint:', response.data.hint);
  console.log('Confidence:', response.data.confidence);
}
```

**Notes:**
- Requires premium subscription
- Returns 403 error for free users
- Contextually aware of previous hints

---

### `api.validateAnswerWithAI(riddleId: string, answer: string)`

Validate an answer with AI fuzzy matching (handles typos, synonyms).

**Parameters:**
- `riddleId` - The riddle ID
- `answer` - User's answer to validate

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    isCorrect: boolean;    // True if answer is correct/very close
    similarity: number;    // Similarity score (0-1)
    feedback?: string;     // Feedback message
  };
  error?: { message: string };
}
```

**Example:**
```typescript
const response = await api.validateAnswerWithAI('riddle-123', 'ekko');
if (response.success) {
  if (response.data.isCorrect) {
    console.log('Correct!', response.data.feedback);
  } else if (response.data.similarity > 0.7) {
    console.log('Close!', response.data.feedback);
  }
}
```

**Notes:**
- Handles spelling variations (e.g., "echo" vs "ekko")
- Recognizes synonyms (e.g., "mirror" vs "looking glass")
- More forgiving than exact string matching

---

### `api.generateAIRiddle(difficulty?, category?)`

Generate a new riddle using AI.

**Parameters:**
- `difficulty` - Optional: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
- `category` - Optional: Category name (e.g., 'Nature', 'Logic')

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    id: string;
    question: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
    category: string | null;
    hintsAvailable: number;
    isAIGenerated?: boolean;
  };
  error?: { message: string };
}
```

**Example:**
```typescript
const response = await api.generateAIRiddle('MEDIUM', 'Logic');
if (response.success) {
  console.log('New riddle:', response.data.question);
  console.log('Hints available:', response.data.hintsAvailable);
}
```

**Notes:**
- Respects daily riddle limits (free vs premium)
- Riddle is saved to database for tracking
- Includes 3 progressive hints

## Error Handling

All API methods return a consistent response structure. Always check `success` before accessing `data`.

```typescript
const response = await api.getAIHint(riddleId);

if (response.success && response.data) {
  // Success case
  const { hint, confidence } = response.data;
  displayHint(hint);
} else if (response.error) {
  // Error case
  const { message } = response.error;
  if (message.includes('premium')) {
    showUpgradePrompt();
  } else {
    showError(message);
  }
}
```

## Common Errors

### 401 Unauthorized
- **Cause**: User not logged in or token expired
- **Solution**: Redirect to login, refresh token

### 403 Forbidden
- **Cause**: Premium feature accessed by free user
- **Solution**: Show upgrade prompt

### 429 Too Many Requests
- **Cause**: Rate limit exceeded
- **Solution**: Show cooldown message, retry later

### 500 Internal Server Error
- **Cause**: Backend or AI service issue
- **Solution**: Show generic error, retry, contact support

## Testing Your Migration

### 1. Check Environment Variables

```bash
# Mobile .env - should NOT have GEMINI_KEY
cat mobile/.env
# Should only show: API_URL, REVENUECAT keys

# Backend .env - should have GEMINI_API_KEY
cat backend/.env
# Should include: GEMINI_API_KEY, DATABASE_URL, etc.
```

### 2. Test Each Feature

```typescript
// Test hint generation
const hintResponse = await api.getAIHint(testRiddleId);
console.assert(hintResponse.success, 'Hint generation failed');

// Test answer validation
const validationResponse = await api.validateAnswerWithAI(testRiddleId, 'test answer');
console.assert(validationResponse.success, 'Validation failed');

// Test riddle generation
const riddleResponse = await api.generateAIRiddle('EASY');
console.assert(riddleResponse.success, 'Riddle generation failed');
```

### 3. Verify Backend is Running

```bash
# Start backend
cd backend
npm run dev

# In another terminal, test endpoints
curl http://localhost:3000/api/health
```

## Troubleshooting

### "GEMINI_KEY not configured" error
- **Old code**: Still importing from `@services/ai`
- **Solution**: Replace with `api.getAIHint()` / `api.generateAIRiddle()`

### Network errors
- **Cause**: Backend not running or wrong API_URL
- **Solution**: Check `mobile/.env` has correct `API_URL` (e.g., http://localhost:3000/api)

### 401 Unauthorized
- **Cause**: Not logged in or token expired
- **Solution**: Ensure user is authenticated before AI calls

### Type errors
- **Cause**: Old AI service types still imported
- **Solution**: Use types from `@services/api` (ApiResponse, RiddleResponse)

## Cleanup (Future)

After migration is complete and tested:

1. **Remove deprecated AI service:**
   ```bash
   rm mobile/src/services/ai.ts
   ```

2. **Remove @google/generative-ai from mobile:**
   ```bash
   cd mobile
   npm uninstall @google/generative-ai
   ```

3. **Update imports:**
   - Search for `from '@services/ai'`
   - Replace with `from '@services/api'`

## Need Help?

- Check `SECURITY.md` for security architecture details
- See `backend/API.md` for full API documentation
- Review example code in this guide
- Contact team for migration support

## Summary

✅ All AI features now use backend APIs
✅ Mobile app has no sensitive API keys
✅ Backend controls AI usage and costs
✅ Consistent error handling across features
✅ Easy to add caching, rate limiting, and monitoring

**Next Steps**: Update your components/stores to use the new API methods!
