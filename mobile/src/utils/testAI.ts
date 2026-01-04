/**
 * Test utilities for AI service
 *
 * This file provides functions to test the Gemini AI integration
 * Run these from your app to verify AI functionality
 */

import {
  generateHint,
  generateRiddleVariation,
  generateNewRiddle,
  validateAnswer,
  calculateNextDifficulty,
} from '../services/ai';

/**
 * Test hint generation
 */
export async function testHintGeneration() {
  console.log('=== Testing Hint Generation ===');

  const testRiddle = "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?";

  try {
    // First hint
    console.log('\nGenerating first hint...');
    const hint1 = await generateHint({
      riddle: testRiddle,
      previousHints: [],
      difficulty: 'medium',
    });
    console.log('Hint 1:', hint1.hint);
    console.log('Confidence:', hint1.confidence);

    // Second hint
    console.log('\nGenerating second hint...');
    const hint2 = await generateHint({
      riddle: testRiddle,
      previousHints: [hint1.hint],
      difficulty: 'medium',
    });
    console.log('Hint 2:', hint2.hint);
    console.log('Confidence:', hint2.confidence);

    console.log('\n✅ Hint generation test passed!');
    return true;
  } catch (error) {
    console.error('❌ Hint generation test failed:', error);
    return false;
  }
}

/**
 * Test riddle variation generation
 */
export async function testRiddleVariation() {
  console.log('\n=== Testing Riddle Variation ===');

  const originalRiddle = "What has keys but no locks, space but no room, and you can enter but can't go inside?";

  try {
    console.log('Original riddle:', originalRiddle);

    const easyVariation = await generateRiddleVariation(originalRiddle, 'easy');
    console.log('\nEasy variation:', easyVariation);

    const hardVariation = await generateRiddleVariation(originalRiddle, 'hard');
    console.log('\nHard variation:', hardVariation);

    console.log('\n✅ Riddle variation test passed!');
    return true;
  } catch (error) {
    console.error('❌ Riddle variation test failed:', error);
    return false;
  }
}

/**
 * Test new riddle generation
 */
export async function testNewRiddleGeneration() {
  console.log('\n=== Testing New Riddle Generation ===');

  try {
    const riddle = await generateNewRiddle('medium', 'nature');
    console.log('\nGenerated riddle:', riddle.question);
    console.log('Answer:', riddle.answer);

    console.log('\n✅ New riddle generation test passed!');
    return true;
  } catch (error) {
    console.error('❌ New riddle generation test failed:', error);
    return false;
  }
}

/**
 * Test answer validation
 */
export async function testAnswerValidation() {
  console.log('\n=== Testing Answer Validation ===');

  const correctAnswer = "keyboard";

  try {
    // Exact match
    const exact = await validateAnswer("keyboard", correctAnswer);
    console.log('\nExact match (keyboard):', exact);

    // Case variation
    const caseVar = await validateAnswer("KEYBOARD", correctAnswer);
    console.log('Case variation (KEYBOARD):', caseVar);

    // Spelling variation
    const spelling = await validateAnswer("keybord", correctAnswer);
    console.log('Spelling variation (keybord):', spelling);

    // Wrong answer
    const wrong = await validateAnswer("mouse", correctAnswer);
    console.log('Wrong answer (mouse):', wrong);

    console.log('\n✅ Answer validation test passed!');
    return true;
  } catch (error) {
    console.error('❌ Answer validation test failed:', error);
    return false;
  }
}

/**
 * Test difficulty calculation
 */
export function testDifficultyCalculation() {
  console.log('\n=== Testing Difficulty Calculation ===');

  try {
    // High performance - should increase difficulty
    const highPerf = calculateNextDifficulty('easy', [0.9, 0.85, 0.95, 0.8]);
    console.log('High performance (easy → medium):', highPerf);

    // Low performance - should decrease difficulty
    const lowPerf = calculateNextDifficulty('hard', [0.3, 0.2, 0.4, 0.35]);
    console.log('Low performance (hard → medium):', lowPerf);

    // Medium performance - should stay same
    const medPerf = calculateNextDifficulty('medium', [0.6, 0.5, 0.7, 0.55]);
    console.log('Medium performance (medium → medium):', medPerf);

    console.log('\n✅ Difficulty calculation test passed!');
    return true;
  } catch (error) {
    console.error('❌ Difficulty calculation test failed:', error);
    return false;
  }
}

/**
 * Run all AI tests
 */
export async function runAllAITests() {
  console.log('🚀 Starting AI Service Tests...\n');

  const results = {
    difficulty: testDifficultyCalculation(),
    hint: await testHintGeneration(),
    variation: await testRiddleVariation(),
    newRiddle: await testNewRiddleGeneration(),
    validation: await testAnswerValidation(),
  };

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Test Results: ${passed}/${total} passed`);
  console.log('='.repeat(50));

  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check logs above.');
  }

  return results;
}
