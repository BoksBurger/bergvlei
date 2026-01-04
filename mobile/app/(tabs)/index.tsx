import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@stores/gameStore';
import { FREE_DAILY_RIDDLE_LIMIT } from '@constants/game';

export default function HomeScreen() {
  const router = useRouter();
  const { riddlesSolvedToday, score } = useGameStore();

  const handleQuickPlay = () => {
    router.push('/game');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Bergvlei</Text>
        <Text style={styles.subtitle}>AI-Powered Riddle Game</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{riddlesSolvedToday}</Text>
            <Text style={styles.statLabel}>Solved Today</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{score}</Text>
            <Text style={styles.statLabel}>Total Score</Text>
          </View>
        </View>

        {riddlesSolvedToday < FREE_DAILY_RIDDLE_LIMIT ? (
          <TouchableOpacity style={styles.quickPlayButton} onPress={handleQuickPlay}>
            <Text style={styles.quickPlayText}>Quick Play</Text>
            <Text style={styles.quickPlaySubtext}>
              {FREE_DAILY_RIDDLE_LIMIT - riddlesSolvedToday} riddles remaining today
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.limitReachedContainer}>
            <Text style={styles.limitReachedText}>Daily Limit Reached!</Text>
            <Text style={styles.limitReachedSubtext}>
              Upgrade to Premium for unlimited riddles
            </Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        )}
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0c4a6e',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  statBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  quickPlayButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickPlayText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quickPlaySubtext: {
    color: '#e0f2fe',
    fontSize: 14,
  },
  limitReachedContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  limitReachedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  limitReachedSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: '#d946ef',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
