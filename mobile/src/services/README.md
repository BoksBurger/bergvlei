# AI Service Documentation

This directory contains the Gemini AI integration for Bergvlei's riddle game.

## Overview

The AI service (`ai.ts`) provides intelligent features powered by Google's Gemini AI:

- **Dynamic Hint Generation**: Context-aware hints that adapt to previous hints
- **Riddle Variations**: Generate different versions of riddles with adjustable difficulty
- **New Riddle Creation**: AI-generated riddles from scratch
- **Smart Answer Validation**: Fuzzy matching that handles spelling variations and synonyms
- **Adaptive Difficulty**: Calculate optimal difficulty based on user performance

## Setup

### 1. API Key Configuration

Ensure your Gemini API key is configured in `mobile/.env`:

```env
GEMINI_KEY=your_api_key_here
```

The API key is loaded via `app.config.js` and accessed through `expo-constants`.

### 2. Install Dependencies

The required package is already installed:

```bash
npm install @google/generative-ai
```

## Usage Examples

### Generate Hints

```typescript
import { generateHint } from '@services/ai';

const hint = await generateHint({
  riddle: "What has keys but no locks?",
  previousHints: [],
  difficulty: 'medium',
});

console.log(hint.hint); // AI-generated hint
console.log(hint.confidence); // 0.0 - 1.0
```

### Generate Riddle Variations

```typescript
import { generateRiddleVariation } from '@services/ai';

const variation = await generateRiddleVariation(
  "Original riddle text",
  'hard' // 'easy' | 'medium' | 'hard'
);

console.log(variation); // New riddle text
```

### Create New Riddles

```typescript
import { generateNewRiddle } from '@services/ai';

const riddle = await generateNewRiddle('medium', 'animals');

console.log(riddle.question); // Riddle text
console.log(riddle.answer); // Answer
```

### Validate Answers

```typescript
import { validateAnswer } from '@services/ai';

const result = await validateAnswer(
  "keybord", // User's answer (with typo)
  "keyboard"  // Correct answer
);

console.log(result.isCorrect); // true/false
console.log(result.similarity); // 0.0 - 1.0
```

### Calculate Difficulty

```typescript
import { calculateNextDifficulty } from '@services/ai';

const nextDifficulty = calculateNextDifficulty(
  'easy',
  [0.9, 0.85, 0.95] // Recent performance scores
);

console.log(nextDifficulty); // 'medium' (increased due to high performance)
```

## Testing

### Option 1: Use Test Utilities

```typescript
import { runAllAITests } from '@utils/testAI';

// Run all tests and see results in console
await runAllAITests();
```

### Option 2: Use Test UI Component

Add the test screen to your app during development:

```typescript
import AITestScreen from '@components/AITestScreen';

// In your navigation or app
<AITestScreen />
```

### Option 3: Manual Testing

Create a simple test in any component:

```typescript
import { generateHint } from '@services/ai';

const testAI = async () => {
  try {
    const result = await generateHint({
      riddle: "I'm tall when I'm young, and short when I'm old. What am I?",
      previousHints: [],
      difficulty: 'easy',
    });
    console.log('Success!', result);
  } catch (error) {
    console.error('Failed:', error);
  }
};
```

## API Reference

### `generateHint(request: AIHintRequest): Promise<AIHintResponse>`

Generates a contextual hint for a riddle.

**Parameters:**
- `request.riddle`: The riddle text
- `request.previousHints`: Array of previously given hints
- `request.difficulty`: 'easy' | 'medium' | 'hard'

**Returns:**
- `hint`: The generated hint text
- `confidence`: Quality score (0.0 - 1.0)

---

### `generateRiddleVariation(riddle: string, difficulty: string): Promise<string>`

Creates a variation of an existing riddle with adjusted difficulty.

**Parameters:**
- `riddle`: Original riddle text
- `difficulty`: 'easy' | 'medium' | 'hard'

**Returns:** New riddle text

---

### `generateNewRiddle(difficulty: string, category?: string): Promise<{question, answer}>`

Generates a completely new riddle.

**Parameters:**
- `difficulty`: 'easy' | 'medium' | 'hard'
- `category`: Optional category (e.g., 'animals', 'nature', 'science')

**Returns:**
- `question`: The riddle text
- `answer`: The answer

---

### `validateAnswer(userAnswer: string, correctAnswer: string): Promise<{isCorrect, similarity}>`

Validates a user's answer with fuzzy matching.

**Parameters:**
- `userAnswer`: User's submitted answer
- `correctAnswer`: The correct answer

**Returns:**
- `isCorrect`: boolean
- `similarity`: Match score (0.0 - 1.0)

---

### `calculateNextDifficulty(current: string, performance: number[]): string`

Determines the next difficulty level based on user performance.

**Parameters:**
- `current`: Current difficulty level
- `performance`: Array of recent performance scores (0.0 - 1.0)

**Returns:** Recommended next difficulty level

## Error Handling

All AI functions include error handling:

```typescript
try {
  const hint = await generateHint({...});
} catch (error) {
  // Handle error - could be:
  // - API key not configured
  // - Network error
  // - Rate limit exceeded
  // - Invalid response from API
  console.error('AI Error:', error.message);
}
```

## Cost Optimization

To minimize AI costs:

1. **Cache responses**: Store generated hints and riddles
2. **Batch requests**: Group multiple AI calls when possible
3. **Fallback logic**: Use simple string matching before AI validation
4. **Rate limiting**: Limit AI calls per user/session

Example caching strategy:

```typescript
// Store in app state or AsyncStorage
const hintCache = new Map<string, AIHintResponse>();

async function getCachedHint(request: AIHintRequest) {
  const cacheKey = `${request.riddle}-${request.previousHints.length}`;

  if (hintCache.has(cacheKey)) {
    return hintCache.get(cacheKey)!;
  }

  const hint = await generateHint(request);
  hintCache.set(cacheKey, hint);
  return hint;
}
```

## Troubleshooting

### "Gemini API key not configured"
- Check that `GEMINI_KEY` is set in `mobile/.env`
- Verify `app.config.js` includes the `extra.GEMINI_KEY` configuration
- Restart the Expo dev server after changing `.env`

### API Errors
- Check your API key is valid
- Verify you haven't exceeded rate limits
- Check your internet connection
- Review Google Cloud Console for API status

### Slow Responses
- Gemini typically responds in 1-3 seconds
- Network latency can add 500ms-2s
- Consider showing loading indicators
- Implement timeout handling (10s recommended)

## Future Enhancements

Planned improvements:

- [ ] Response caching with AsyncStorage
- [ ] Retry logic with exponential backoff
- [ ] Support for multiple AI providers (OpenAI, Claude)
- [ ] Streaming responses for faster UX
- [ ] Prompt optimization based on user feedback
- [ ] A/B testing different prompt strategies
