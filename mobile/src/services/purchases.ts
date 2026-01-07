import Purchases, {
  PurchasesOfferings,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// RevenueCat API Keys (from app.config.js / expo-constants)
const REVENUECAT_APPLE_API_KEY = Constants.expoConfig?.extra?.revenueCatAppleKey || '';
const REVENUECAT_GOOGLE_API_KEY = Constants.expoConfig?.extra?.revenueCatGoogleKey || '';

class PurchasesService {
  private initialized = false;

  /**
   * Initialize RevenueCat SDK
   * Call this once when the app starts
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized) {
      console.log('RevenueCat already initialized');
      return;
    }

    try {
      const apiKey = Platform.select({
        ios: REVENUECAT_APPLE_API_KEY,
        android: REVENUECAT_GOOGLE_API_KEY,
      });

      if (!apiKey) {
        console.error('RevenueCat API key not configured for this platform');
        return;
      }

      // Configure RevenueCat
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);

      // Initialize with API key
      await Purchases.configure({
        apiKey,
        appUserID: userId, // Optional: use your backend user ID
      });

      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Set user ID (app_user_id in RevenueCat)
   * Call this after user logs in
   */
  async identifyUser(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      console.log(`User identified in RevenueCat: ${userId}`);
    } catch (error) {
      console.error('Failed to identify user in RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Logout user (reset to anonymous)
   * Call this when user logs out
   */
  async logoutUser(): Promise<void> {
    try {
      await Purchases.logOut();
      console.log('User logged out from RevenueCat');
    } catch (error) {
      console.error('Failed to logout user from RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Get available offerings (subscription products)
   */
  async getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      const offerings = await Purchases.getOfferings();

      if (offerings.current !== null) {
        console.log('Available offerings:', offerings.current.availablePackages.length);
        return offerings;
      }

      console.log('No offerings available');
      return null;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  /**
   * Purchase a package (subscription or one-time purchase)
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);

      console.log('Purchase successful:', {
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
      });

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error('Purchase failed:', error);

      if (error.userCancelled) {
        return {
          success: false,
          error: 'Purchase was cancelled',
        };
      }

      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Get customer info (subscription status)
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * Check if user has premium access
   */
  async isPremium(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();

      if (!customerInfo) {
        return false;
      }

      // Check if user has any active entitlements
      const hasActiveEntitlements = Object.keys(customerInfo.entitlements.active).length > 0;

      // Or check for specific entitlement (e.g., "premium")
      const hasPremiumEntitlement = customerInfo.entitlements.active['premium'] !== undefined;

      return hasActiveEntitlements || hasPremiumEntitlement;
    } catch (error) {
      console.error('Failed to check premium status:', error);
      return false;
    }
  }

  /**
   * Restore purchases (for users who purchased on another device)
   */
  async restorePurchases(): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    try {
      const customerInfo = await Purchases.restorePurchases();

      console.log('Purchases restored:', {
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
      });

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error('Failed to restore purchases:', error);
      return {
        success: false,
        error: error.message || 'Failed to restore purchases',
      };
    }
  }

  /**
   * Get subscription expiration date
   */
  async getSubscriptionExpirationDate(): Promise<Date | null> {
    try {
      const customerInfo = await this.getCustomerInfo();

      if (!customerInfo) {
        return null;
      }

      // Get the latest expiration date from active entitlements
      const activeEntitlements = Object.values(customerInfo.entitlements.active);

      if (activeEntitlements.length === 0) {
        return null;
      }

      // Get the earliest expiration date (in case multiple subscriptions)
      const expirationDates = activeEntitlements
        .map(entitlement => entitlement.expirationDate)
        .filter(date => date !== null) as string[];

      if (expirationDates.length === 0) {
        return null;
      }

      const earliestExpiration = new Date(
        Math.min(...expirationDates.map(date => new Date(date).getTime()))
      );

      return earliestExpiration;
    } catch (error) {
      console.error('Failed to get expiration date:', error);
      return null;
    }
  }
}

export const purchasesService = new PurchasesService();
