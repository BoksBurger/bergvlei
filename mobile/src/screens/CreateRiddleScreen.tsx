import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useGameStore } from '@stores/gameStore';
import { useAuthStore } from '@stores/authStore';
import { RiddleResponse } from '@services/api';
import { PurchaseModal } from '@components/PurchaseModal';

const CATEGORIES = [
  { id: 'nature', name: 'Nature', icon: '🌿' },
  { id: 'animals', name: 'Animals', icon: '🦁' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'history', name: 'History', icon: '📜' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'food', name: 'Food & Drink', icon: '🍕' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
];

type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export default function CreateRiddleScreen() {
  const [mode, setMode] = useState<'category' | 'custom'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customAnswer, setCustomAnswer] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [generatedRiddle, setGeneratedRiddle] = useState<RiddleResponse | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const { user } = useAuthStore();
  const { generateCustomRiddle, playCustomRiddle, saveCustomRiddle, isLoading, error, clearError } = useGameStore();
  const router = useRouter();

  // Check if user is premium
  const isPremium = user?.isPremium || false;

  const handleGenerate = async () => {
    clearError();

    // Validation
    const input = mode === 'category' ? selectedCategory : customAnswer.trim();
    if (!input) {
      Alert.alert('Input Required', mode === 'category' ? 'Please select a category' : 'Please enter an answer');
      return;
    }

    // Generate the riddle
    const riddle = await generateCustomRiddle(difficulty, input, mode === 'custom');
    if (riddle) {
      setGeneratedRiddle(riddle);
    } else if (error) {
      Alert.alert('Generation Failed', error);
    }
  };

  const handlePlayNow = () => {
    if (generatedRiddle) {
      playCustomRiddle(generatedRiddle);
      router.push('/game');
    }
  };

  const handleSaveForLater = async () => {
    if (generatedRiddle) {
      const success = await saveCustomRiddle(generatedRiddle.id);
      if (success) {
        Alert.alert('Success', 'Riddle saved to your collection!');
        // Reset the form
        setGeneratedRiddle(null);
        setCustomAnswer('');
        setSelectedCategory(null);
      } else if (error) {
        Alert.alert('Save Failed', error);
      }
    }
  };

  const handleReset = () => {
    setGeneratedRiddle(null);
    setCustomAnswer('');
    setSelectedCategory(null);
    clearError();
  };

  // Show premium gate if user is not premium
  if (!isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.premiumGateContainer}>
          <Text style={styles.premiumGateIcon}>✨</Text>
          <Text style={styles.premiumGateTitle}>Premium Feature</Text>
          <Text style={styles.premiumGateText}>
            Create custom AI-powered riddles with your own categories or answers
          </Text>
          <Text style={styles.premiumGateFeatures}>
            • Choose from 8 categories{'\n'}
            • Generate riddles from custom answers{'\n'}
            • Save riddles for later{'\n'}
            • Unlimited difficulty levels
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => setShowPurchaseModal(true)}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>

        <PurchaseModal
          visible={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Create Your Own Riddle</Text>
        <Text style={styles.subtitle}>Generate personalized riddles with AI</Text>

        {/* Mode Toggle */}
        {!generatedRiddle && (
          <>
            <View style={styles.modeContainer}>
              <Text style={styles.sectionLabel}>Select Mode</Text>
              <View style={styles.modeButtons}>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'category' && styles.modeButtonActive]}
                  onPress={() => {
                    setMode('category');
                    setCustomAnswer('');
                  }}
                >
                  <Text style={[styles.modeButtonText, mode === 'category' && styles.modeButtonTextActive]}>
                    Category
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'custom' && styles.modeButtonActive]}
                  onPress={() => {
                    setMode('custom');
                    setSelectedCategory(null);
                  }}
                >
                  <Text style={[styles.modeButtonText, mode === 'custom' && styles.modeButtonTextActive]}>
                    Custom Answer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Selection */}
            {mode === 'category' && (
              <View style={styles.categoryContainer}>
                <Text style={styles.sectionLabel}>Pick a Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryCard,
                        selectedCategory === cat.id && styles.categoryCardActive,
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text style={[
                        styles.categoryName,
                        selectedCategory === cat.id && styles.categoryNameActive,
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Custom Answer Input */}
            {mode === 'custom' && (
              <View style={styles.customAnswerContainer}>
                <Text style={styles.sectionLabel}>Your Answer</Text>
                <TextInput
                  style={styles.customAnswerInput}
                  placeholder="Enter your answer (e.g., bicycle, pyramid, ocean)"
                  placeholderTextColor="#94a3b8"
                  value={customAnswer}
                  onChangeText={setCustomAnswer}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.customAnswerHint}>
                  The AI will create a riddle where this is the answer
                </Text>
              </View>
            )}

            {/* Difficulty Selector */}
            <View style={styles.difficultyContainer}>
              <Text style={styles.sectionLabel}>Difficulty Level</Text>
              <View style={styles.difficultyButtons}>
                {['EASY', 'MEDIUM', 'HARD', 'EXPERT'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyButton,
                      difficulty === level && styles.difficultyButtonActive,
                    ]}
                    onPress={() => setDifficulty(level as DifficultyLevel)}
                  >
                    <Text
                      style={[
                        styles.difficultyButtonText,
                        difficulty === level && styles.difficultyButtonTextActive,
                      ]}
                    >
                      {level.charAt(0) + level.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
              onPress={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateButtonText}>✨ Generate Riddle</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Riddle Preview */}
        {generatedRiddle && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Generated Riddle</Text>
            <View style={styles.riddleCard}>
              <View style={styles.riddleBadge}>
                <Text style={styles.riddleBadgeText}>{generatedRiddle.difficulty}</Text>
              </View>
              <Text style={styles.riddleQuestion}>{generatedRiddle.question}</Text>
              {generatedRiddle.category && (
                <Text style={styles.riddleCategory}>Category: {generatedRiddle.category}</Text>
              )}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.playNowButton]}
                onPress={handlePlayNow}
              >
                <Text style={styles.actionButtonText}>▶ Play Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveForLater}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#0ea5e9" />
                ) : (
                  <Text style={[styles.actionButtonText, styles.saveButtonText]}>💾 Save for Later</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Create Another Riddle</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0c4a6e',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 30,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  modeContainer: {
    marginBottom: 24,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  categoryCardActive: {
    borderColor: '#0ea5e9',
    backgroundColor: '#eff6ff',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryNameActive: {
    color: '#0ea5e9',
  },
  customAnswerContainer: {
    marginBottom: 24,
  },
  customAnswerInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  customAnswerHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    fontStyle: 'italic',
  },
  difficultyContainer: {
    marginBottom: 24,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  difficultyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  difficultyButtonTextActive: {
    color: '#fff',
  },
  generateButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    marginTop: 20,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
    textAlign: 'center',
  },
  riddleCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  riddleBadge: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  riddleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  riddleQuestion: {
    fontSize: 18,
    color: '#0f172a',
    lineHeight: 26,
    marginBottom: 8,
  },
  riddleCategory: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  playNowButton: {
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButtonText: {
    color: '#0ea5e9',
  },
  resetButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#64748b',
    textDecorationLine: 'underline',
  },
  premiumGateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  premiumGateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  premiumGateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 12,
    textAlign: 'center',
  },
  premiumGateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  premiumGateFeatures: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'left',
    marginBottom: 32,
    lineHeight: 22,
  },
  upgradeButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
