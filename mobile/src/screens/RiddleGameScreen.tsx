import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '@stores/gameStore';
import { FREE_DAILY_RIDDLE_LIMIT } from '@constants/game';

export default function RiddleGameScreen() {
  const {
    currentRiddle,
    currentHints,
    riddlesSolvedToday,
    hintsUsed,
    score,
    isLoading,
    error,
    currentDifficulty,
    fetchNewRiddle,
    submitAnswer,
    requestHint,
    resetCurrentGame,
    clearError,
  } = useGameStore();

  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'close' | null;
    message: string;
  }>({ type: null, message: '' });

  // Load initial riddle
  useEffect(() => {
    if (!currentRiddle) {
      loadNewRiddle();
    }
  }, []);

  // Handle errors from the store
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error]);

  const loadNewRiddle = async () => {
    setFeedback({ type: null, message: '' });
    setUserAnswer('');
    await fetchNewRiddle();
  };

  const handleGetHint = async () => {
    if (!currentRiddle) return;

    const hint = await requestHint();
    if (hint) {
      Alert.alert('Hint', hint, [{ text: 'Got it!' }]);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentRiddle || !userAnswer.trim()) {
      Alert.alert('Invalid Answer', 'Please enter an answer first.');
      return;
    }

    const result = await submitAnswer(userAnswer.trim());

    if (result.correct) {
      setFeedback({
        type: 'success',
        message: result.message,
      });

      // Auto-load next riddle after delay
      setTimeout(() => {
        loadNewRiddle();
      }, 2000);
    } else {
      setFeedback({
        type: 'error',
        message: result.message,
      });
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Riddle',
      'Are you sure you want to skip this riddle? You won\'t get any points.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => loadNewRiddle(),
        },
      ]
    );
  };

  if (!currentRiddle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading riddle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Today</Text>
              <Text style={styles.statValue}>{riddlesSolvedToday}/{FREE_DAILY_RIDDLE_LIMIT}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Difficulty</Text>
              <Text style={[styles.statValue, styles.difficultyBadge]}>
                {currentDifficulty}
              </Text>
            </View>
          </View>

          {/* Riddle Card */}
          <View style={styles.riddleCard}>
            <Text style={styles.riddleLabel}>Riddle</Text>
            <Text style={styles.riddleText}>{currentRiddle.question}</Text>

            {/* Hints Display */}
            {currentHints.length > 0 && (
              <View style={styles.hintsContainer}>
                <Text style={styles.hintsLabel}>Hints ({currentHints.length}):</Text>
                {currentHints.map((hint, index) => (
                  <Text key={index} style={styles.hintText}>
                    {index + 1}. {hint}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Feedback */}
          {feedback.type && (
            <View
              style={[
                styles.feedbackContainer,
                feedback.type === 'success' && styles.feedbackSuccess,
                feedback.type === 'error' && styles.feedbackError,
                feedback.type === 'close' && styles.feedbackClose,
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  feedback.type === 'success' && styles.feedbackTextSuccess,
                  feedback.type === 'error' && styles.feedbackTextError,
                  feedback.type === 'close' && styles.feedbackTextClose,
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          {/* Answer Input */}
          <View style={styles.answerSection}>
            <Text style={styles.answerLabel}>Your Answer</Text>
            <TextInput
              style={styles.input}
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder="Type your answer here..."
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading && feedback.type !== 'success'}
              onSubmitEditing={handleSubmitAnswer}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.hintButton]}
              onPress={handleGetHint}
              disabled={isLoading || feedback.type === 'success'}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  Get Hint ({currentHints.length})
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmitAnswer}
              disabled={isLoading || !userAnswer.trim() || feedback.type === 'success'}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isLoading || feedback.type === 'success'}
          >
            <Text style={styles.skipButtonText}>Skip Riddle</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c4a6e',
  },
  difficultyBadge: {
    fontSize: 12,
    color: '#0ea5e9',
  },
  riddleCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  riddleLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '600',
  },
  riddleText: {
    fontSize: 20,
    color: '#0c4a6e',
    lineHeight: 30,
    fontWeight: '500',
  },
  hintsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  hintsLabel: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '600',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#0c4a6e',
    marginBottom: 4,
    lineHeight: 20,
  },
  feedbackContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  feedbackSuccess: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  feedbackError: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  feedbackClose: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  feedbackTextSuccess: {
    color: '#065f46',
  },
  feedbackTextError: {
    color: '#991b1b',
  },
  feedbackTextClose: {
    color: '#92400e',
  },
  answerSection: {
    marginBottom: 20,
  },
  answerLabel: {
    fontSize: 16,
    color: '#0c4a6e',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#0c4a6e',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintButton: {
    backgroundColor: '#64748b',
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#64748b',
    fontSize: 14,
  },
});
