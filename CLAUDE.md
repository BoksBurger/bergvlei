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

### Planned Stack (Backend - Not Yet Implemented)
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (user data, riddles) + Redis (caching, leaderboards)
- **ORM**: Prisma
- **Payments**: Stripe + RevenueCat for subscription/IAP management
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
5. **Path Aliases**: Use `@components`, `@stores`, `@services`, etc. for clean imports

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

The project uses Google Gemini AI. Environment variables are configured in `mobile/.env`:
- `GEMINI_KEY`: Google Gemini API key for AI hint generation and riddle content

**Setup**:
1. Copy `mobile/.env.example` to `mobile/.env`
2. Add your Gemini API key
3. Variables are loaded via `app.config.js` and accessible via `expo-constants`

**Security**: `.env` is gitignored. Never commit API keys or credentials.

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
