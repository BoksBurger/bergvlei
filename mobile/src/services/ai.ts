/**
 * ⚠️ DEPRECATED: This file is deprecated and should not be used.
 *
 * All AI functionality has been moved to the backend for security and centralized control.
 *
 * Instead of using functions from this file, use the API client methods:
 * - api.getAIHint(riddleId) - Generate AI-powered hints
 * - api.validateAnswerWithAI(riddleId, answer) - Validate answers with fuzzy matching
 * - api.generateAIRiddle(difficulty, category) - Generate new riddles
 *
 * Migration: Replace direct AI calls with API calls in your components/stores.
 *
 * This file will be removed in a future version.
 */

import Constants from 'expo-constants';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_KEY;

let genAI: GoogleGenerativeAI | null = null;

// Initialize Gemini AI
function getGeminiClient(): GoogleGenerativeAI {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please set GEMINI_KEY in your .env file');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  return genAI;
}

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
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-pro' });

  const { riddle, previousHints, difficulty } = request;

  // Build context-aware prompt
  let prompt = `You are helping a player solve a riddle. Generate a helpful hint that guides them toward the answer without giving it away directly.

Riddle: "${riddle}"
Difficulty: ${difficulty}
`;

  if (previousHints.length > 0) {
    prompt += `\nPrevious hints already given:\n${previousHints.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n`;
    prompt += '\nProvide the next hint that is slightly more revealing than the previous ones, but still requires thinking.';
  } else {
    prompt += '\nThis is the first hint. Make it subtle and thought-provoking.';
  }

  prompt += '\n\nProvide ONLY the hint text, nothing else. Keep it concise (1-2 sentences).';

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const hint = response.text().trim();

    // Calculate confidence based on hint quality (simple heuristic)
    const confidence = calculateHintConfidence(hint, previousHints.length);

    return {
      hint,
      confidence,
    };
  } catch (error) {
    console.error('Error generating hint:', error);
    throw new Error('Failed to generate hint. Please try again.');
  }
}

/**
 * Generate riddle variations using AI
 */
export async function generateRiddleVariation(
  originalRiddle: string,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-pro' });

  const difficultyGuidance = {
    easy: 'Make it simpler and more straightforward.',
    medium: 'Keep it moderately challenging.',
    hard: 'Make it more cryptic and thought-provoking.',
  };

  const prompt = `Create a variation of this riddle with ${difficulty} difficulty:

Original riddle: "${originalRiddle}"

Requirements:
- ${difficultyGuidance[difficulty]}
- Keep the same answer/concept but rephrase the clues
- Maintain the riddle format
- Make it engaging and fun

Provide ONLY the new riddle text, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const variation = response.text().trim();

    return variation;
  } catch (error) {
    console.error('Error generating riddle variation:', error);
    throw new Error('Failed to generate riddle variation. Please try again.');
  }
}

/**
 * Calculate confidence score for a hint based on quality heuristics
 */
function calculateHintConfidence(hint: string, hintNumber: number): number {
  let confidence = 0.7; // Base confidence

  // Adjust based on hint length (sweet spot is 20-100 characters)
  if (hint.length >= 20 && hint.length <= 100) {
    confidence += 0.15;
  } else if (hint.length < 10 || hint.length > 200) {
    confidence -= 0.1;
  }

  // Adjust based on hint progression (later hints should be more confident)
  confidence += Math.min(hintNumber * 0.05, 0.15);

  // Ensure confidence is between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Adjust riddle difficulty based on user performance
 */
export function calculateNextDifficulty(
  currentDifficulty: 'easy' | 'medium' | 'hard',
  recentPerformance: number[]
): 'easy' | 'medium' | 'hard' {
  if (recentPerformance.length === 0) {
    return currentDifficulty;
  }

  const averageScore = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;

  if (averageScore > 0.8 && currentDifficulty !== 'hard') {
    return currentDifficulty === 'easy' ? 'medium' : 'hard';
  }

  if (averageScore < 0.4 && currentDifficulty !== 'easy') {
    return currentDifficulty === 'hard' ? 'medium' : 'easy';
  }

  return currentDifficulty;
}

/**
 * Generate a new riddle from scratch using AI
 */
export async function generateNewRiddle(
  difficulty: 'easy' | 'medium' | 'hard',
  category?: string
): Promise<{ question: string; answer: string }> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-pro' });

  const difficultyDescription = {
    easy: 'simple and straightforward, suitable for beginners',
    medium: 'moderately challenging, requires some thinking',
    hard: 'very challenging and cryptic, for experienced players',
  };

  let prompt = `Create a new riddle with ${difficulty} difficulty (${difficultyDescription[difficulty]}).`;

  if (category) {
    prompt += `\nCategory: ${category}`;
  }

  prompt += `\n\nProvide your response in the following format:
RIDDLE: [the riddle text]
ANSWER: [the answer]

Make the riddle creative, engaging, and fun to solve.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Parse the response
    const riddleMatch = text.match(/RIDDLE:\s*(.+?)(?=\nANSWER:|$)/s);
    const answerMatch = text.match(/ANSWER:\s*(.+?)$/s);

    if (!riddleMatch || !answerMatch) {
      throw new Error('Failed to parse riddle response');
    }

    return {
      question: riddleMatch[1].trim(),
      answer: answerMatch[1].trim(),
    };
  } catch (error) {
    console.error('Error generating new riddle:', error);
    throw new Error('Failed to generate new riddle. Please try again.');
  }
}

/**
 * Validate if a user's answer matches the correct answer using AI
 * This handles variations in spelling, capitalization, and phrasing
 */
export async function validateAnswer(
  userAnswer: string,
  correctAnswer: string
): Promise<{ isCorrect: boolean; similarity: number }> {
  // Quick exact match check first (case-insensitive)
  const normalizedUser = userAnswer.toLowerCase().trim();
  const normalizedCorrect = correctAnswer.toLowerCase().trim();

  if (normalizedUser === normalizedCorrect) {
    return { isCorrect: true, similarity: 1.0 };
  }

  // Use AI for fuzzy matching on close answers
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `You are validating a riddle answer. Determine if the user's answer is correct or close enough.

Correct answer: "${correctAnswer}"
User's answer: "${userAnswer}"

Consider:
- Spelling variations
- Synonyms or equivalent phrases
- Minor differences in wording

Respond with ONLY one of these options:
- CORRECT (if the answer is right or very close)
- CLOSE (if the answer shows understanding but isn't quite right)
- WRONG (if the answer is incorrect)`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const verdict = response.text().trim().toUpperCase();

    if (verdict.includes('CORRECT')) {
      return { isCorrect: true, similarity: 0.9 };
    } else if (verdict.includes('CLOSE')) {
      return { isCorrect: false, similarity: 0.7 };
    } else {
      return { isCorrect: false, similarity: 0.3 };
    }
  } catch (error) {
    console.error('Error validating answer:', error);
    // Fall back to simple string comparison
    const similarity = calculateStringSimilarity(normalizedUser, normalizedCorrect);
    return { isCorrect: similarity > 0.8, similarity };
  }
}

/**
 * Simple string similarity calculation (Levenshtein distance)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : 1 - distance / maxLen;
}
