import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { useGameStore } from '../../src/stores/gameStore';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { stats, fetchStats } = useGameStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>👤</Text>
        </View>
        <Text style={styles.name}>{user?.username || user?.email || 'Player'}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        {user?.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>⭐ Premium</Text>
          </View>
        )}

        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalRiddlesSolved}</Text>
              <Text style={styles.statLabel}>Solved</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.accuracy ? `${Math.round(stats.accuracy * 100)}%` : '-'}</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalHintsUsed}</Text>
              <Text style={styles.statLabel}>Hints Used</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {!user?.isPremium && (
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>Upgrade to Premium</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Notifications</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Privacy</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
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
  },
  avatarContainer: {
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  avatar: {
    fontSize: 72,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#0c4a6e',
  },
  email: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  premiumBadge: {
    alignSelf: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  premiumText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  menuText: {
    fontSize: 16,
    color: '#0c4a6e',
  },
  logoutText: {
    color: '#dc2626',
  },
  menuArrow: {
    fontSize: 20,
    color: '#94a3b8',
  },
});
