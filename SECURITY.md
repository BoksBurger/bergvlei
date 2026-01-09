# Security Architecture

This document explains the security architecture for Bergvlei, particularly around sensitive API keys and subscription management.

## Overview

All sensitive operations (AI generation, subscription management) are handled server-side for security, cost control, and centralized logic.

## AI Key Management

### ❌ Before (Insecure)
- `GEMINI_KEY` stored in mobile `.env` file
- Direct AI API calls from mobile app
- API key exposed in client code
- No usage control or monitoring

### ✅ After (Secure)
- `GEMINI_API_KEY` only in **backend** `.env` file
- Mobile app calls backend APIs for all AI features
- Backend controls AI usage and costs
- Centralized monitoring and rate limiting

### Migration Steps

**Mobile app changes:**
1. Removed `GEMINI_KEY` from `mobile/.env`
2. Removed `GEMINI_KEY` from `mobile/app.config.js`
3. Deprecated `mobile/src/services/ai.ts` (will be removed)
4. Added new API methods in `mobile/src/services/api.ts`:
   - `api.getAIHint(riddleId)` - AI-powered hints
   - `api.validateAnswerWithAI(riddleId, answer)` - Fuzzy answer matching
   - `api.generateAIRiddle(difficulty, category)` - AI riddle generation

**Backend changes:**
1. Added `backend/src/services/ai.service.ts` - AI generation service
2. Updated `backend/src/services/riddle.service.ts` - Integrated AI features
3. Added new endpoints in `backend/src/routes/riddle.routes.ts`:
   - `GET /api/riddles/:riddleId/ai-hint` - Generate AI hint
   - `POST /api/riddles/validate-ai` - Validate with AI
   - `GET /api/riddles/generate-ai` - Generate AI riddle

## RevenueCat Key Management

### Understanding RevenueCat Keys

RevenueCat uses **two types of API keys**:

1. **Public API Keys** (for mobile clients)
   - `REVENUECAT_APPLE_API_KEY` (starts with `appl_`)
   - `REVENUECAT_GOOGLE_API_KEY` (starts with `goog_`)
   - ✅ **Designed for client-side use**
   - ✅ Cannot be used maliciously (purchases require real payments)
   - ✅ Safe to include in mobile apps

2. **Secret API Key** (for backend)
   - `REVENUECAT_API_KEY` (starts with `sk_`)
   - ❌ **Never expose in mobile app**
   - ✅ Only stored in backend `.env`
   - Used for server-side operations and webhooks

### Current Architecture

**Mobile App:**
- Contains public RevenueCat API keys (required for SDK)
- Initializes RevenueCat SDK for purchase flows
- Calls backend to sync subscription status after purchase
- **Cannot** modify subscription status directly

**Backend:**
- Contains secret RevenueCat API key
- **Source of truth** for subscription status
- Receives webhook events from RevenueCat
- Validates and updates subscription state in database
- Mobile apps query backend for subscription status

### Security Benefits

1. **Subscription Status Controlled Server-Side**
   - Mobile app cannot fake premium status
   - All checks go through backend API
   - Webhook ensures real-time sync

2. **Public Keys Are Safe**
   - RevenueCat public keys are designed for mobile use
   - Cannot be used to create fake purchases
   - All purchases go through App Store/Google Play

3. **Backend as Gatekeeper**
   - Premium features gated by backend API
   - Database tracks subscription state
   - Redis cache for performance

### Best Practices

#### For Development

```bash
# Backend .env (SECRET - never commit)
REVENUECAT_API_KEY=sk_your_secret_key_here
GEMINI_API_KEY=your_gemini_key_here

# Mobile .env (public keys - still gitignored for cleanliness)
REVENUECAT_APPLE_API_KEY=appl_your_public_key
REVENUECAT_GOOGLE_API_KEY=goog_your_public_key
```

#### For Production

**Backend:**
- Store secret keys in environment variables (Vercel, Railway, etc.)
- Use secrets management (AWS Secrets Manager, etc.)
- Never commit to git
- Rotate keys if compromised

**Mobile:**
- Public keys can be hardcoded or in config
- Use Expo's `extra` config for environment-specific values
- For extra security, use Expo's secure config features

#### Subscription Flow Security

```
User clicks "Buy Premium"
  ↓
Mobile: RevenueCat SDK handles purchase with App Store/Google Play
  ↓
Mobile: Receives purchase success from RevenueCat SDK
  ↓
Mobile: Calls backend POST /api/subscription/sync
  ↓
Backend: Fetches subscription info from RevenueCat API (using secret key)
  ↓
Backend: Updates database (user.isPremium = true)
  ↓
RevenueCat: Sends webhook to backend (subscription events)
  ↓
Backend: Processes webhook, keeps database in sync
  ↓
Mobile: Queries GET /api/subscription/status for current status
```

## Rate Limiting

**Backend API Rate Limits:**
- All endpoints: 100 requests / 15 minutes
- Auth endpoints: 5 requests / 15 minutes
- Riddle endpoints: 10 requests / 1 minute
- Prevents abuse and controls AI costs

## Environment Variables

### Backend `.env` (SENSITIVE - never commit)

```bash
# Server
NODE_ENV=production
PORT=3000
API_URL=https://api.bergvlei.com

# Database (SENSITIVE)
DATABASE_URL=postgresql://user:password@host:5432/bergvlei
REDIS_URL=redis://host:6379

# JWT Secret (SENSITIVE - min 32 chars)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-must-be-at-least-32-characters
JWT_EXPIRES_IN=7d

# RevenueCat (SENSITIVE - secret key)
REVENUECAT_API_KEY=sk_your_revenuecat_secret_api_key
REVENUECAT_WEBHOOK_AUTH_TOKEN=your_webhook_token

# Google Gemini AI (SENSITIVE)
GEMINI_API_KEY=your_gemini_api_key_here

# CORS
ALLOWED_ORIGINS=https://app.bergvlei.com,https://www.bergvlei.com
```

### Mobile `.env` (PUBLIC KEYS - gitignored for cleanliness)

```bash
# Backend API
API_URL=https://api.bergvlei.com/api

# RevenueCat (PUBLIC KEYS - safe for client-side)
REVENUECAT_APPLE_API_KEY=appl_your_apple_api_key
REVENUECAT_GOOGLE_API_KEY=goog_your_google_api_key
```

## Security Checklist

### Development
- [x] Remove sensitive keys from mobile
- [x] Move AI logic to backend
- [x] Backend is source of truth for subscriptions
- [x] Use `.env.example` for documentation
- [x] Add `.env` to `.gitignore`

### Pre-Production
- [ ] Rotate all API keys
- [ ] Use production RevenueCat keys
- [ ] Configure webhook URL in RevenueCat dashboard
- [ ] Enable CORS restrictions
- [ ] Set up secrets management (AWS, Vercel, etc.)
- [ ] Configure rate limiting appropriately
- [ ] Enable production logging/monitoring

### Production
- [ ] Monitor API usage and costs
- [ ] Set up alerts for unusual activity
- [ ] Regular security audits
- [ ] Key rotation schedule
- [ ] Backup and disaster recovery
- [ ] Monitor RevenueCat webhook events

## Threat Model

### Mitigated Threats
✅ API key theft from mobile app (keys now server-side)
✅ Fake premium subscriptions (backend validates)
✅ Excessive AI usage (rate limiting + backend control)
✅ Direct AI API abuse (no client-side keys)

### Remaining Considerations
⚠️ Token theft (use HTTPS, short expiry, refresh tokens)
⚠️ Rate limit bypass (monitor IPs, implement additional checks)
⚠️ Backend compromise (keep dependencies updated, monitor logs)

## Support

For security issues, contact: security@bergvlei.com (when available)
For RevenueCat setup: https://docs.revenuecat.com/
