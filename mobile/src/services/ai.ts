import Constants from 'expo-constants';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_KEY;

export interface AIHintRequest {
  riddle: string;
  previousHints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AIHintResponse {
  hint: string;
  confidence: number;
}

/**
 * Generate a contextual hint for a riddle using AI
 */
export async function generateHint(request: AIHintRequest): Promise<AIHintResponse> {
  // TODO: Implement Gemini API call
  // This is a placeholder that will be implemented with actual AI integration

  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  // Placeholder response
  return {
    hint: 'This is a placeholder hint. AI integration coming soon!',
    confidence: 0.8,
  };
}

/**
 * Generate riddle variations using AI
 */
export async function generateRiddleVariation(
  originalRiddle: string,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<string> {
  // TODO: Implement Gemini API call

  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  return originalRiddle;
}

/**
 * Adjust riddle difficulty based on user performance
 */
export function calculateNextDifficulty(
  currentDifficulty: 'easy' | 'medium' | 'hard',
  recentPerformance: number[]
): 'easy' | 'medium' | 'hard' {
  const averageScore = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;

  if (averageScore > 0.8 && currentDifficulty !== 'hard') {
    return currentDifficulty === 'easy' ? 'medium' : 'hard';
  }

  if (averageScore < 0.4 && currentDifficulty !== 'easy') {
    return currentDifficulty === 'hard' ? 'medium' : 'easy';
  }

  return currentDifficulty;
}
