import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@stores/gameStore';
import { FREE_DAILY_RIDDLE_LIMIT } from '@constants/game';

export default function PlayScreen() {
  const router = useRouter();
  const { riddlesSolvedToday, score, currentDifficulty, setDifficulty } = useGameStore();

  const handleStartGame = () => {
    router.push('/game');
  };

  const handleDifficultyChange = (difficulty: 'easy' | 'medium' | 'hard') => {
    setDifficulty(difficulty);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ready to Play?</Text>
        <Text style={styles.subtitle}>Challenge your mind with AI-powered riddles</Text>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Today's Score</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Riddles Solved</Text>
            <Text style={styles.statValue}>{riddlesSolvedToday}/{FREE_DAILY_RIDDLE_LIMIT}</Text>
          </View>
        </View>

        {/* Difficulty Selector */}
        <View style={styles.difficultyContainer}>
          <Text style={styles.difficultyLabel}>Select Difficulty</Text>
          <View style={styles.difficultyButtons}>
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                currentDifficulty === 'easy' && styles.difficultyButtonActive,
              ]}
              onPress={() => handleDifficultyChange('easy')}
            >
              <Text
                style={[
                  styles.difficultyButtonText,
                  currentDifficulty === 'easy' && styles.difficultyButtonTextActive,
                ]}
              >
                Easy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                currentDifficulty === 'medium' && styles.difficultyButtonActive,
              ]}
              onPress={() => handleDifficultyChange('medium')}
            >
              <Text
                style={[
                  styles.difficultyButtonText,
                  currentDifficulty === 'medium' && styles.difficultyButtonTextActive,
                ]}
              >
                Medium
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                currentDifficulty === 'hard' && styles.difficultyButtonActive,
              ]}
              onPress={() => handleDifficultyChange('hard')}
            >
              <Text
                style={[
                  styles.difficultyButtonText,
                  currentDifficulty === 'hard' && styles.difficultyButtonTextActive,
                ]}
              >
                Hard
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.playButton} onPress={handleStartGame}>
          <Text style={styles.playButtonText}>Start Playing</Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Free: 5 riddles/day</Text>
          <Text style={styles.infoText}>Premium: Unlimited riddles</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0c4a6e',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 30,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  difficultyContainer: {
    width: '100%',
    marginBottom: 30,
  },
  difficultyLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  difficultyButtonTextActive: {
    color: '#fff',
  },
  playButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
  },
});
