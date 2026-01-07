# RevenueCat Setup & Deployment Guide

This guide walks you through the complete setup process for RevenueCat integration in the Bergvlei app.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [RevenueCat Dashboard Setup](#revenuecat-dashboard-setup)
3. [App Store Connect Setup (iOS)](#app-store-connect-setup-ios)
4. [Google Play Console Setup (Android)](#google-play-console-setup-android)
5. [Backend Configuration](#backend-configuration)
6. [Mobile App Configuration](#mobile-app-configuration)
7. [Database Migration](#database-migration)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] RevenueCat account (free at [revenuecat.com](https://revenuecat.com))
- [ ] Apple Developer Account ($99/year) for iOS
- [ ] Google Play Developer Account ($25 one-time) for Android
- [ ] Backend deployed and accessible (for webhooks)
- [ ] PostgreSQL database running
- [ ] Redis instance running

---

## RevenueCat Dashboard Setup

### Step 1: Create RevenueCat Project

1. Sign up at [revenuecat.com](https://revenuecat.com)
2. Click "Create new project"
3. Enter project name: **Bergvlei**
4. Select platform: **iOS** (we'll add Android later)

### Step 2: Add iOS App

1. Go to **Project Settings** → **Apps**
2. Click **+ New**
3. Select **Apple App Store**
4. Enter details:
   - **App name**: Bergvlei
   - **Bundle ID**: `com.bergvlei.app`
   - **App Store Connect App-Specific Shared Secret**: (get from App Store Connect)
5. Click **Save**

### Step 3: Add Android App

1. Go to **Project Settings** → **Apps**
2. Click **+ New**
3. Select **Google Play Store**
4. Enter details:
   - **App name**: Bergvlei
   - **Package name**: `com.bergvlei.app`
   - **Service Account Credentials**: (upload JSON from Google Cloud)
5. Click **Save**

### Step 4: Get API Keys

1. Go to **Project Settings** → **API Keys**
2. Copy the following keys:
   - **Apple API Key** (starts with `appl_`)
   - **Google API Key** (starts with `goog_`)
   - **Public API Key** (for SDKs - starts with `pk_`)
   - **Secret API Key** (for backend - starts with `sk_`)

3. Save these keys securely - you'll need them later

### Step 5: Create Entitlements

1. Go to **Project Settings** → **Entitlements**
2. Click **+ New**
3. Enter:
   - **Identifier**: `premium`
   - **Display name**: Premium Access
4. Click **Save**

This entitlement will be granted when users subscribe to premium.

---

## App Store Connect Setup (iOS)

### Step 1: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Enter details:
   - **Platforms**: iOS
   - **Name**: Bergvlei
   - **Primary Language**: English (US)
   - **Bundle ID**: `com.bergvlei.app` (create if needed)
   - **SKU**: `bergvlei-ios`
   - **User Access**: Full Access

### Step 2: Create Subscription Group

1. Open your app in App Store Connect
2. Go to **Features** → **In-App Purchases**
3. Click **Subscription Groups** → **+**
4. Enter:
   - **Reference Name**: Premium Subscriptions
   - **Group Name**: Premium Access
5. Click **Create**

### Step 3: Create Subscription Product

1. Inside the subscription group, click **+** (Create Subscription)
2. Enter:
   - **Reference Name**: Premium Monthly
   - **Product ID**: `premium_monthly` (must match RevenueCat)
   - **Subscription Duration**: 1 month
3. Click **Create**

### Step 4: Configure Subscription Pricing

1. Click **Subscription Pricing**
2. Add pricing:
   - **United States**: $4.99
   - **South Africa**: R89.99
   - (Add other regions as needed)
3. Click **Save**

### Step 5: Add Subscription Information

1. **Subscription Display Name**: Premium Monthly
2. **Description**: Unlimited riddles, no ads, exclusive content
3. Upload **promotional images** (1024x1024 recommended)
4. Click **Save**

### Step 6: Get App-Specific Shared Secret

1. Go to **App Information** → **App-Specific Shared Secret**
2. Click **Generate** if not already created
3. Copy the shared secret
4. Add this to RevenueCat dashboard (Step 2 of RevenueCat setup)

### Step 7: Submit for Review

1. Once all metadata is complete, click **Submit for Review**
2. Apple will review the subscription (usually 1-3 days)
3. You can test in sandbox mode while waiting for approval

---

## Google Play Console Setup (Android)

### Step 1: Create Service Account (Google Cloud)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable **Google Play Android Developer API**
4. Go to **IAM & Admin** → **Service Accounts**
5. Click **Create Service Account**
6. Enter:
   - **Name**: RevenueCat Bergvlei
   - **ID**: `revenuecat-bergvlei`
7. Click **Create and Continue**
8. Grant role: **Viewer**
9. Click **Continue** → **Done**
10. Click on the service account → **Keys** → **Add Key** → **Create new key**
11. Select **JSON** → **Create**
12. Download the JSON file (keep it secure!)

### Step 2: Link Service Account to Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Go to **Users and permissions**
3. Click **Invite new users**
4. Enter the service account email (from JSON file)
5. Grant permissions:
   - **View app information and download bulk reports**
   - **View financial data**
   - **Manage orders and subscriptions**
6. Click **Invite user**

### Step 3: Create App in Play Console

1. Click **All apps** → **Create app**
2. Enter:
   - **App name**: Bergvlei
   - **Default language**: English (United States)
   - **App or game**: Game
   - **Free or paid**: Free
3. Accept terms and click **Create app**

### Step 4: Create Subscription Product

1. Go to **Monetize** → **Products** → **Subscriptions**
2. Click **Create subscription**
3. Enter:
   - **Product ID**: `premium_monthly` (must match iOS and RevenueCat)
   - **Name**: Premium Monthly
   - **Description**: Unlimited riddles, no ads, exclusive content
4. Click **Save**

### Step 5: Configure Pricing

1. Click **Set prices**
2. Select **South Africa** as base country
3. Set price: **R89.99**
4. Click **Apply prices to other countries** (auto-convert)
5. Review and adjust prices for other regions
6. Click **Save**

### Step 6: Configure Subscription Settings

1. **Billing period**: 1 Month
2. **Free trial**: Optional (e.g., 7 days)
3. **Grace period**: 3 days (recommended)
4. **Account hold**: 30 days (recommended)
5. Click **Activate**

### Step 7: Upload Service Account JSON to RevenueCat

1. Go back to RevenueCat dashboard
2. Open your Android app settings
3. Upload the service account JSON file
4. Click **Save**

---

## Backend Configuration

### Step 1: Update Environment Variables

Edit `backend/.env`:

```env
# RevenueCat
REVENUECAT_API_KEY=sk_your_secret_api_key_from_revenuecat
REVENUECAT_WEBHOOK_AUTH_TOKEN=your_custom_webhook_token_optional

# Other required variables
DATABASE_URL=postgresql://user:password@localhost:5432/bergvlei
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
GEMINI_API_KEY=your_gemini_api_key
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `@revenuecat/purchases-typescript-sdk` (RevenueCat backend SDK)
- Other updated dependencies

### Step 3: Configure Webhook URL in RevenueCat

1. Go to RevenueCat dashboard → **Project Settings** → **Integrations**
2. Click **+ New** → **Webhook**
3. Enter:
   - **URL**: `https://your-api.com/api/subscription/webhook`
   - **Authorization**: `Bearer your_custom_webhook_token_optional` (if using)
4. Select events to send (select all for comprehensive tracking)
5. Click **Add Webhook**

### Step 4: Test Webhook

1. RevenueCat provides a "Send Test Event" button
2. Check your backend logs to ensure event is received
3. Verify database is updated correctly

---

## Mobile App Configuration

### Step 1: Update Environment Variables

Edit `mobile/.env`:

```env
# Google Gemini AI
GEMINI_KEY=your_gemini_api_key

# Backend API
API_URL=https://your-api.com

# RevenueCat
REVENUECAT_APPLE_API_KEY=appl_your_apple_api_key_from_revenuecat
REVENUECAT_GOOGLE_API_KEY=goog_your_google_api_key_from_revenuecat
```

### Step 2: Install Dependencies

```bash
cd mobile
npm install
```

This will install:
- `react-native-purchases` (RevenueCat mobile SDK)

### Step 3: Create Development Build

RevenueCat requires native modules, so you need a development build:

```bash
# Generate native iOS and Android folders
npx expo prebuild

# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..

# Run on iOS (macOS only)
npm run ios

# Run on Android
npm run android
```

**Note**: You can no longer use Expo Go with RevenueCat. You must use a development build or EAS Build.

### Step 4: Configure Products in RevenueCat

1. Go to RevenueCat dashboard → **Products**
2. Click **+ New**
3. Enter:
   - **Identifier**: `premium_monthly`
   - **Type**: Subscription
   - **App Store Product ID**: `premium_monthly` (from App Store Connect)
   - **Play Store Product ID**: `premium_monthly` (from Google Play Console)
4. Click **Save**

### Step 5: Create Offering

1. Go to **Offerings**
2. Click **+ New**
3. Enter:
   - **Identifier**: `default`
   - **Description**: Default offering
4. Add packages:
   - **Package Type**: Monthly
   - **Product**: `premium_monthly`
5. Make this the **Current Offering**
6. Click **Save**

---

## Database Migration

### Step 1: Update Prisma Schema

The schema has already been updated to replace Stripe fields with RevenueCat fields:

```prisma
model Subscription {
  // Old Stripe fields (removed):
  // stripeCustomerId
  // stripeSubscriptionId
  // stripePriceId

  // New RevenueCat fields:
  revenueCatAppUserId   String?  @unique
  revenueCatProductId   String?
}
```

### Step 2: Create Migration

```bash
cd backend

# Create migration
npx prisma migrate dev --name replace_stripe_with_revenuecat

# Or push to database directly (for dev)
npx prisma db push
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

### Step 4: Verify Migration

```bash
# Open Prisma Studio to inspect database
npx prisma studio
```

Check that:
- Stripe columns are removed
- RevenueCat columns are added
- Existing data is preserved (if any)

---

## Testing

### iOS Sandbox Testing

#### Step 1: Create Sandbox Tester

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Users and Access** → **Sandbox Testers**
3. Click **+** → **Create New Sandbox Tester**
4. Enter:
   - **Email**: Use a new email (e.g., `tester1@yourdomain.com`)
   - **Password**: Create a strong password
   - **Country**: Select your country
5. Click **Save**

#### Step 2: Configure Device

1. On your iOS device, go to **Settings** → **App Store**
2. Scroll down to **Sandbox Account**
3. Sign in with the sandbox tester account

#### Step 3: Test Purchase Flow

1. Open Bergvlei app (development build)
2. Go to Profile → **Upgrade to Premium**
3. Select subscription package
4. Complete purchase (you won't be charged)
5. Verify premium access is granted

### Android Sandbox Testing

#### Step 1: Add Test Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Go to **Setup** → **License testing**
3. Add your Gmail account to **License test users**
4. Save changes

#### Step 2: Test Purchase Flow

1. Ensure you're signed in with the test account on your Android device
2. Open Bergvlei app (development build)
3. Go to Profile → **Upgrade to Premium**
4. Select subscription package
5. Complete test purchase
6. Verify premium access is granted

### Backend Testing

#### Test Webhook Events

1. Go to RevenueCat dashboard → **Customers**
2. Find your test purchase
3. Click **Send Test Event**
4. Check backend logs:

```bash
cd backend
npm run dev

# Watch for webhook events
# You should see logs like:
# "Processing RevenueCat webhook: INITIAL_PURCHASE for user xyz123"
```

5. Verify database:

```bash
npx prisma studio

# Check:
# - User isPremium = true
# - Subscription status = ACTIVE
# - Subscription tier = PREMIUM
```

---

## Production Deployment

### Step 1: Build Production Apps

#### iOS (via EAS Build or Xcode)

```bash
cd mobile

# Using EAS Build
eas build --platform ios

# Or locally with Xcode
npx expo run:ios --configuration Release
```

#### Android (via EAS Build or Android Studio)

```bash
cd mobile

# Using EAS Build
eas build --platform android

# Or locally
npx expo run:android --variant release
```

### Step 2: Submit to App Stores

#### iOS Submission

1. Open Xcode
2. Go to **Product** → **Archive**
3. Once archived, click **Distribute App**
4. Select **App Store Connect**
5. Upload to App Store Connect
6. In App Store Connect, select the build
7. Complete app metadata (if not done)
8. Submit for review

#### Android Submission

1. Generate signed APK/AAB
2. Go to Google Play Console
3. Go to **Production** → **Create new release**
4. Upload the AAB file
5. Complete release notes
6. Click **Review release** → **Start rollout to Production**

### Step 3: Monitor Subscriptions

1. **RevenueCat Dashboard**:
   - Go to **Dashboard** to see real-time metrics
   - Monitor MRR (Monthly Recurring Revenue)
   - Track active subscribers
   - View churn rate

2. **App Store Connect**:
   - Go to **Sales and Trends**
   - View subscription metrics
   - Monitor revenue

3. **Google Play Console**:
   - Go to **Monetization** → **Subscriptions**
   - View subscriber metrics
   - Track revenue

### Step 4: Configure Production Webhooks

Ensure your production backend URL is configured in RevenueCat:

```
https://api.bergvlei.com/api/subscription/webhook
```

Test webhook delivery in production:
1. Make a real purchase (or ask a beta tester)
2. Check RevenueCat webhook logs
3. Verify database is updated

---

## Troubleshooting

### Common Issues

#### 1. "RevenueCat API key not found"

**Solution**: Check that API keys are correctly set in `.env` files and restart the app/server.

```bash
# Mobile
cat mobile/.env | grep REVENUECAT

# Backend
cat backend/.env | grep REVENUECAT
```

#### 2. "No offerings available"

**Possible causes**:
- Products not created in App Store Connect/Google Play Console
- Products not linked in RevenueCat dashboard
- No current offering set in RevenueCat

**Solution**:
1. Verify products exist in both stores
2. Check RevenueCat dashboard → **Products** (should see `premium_monthly`)
3. Go to **Offerings** → ensure "default" offering is set as **Current**

#### 3. "Purchase failed" or "Receipt validation failed"

**Possible causes**:
- Using Expo Go (not supported)
- Incorrect bundle ID/package name
- Sandbox account issues

**Solution**:
1. Ensure using development build (`npx expo prebuild`)
2. Verify bundle ID matches: `com.bergvlei.app`
3. Sign out and sign back in to sandbox account
4. Clear app data and reinstall

#### 4. "Webhook not received"

**Possible causes**:
- Webhook URL incorrect
- Backend not accessible from internet
- Firewall blocking RevenueCat

**Solution**:
1. Test webhook URL manually: `curl https://your-api.com/api/subscription/webhook`
2. Check firewall/security groups allow RevenueCat IPs
3. Verify webhook URL in RevenueCat dashboard is correct
4. Check webhook logs in RevenueCat dashboard

#### 5. "Premium status not syncing"

**Solution**:
1. Call `/api/subscription/sync` endpoint after purchase
2. Check backend logs for errors
3. Verify database is being updated
4. Clear Redis cache if using

---

## Monitoring & Maintenance

### Regular Checks

**Weekly**:
- Check RevenueCat dashboard for churn rate
- Monitor failed payment webhooks
- Review subscription trends

**Monthly**:
- Reconcile revenue across platforms (RevenueCat, App Store, Play Store)
- Review and respond to subscription-related reviews
- Update pricing if needed

### Key Metrics to Track

1. **Active Subscribers**: Total premium users
2. **MRR**: Monthly recurring revenue
3. **Churn Rate**: % of users cancelling
4. **Conversion Rate**: Free → Premium %
5. **ARPU**: Average revenue per user

### Support Scenarios

**User can't restore purchases**:
1. Verify they're signed in with the correct App Store/Play Store account
2. Have them try "Restore Purchases" button in app
3. Check RevenueCat dashboard → **Customers** → search by email
4. Manually grant premium if needed (RevenueCat dashboard)

**Subscription not recognized after purchase**:
1. Check RevenueCat webhook logs
2. Verify backend processed the webhook
3. Check database subscription status
4. Call `/api/subscription/sync` to force sync
5. Check for errors in backend logs

---

## Additional Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [React Native SDK Guide](https://docs.revenuecat.com/docs/reactnative)
- [App Store Connect Help](https://developer.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Bergvlei Support](mailto:support@bergvlei.com)

---

## Summary Checklist

Before going to production, ensure:

- [ ] RevenueCat account created and configured
- [ ] iOS app created in App Store Connect
- [ ] Android app created in Google Play Console
- [ ] Subscription products created in both stores
- [ ] Products configured in RevenueCat
- [ ] Offering created and set as current
- [ ] API keys added to `.env` files
- [ ] Backend deployed and webhook URL configured
- [ ] Database migrated to RevenueCat schema
- [ ] Mobile app tested in sandbox mode (iOS & Android)
- [ ] Purchase flow works end-to-end
- [ ] Webhook events received and processed
- [ ] Premium access granted correctly
- [ ] Restore purchases functionality tested
- [ ] Production builds created and uploaded
- [ ] Apps submitted for review
- [ ] Monitoring dashboard configured

---

**Need Help?** Contact the development team or refer to the main `CLAUDE.md` documentation for architecture details.
