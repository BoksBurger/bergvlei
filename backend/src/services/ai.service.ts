import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export interface AIHintRequest {
  riddle: string;
  answer: string;
  previousHints: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
}

export interface AIHintResponse {
  hint: string;
  confidence: number;
}

export interface AIRiddleGenerationRequest {
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  category?: string;
}

export interface AIRiddleGenerationResponse {
  question: string;
  answer: string;
  hints: string[];
  category: string;
}

export interface AIAnswerValidationRequest {
  userAnswer: string;
  correctAnswer: string;
}

export interface AIAnswerValidationResponse {
  isCorrect: boolean;
  similarity: number;
  feedback?: string;
}

class AIService {
  private genAI: GoogleGenerativeAI | null = null;

  private getClient(): GoogleGenerativeAI {
    if (!env.GEMINI_API_KEY) {
      throw new AppError(500, 'Gemini API key not configured');
    }

    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }

    return this.genAI;
  }

  /**
   * Generate a contextual hint for a riddle using AI
   */
  async generateHint(request: AIHintRequest): Promise<AIHintResponse> {
    const client = this.getClient();
    const model = client.getGenerativeModel({ model: 'gemini-pro' });

    const { riddle, answer, previousHints, difficulty } = request;

    // Build context-aware prompt
    let prompt = `You are helping a player solve a riddle. Generate a helpful hint that guides them toward the answer without giving it away directly.

Riddle: "${riddle}"
Answer: "${answer}"
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
      const confidence = this.calculateHintConfidence(hint, previousHints.length);

      return {
        hint,
        confidence,
      };
    } catch (error) {
      console.error('Error generating hint:', error);
      throw new AppError(500, 'Failed to generate hint with AI');
    }
  }

  /**
   * Generate a new riddle from scratch using AI
   */
  async generateRiddle(request: AIRiddleGenerationRequest): Promise<AIRiddleGenerationResponse> {
    const client = this.getClient();
    const model = client.getGenerativeModel({ model: 'gemini-pro' });

    const { difficulty, category } = request;

    const difficultyDescription = {
      EASY: 'simple and straightforward, suitable for beginners',
      MEDIUM: 'moderately challenging, requires some thinking',
      HARD: 'very challenging and cryptic, for experienced players',
      EXPERT: 'extremely difficult, requires deep lateral thinking',
    };

    let prompt = `Create a new riddle with ${difficulty} difficulty (${difficultyDescription[difficulty]}).`;

    if (category) {
      prompt += `\nCategory: ${category}`;
    }

    prompt += `\n\nProvide your response in the following format:
RIDDLE: [the riddle text]
ANSWER: [the answer]
HINT1: [first subtle hint]
HINT2: [second more revealing hint]
HINT3: [third most revealing hint but still not giving away the answer]
CATEGORY: [single word category like Nature, Logic, WordPlay, etc.]

Make the riddle creative, engaging, and fun to solve. Ensure hints progressively reveal more information.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Parse the response
      const riddleMatch = text.match(/RIDDLE:\s*(.+?)(?=\nANSWER:)/s);
      const answerMatch = text.match(/ANSWER:\s*(.+?)(?=\nHINT1:)/s);
      const hint1Match = text.match(/HINT1:\s*(.+?)(?=\nHINT2:)/s);
      const hint2Match = text.match(/HINT2:\s*(.+?)(?=\nHINT3:)/s);
      const hint3Match = text.match(/HINT3:\s*(.+?)(?=\nCATEGORY:|$)/s);
      const categoryMatch = text.match(/CATEGORY:\s*(.+?)$/s);

      if (!riddleMatch || !answerMatch || !hint1Match || !hint2Match || !hint3Match) {
        throw new AppError(500, 'Failed to parse AI riddle response');
      }

      return {
        question: riddleMatch[1].trim(),
        answer: answerMatch[1].trim(),
        hints: [
          hint1Match[1].trim(),
          hint2Match[1].trim(),
          hint3Match[1].trim(),
        ],
        category: categoryMatch ? categoryMatch[1].trim() : category || 'General',
      };
    } catch (error) {
      console.error('Error generating riddle:', error);
      throw new AppError(500, 'Failed to generate riddle with AI');
    }
  }

  /**
   * Validate if a user's answer matches the correct answer using AI
   * This handles variations in spelling, capitalization, and phrasing
   */
  async validateAnswer(request: AIAnswerValidationRequest): Promise<AIAnswerValidationResponse> {
    const { userAnswer, correctAnswer } = request;

    // Quick exact match check first (case-insensitive)
    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedCorrect = correctAnswer.toLowerCase().trim();

    if (normalizedUser === normalizedCorrect) {
      return { isCorrect: true, similarity: 1.0 };
    }

    // Use AI for fuzzy matching on close answers
    const client = this.getClient();
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
        return { isCorrect: true, similarity: 0.9, feedback: 'Great job!' };
      } else if (verdict.includes('CLOSE')) {
        return { isCorrect: false, similarity: 0.7, feedback: "You're very close! Try again." };
      } else {
        return { isCorrect: false, similarity: 0.3, feedback: 'Not quite right. Keep thinking!' };
      }
    } catch (error) {
      console.error('Error validating answer:', error);
      // Fall back to simple string comparison
      const similarity = this.calculateStringSimilarity(normalizedUser, normalizedCorrect);
      return { isCorrect: similarity > 0.8, similarity };
    }
  }

  /**
   * Generate a riddle variation using AI
   */
  async generateRiddleVariation(
    originalRiddle: string,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
  ): Promise<string> {
    const client = this.getClient();
    const model = client.getGenerativeModel({ model: 'gemini-pro' });

    const difficultyGuidance = {
      EASY: 'Make it simpler and more straightforward.',
      MEDIUM: 'Keep it moderately challenging.',
      HARD: 'Make it more cryptic and thought-provoking.',
      EXPERT: 'Make it extremely challenging with deep lateral thinking required.',
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
      return response.text().trim();
    } catch (error) {
      console.error('Error generating riddle variation:', error);
      throw new AppError(500, 'Failed to generate riddle variation');
    }
  }

  /**
   * Calculate confidence score for a hint based on quality heuristics
   */
  private calculateHintConfidence(hint: string, hintNumber: number): number {
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
   * Simple string similarity calculation (Levenshtein distance)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
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
}

export const aiService = new AIService();
