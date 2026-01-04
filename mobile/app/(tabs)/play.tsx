import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

export default function PlayScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ready to Play?</Text>
        <Text style={styles.subtitle}>Challenge your mind with AI-powered riddles</Text>

        <TouchableOpacity style={styles.playButton}>
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
    backgroundColor: '#fff',
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
    marginBottom: 40,
    textAlign: 'center',
  },
  playButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 30,
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
