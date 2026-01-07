import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { purchasesService } from '../services/purchases';
import { api } from '../services/api';
import { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';

interface PurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

export function PurchaseModal({ visible, onClose, onPurchaseSuccess }: PurchaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadOfferings();
    }
  }, [visible]);

  const loadOfferings = async () => {
    setLoading(true);
    try {
      const offerings = await purchasesService.getOfferings();
      setOfferings(offerings);
    } catch (error) {
      console.error('Failed to load offerings:', error);
      Alert.alert('Error', 'Failed to load subscription options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const result = await purchasesService.purchasePackage(pkg);

      if (result.success) {
        // Sync subscription status with backend
        await api.syncSubscription();

        Alert.alert(
          'Success!',
          'Welcome to Premium! You now have unlimited access to all riddles.',
          [
            {
              text: 'OK',
              onPress: () => {
                onPurchaseSuccess?.();
                onClose();
              },
            },
          ]
        );
      } else {
        if (result.error !== 'Purchase was cancelled') {
          Alert.alert('Purchase Failed', result.error || 'An error occurred');
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      const result = await purchasesService.restorePurchases();

      if (result.success && result.customerInfo) {
        const hasActiveSubscriptions =
          Object.keys(result.customerInfo.entitlements.active).length > 0;

        if (hasActiveSubscriptions) {
          // Sync with backend
          await api.syncSubscription();

          Alert.alert(
            'Restored!',
            'Your purchases have been restored successfully.',
            [
              {
                text: 'OK',
                onPress: () => {
                  onPurchaseSuccess?.();
                  onClose();
                },
              },
            ]
          );
        } else {
          Alert.alert('No Purchases Found', 'No active subscriptions found to restore.');
        }
      } else {
        Alert.alert('Restore Failed', result.error || 'No purchases found');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderOffering = (pkg: PurchasesPackage) => {
    const product = pkg.product;
    const isMonthly = pkg.identifier.includes('monthly');

    return (
      <TouchableOpacity
        key={pkg.identifier}
        style={styles.packageCard}
        onPress={() => handlePurchase(pkg)}
        disabled={purchasing || loading}
      >
        <View style={styles.packageHeader}>
          <Text style={styles.packageTitle}>{pkg.packageType.toUpperCase()}</Text>
          {isMonthly && <View style={styles.popularBadge}><Text style={styles.popularText}>POPULAR</Text></View>}
        </View>
        <Text style={styles.packagePrice}>{product.priceString}</Text>
        <Text style={styles.packagePeriod}>per {isMonthly ? 'month' : 'year'}</Text>

        <View style={styles.featuresContainer}>
          <Text style={styles.feature}>✓ Unlimited riddles per day</Text>
          <Text style={styles.feature}>✓ No advertisements</Text>
          <Text style={styles.feature}>✓ Priority support</Text>
          <Text style={styles.feature}>✓ Exclusive riddle categories</Text>
        </View>

        <View style={styles.subscribeButton}>
          <Text style={styles.subscribeText}>Subscribe Now</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading && !offerings ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0c4a6e" />
            <Text style={styles.loadingText}>Loading subscription options...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <View style={styles.benefitsContainer}>
              <Text style={styles.subtitle}>Get unlimited access to all features</Text>
            </View>

            {offerings?.current?.availablePackages.map(pkg => renderOffering(pkg))}

            {!offerings?.current && !loading && (
              <View style={styles.noOfferingsContainer}>
                <Text style={styles.noOfferingsText}>
                  No subscription options available at the moment.
                </Text>
                <Text style={styles.noOfferingsSubtext}>
                  Please check your internet connection and try again.
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadOfferings}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestorePurchases}
              disabled={loading || purchasing}
            >
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Subscription automatically renews unless auto-renew is turned off at least 24 hours
              before the end of the current period. Manage subscriptions in your account settings.
            </Text>
          </ScrollView>
        )}

        {purchasing && (
          <View style={styles.purchasingOverlay}>
            <View style={styles.purchasingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.purchasingText}>Processing purchase...</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0c4a6e',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: '#64748b',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  packageCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#0c4a6e',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c4a6e',
  },
  popularBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  packagePrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0c4a6e',
  },
  packagePeriod: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  feature: {
    fontSize: 14,
    color: '#0c4a6e',
    marginBottom: 8,
  },
  subscribeButton: {
    backgroundColor: '#0c4a6e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  restoreButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 14,
    color: '#0c4a6e',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  purchasingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchasingContainer: {
    alignItems: 'center',
  },
  purchasingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  noOfferingsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noOfferingsText: {
    fontSize: 16,
    color: '#0c4a6e',
    textAlign: 'center',
    marginBottom: 8,
  },
  noOfferingsSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0c4a6e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
