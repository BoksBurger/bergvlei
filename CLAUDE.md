# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bergvlei is an AI-powered riddle game designed for rapid monetization through multiple revenue streams. The project prioritizes revenue generation from day 1 with a freemium model, in-app purchases, and advertising.

## Architecture

### Current Stack (Mobile App - Implemented)
- **Mobile**: React Native + Expo with TypeScript
- **State Management**: Zustand
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router (file-based routing)
- **AI**: Google Gemini API (configured)

### Backend Stack (Implemented)
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (user data, riddles) + Redis (caching, leaderboards)
- **ORM**: Prisma
- **Payments**: RevenueCat for subscription/IAP management (mobile-native)
- **Hosting**: Vercel (API) + AWS (database) or Railway/Render for MVP

### Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home screen
│   │   ├── play.tsx       # Play screen
│   │   └── profile.tsx    # Profile screen
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point (redirects to tabs)
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # Screen components
│   ├── stores/           # Zustand state stores (gameStore.ts)
│   ├── services/         # API and AI services (ai.ts)
│   ├── types/            # TypeScript type definitions
│   ├── constants/        # App constants (game.ts)
│   ├── utils/            # Utility functions
│   └── hooks/            # Custom React hooks
├── assets/               # Images, fonts, etc.
└── app.config.js         # Expo configuration with env vars
```

### Key Architectural Decisions

1. **AI-First Content**: Core gameplay relies on AI-generated hints and adaptive difficulty rather than static content
2. **Cross-Platform from Day 1**: React Native + Expo enables simultaneous iOS/Android launch
3. **Multiple AI Providers**: Architecture supports provider switching (Gemini, GPT-4, Claude) for cost optimization and fallback
4. **Revenue-First Design**: Monetization (ads, IAP, subscriptions) is built into MVP, not added later
5. **Native Mobile Payments**: RevenueCat handles all in-app purchases through App Store/Google Play (no Stripe needed)
6. **Path Aliases**: Use `@components`, `@stores`, `@services`, etc. for clean imports

## Development Commands

### Mobile App (in `mobile/` directory)

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android    # Android emulator/device
npm run ios        # iOS simulator (macOS only)
npm run web        # Web browser

# Build for production
npx expo build:android
npx expo build:ios
```

## Environment Configuration

### Mobile App (`mobile/.env`)
- `GEMINI_KEY`: Google Gemini API key for AI hint generation and riddle content
- `API_URL`: Backend API URL (e.g., `http://localhost:3000` for dev)
- `REVENUECAT_APPLE_API_KEY`: RevenueCat API key for iOS (from RevenueCat dashboard)
- `REVENUECAT_GOOGLE_API_KEY`: RevenueCat API key for Android (from RevenueCat dashboard)

### Backend (`backend/.env`)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT tokens (min 32 characters)
- `REVENUECAT_API_KEY`: RevenueCat secret API key for backend webhook verification
- `REVENUECAT_WEBHOOK_AUTH_TOKEN`: Optional webhook authorization token
- `GEMINI_API_KEY`: Google Gemini API key

**Setup**:
1. Copy `.env.example` to `.env` in both `mobile/` and `backend/` directories
2. Add your API keys and credentials
3. Variables are loaded via `dotenv` (backend) and `app.config.js` (mobile)

**Security**: `.env` is gitignored. Never commit API keys or credentials.

## RevenueCat Integration

### Overview
RevenueCat handles all in-app purchases and subscriptions for iOS and Android. It provides:
- Native App Store/Google Play billing integration
- Server-side receipt validation
- Subscription status management
- Webhook events for subscription changes
- Cross-platform subscription tracking

### Architecture

**Mobile App (`mobile/src/services/purchases.ts`):**
- Initializes RevenueCat SDK on app launch
- Identifies users after login/registration
- Handles purchase flows (subscriptions, one-time purchases)
- Restores purchases across devices
- Checks premium status locally

**Backend (`backend/src/services/revenuecat.service.ts`):**
- Receives webhook events from RevenueCat
- Syncs subscription status to database
- Updates user premium access
- Handles subscription lifecycle (purchase, renewal, cancellation, expiration)

### Subscription Flow

1. **User clicks "Upgrade to Premium"**
   - `PurchaseModal` component opens
   - Fetches offerings from RevenueCat SDK
   - Displays subscription packages with pricing

2. **User selects subscription**
   - Initiates purchase through RevenueCat SDK
   - App Store/Google Play handles payment
   - RevenueCat validates receipt

3. **Purchase completes**
   - Mobile app receives success callback
   - Calls `POST /api/subscription/sync` to sync with backend
   - Backend fetches subscriber info from RevenueCat API
   - Updates database (user.isPremium, subscription.tier, etc.)

4. **RevenueCat sends webhook**
   - Webhook event (INITIAL_PURCHASE, RENEWAL, etc.) sent to backend
   - Backend processes event and updates database
   - Cache invalidated for user profile

### Webhook Events Handled

- **INITIAL_PURCHASE**: New subscription created
- **RENEWAL**: Subscription renewed successfully
- **CANCELLATION**: User cancelled (remains active until period end)
- **UNCANCELLATION**: User reactivated subscription
- **EXPIRATION**: Subscription expired (downgrade to free)
- **BILLING_ISSUE**: Payment failed
- **PRODUCT_CHANGE**: User upgraded/downgraded plan
- **NON_RENEWING_PURCHASE**: One-time purchase (hint packs)

### API Endpoints

**Subscription Routes** (`/api/subscription/*`):
- `GET /status` - Get user's subscription status (premium, tier, limits)
- `POST /sync` - Sync subscription status from RevenueCat (call after purchase)
- `GET /offerings` - Get available subscription products (informational)
- `POST /webhook` - Receive RevenueCat webhook events (no auth)

### Database Schema

**Subscription Model:**
```prisma
model Subscription {
  id                    String              @id
  userId                String

  revenueCatAppUserId   String?             @unique
  revenueCatProductId   String?

  status                SubscriptionStatus  // ACTIVE, CANCELED, EXPIRED, TRIAL
  tier                  SubscriptionTier    // FREE, PREMIUM

  currentPeriodStart    DateTime?
  currentPeriodEnd      DateTime?
  cancelAtPeriodEnd     Boolean
}
```

### Setup Requirements

1. **RevenueCat Dashboard Setup:**
   - Create RevenueCat account at revenuecat.com
   - Create new project
   - Add iOS app (bundle ID: `com.bergvlei.app`)
   - Add Android app (package: `com.bergvlei.app`)
   - Create products in App Store Connect and Google Play Console
   - Configure products in RevenueCat (e.g., `premium_monthly`)
   - Get API keys (public keys for mobile, secret key for backend)

2. **App Store Connect (iOS):**
   - Create subscription product
   - Configure pricing ($4.99/month)
   - Set up subscription groups
   - Add to RevenueCat dashboard

3. **Google Play Console (Android):**
   - Create subscription product
   - Configure pricing ($4.99/month)
   - Add to RevenueCat dashboard

4. **Environment Variables:**
   - Mobile: Add RevenueCat API keys to `.env`
   - Backend: Add RevenueCat secret API key to `.env`
   - Configure webhook URL in RevenueCat dashboard: `https://your-api.com/api/subscription/webhook`

5. **Development Build Required:**
   - RevenueCat requires native modules
   - Run `npx expo prebuild` to generate iOS/Android folders
   - Use development build instead of Expo Go
   - Run `npm run ios` or `npm run android`

### Testing

**Sandbox Testing:**
- iOS: Create sandbox tester account in App Store Connect
- Android: Add test account in Google Play Console
- RevenueCat automatically detects sandbox purchases
- Test full purchase flow without real charges

**Key Test Scenarios:**
- New subscription purchase
- Subscription renewal (force date change in sandbox)
- Cancellation (remains premium until period end)
- Expiration (downgrades to free tier)
- Restore purchases (different device)
- Failed payment (billing issue)

## Development Phases

### Phase 1: MVP (Weeks 1-6)
Focus on core riddle gameplay, AI hint system, basic freemium model, ad integration, and mobile apps.

### Phase 2: Monetization (Weeks 7-10)
Premium subscriptions, in-app purchases, enhanced leaderboards, social sharing.

### Phase 3: Growth (Weeks 11-16)
Daily challenges, push notifications, referral program, viral mechanics.

### Phase 4: Scale (Month 5+)
B2B licensing, web version, educational partnerships, international expansion.

## Key Metrics & Targets

### User Engagement
- Session length: 10+ minutes
- Retention: D1 >40%, D7 >20%, D30 >10%
- Riddles per session: 8-12

### Revenue
- Month 1: $2K, Month 3: $10K, Month 6: $25K MRR
- Premium conversion: 3-5%
- ARPU: $2-3/month

## Business Context

When implementing features, prioritize:
1. **Speed to market**: MVP target is 6 weeks to launch
2. **Monetization**: Every feature should support one of the revenue streams (freemium, IAP, ads, B2B)
3. **AI cost optimization**: Cache AI responses, use cheaper models where possible
4. **Viral mechanics**: Features should encourage social sharing and daily engagement
5. **Cross-platform parity**: iOS and Android features must launch simultaneously

## Important Constraints

- **No static riddle content**: All content is AI-generated or AI-enhanced
- **Freemium limits**: Free users get 5 riddles/day with ads
- **Premium pricing**: $4.99/month standard subscription
- **Ad placement**: Interstitial ads after every 3 riddles (free tier only)
