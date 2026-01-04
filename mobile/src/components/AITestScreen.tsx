import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { runAllAITests } from '../utils/testAI';

/**
 * AI Test Screen Component
 *
 * This component provides a UI to test the AI integration.
 * Import and use this in your app during development to verify AI functionality.
 *
 * Example:
 * import AITestScreen from '@components/AITestScreen';
 * <AITestScreen />
 */
export default function AITestScreen() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string>('');

  const handleRunTests = async () => {
    setTesting(true);
    setResults('Running tests...\n\n');

    // Capture console logs
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      const message = args.join(' ');
      logs.push(message);
      originalLog(...args);
    };

    console.error = (...args: any[]) => {
      const message = 'ERROR: ' + args.join(' ');
      logs.push(message);
      originalError(...args);
    };

    try {
      await runAllAITests();
    } catch (error) {
      logs.push(`\nFatal error: ${error}`);
    }

    // Restore console
    console.log = originalLog;
    console.error = originalError;

    setResults(logs.join('\n'));
    setTesting(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Service Test</Text>
        <Text style={styles.subtitle}>Test Gemini AI Integration</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={handleRunTests}
        disabled={testing}
      >
        {testing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Run All Tests</Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.resultsContainer}>
        {results ? (
          <Text style={styles.resultsText}>{results}</Text>
        ) : (
          <Text style={styles.placeholderText}>
            Press "Run All Tests" to start testing the AI integration.{'\n\n'}
            This will test:{'\n'}
            • Hint generation{'\n'}
            • Riddle variations{'\n'}
            • New riddle creation{'\n'}
            • Answer validation{'\n'}
            • Difficulty calculation
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  button: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  resultsText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#0f172a',
  },
  placeholderText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
});
