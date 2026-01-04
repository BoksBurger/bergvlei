# Bergvlei - AI-Powered Riddle Game

## Product Overview

Bergvlei is an addictive riddle game that leverages AI to create dynamic, personalized puzzle experiences. Unlike traditional riddle apps with static content, Bergvlei uses AI to generate contextual hints, adaptive difficulty, and unique riddle variations that keep players engaged.

### Core Features

- **AI-Generated Hints**: Dynamic hint system that adapts to player behavior
- **Adaptive Difficulty**: AI adjusts riddle complexity based on player performance
- **Daily Challenges**: Fresh AI-curated riddles every day
- **Leaderboards**: Competitive rankings with real-time updates
- **Streak System**: Gamification to drive daily active usage
- **Social Sharing**: Share riddles and challenge friends
- **Premium Content**: Exclusive AI-generated riddle packs

## Business Model - Revenue First

### Immediate Revenue Streams (Launch - Month 1)

1. **Freemium Model**
   - Free: 5 riddles/day with ads
   - Premium: $4.99/month - unlimited riddles, no ads, exclusive packs
   - Target: 3% conversion rate from free to premium

2. **In-App Purchases**
   - Hint packs: $0.99 for 10 hints
   - Riddle bundles: $1.99-$4.99 for themed collections
   - Cosmetics: Profile themes and badges ($0.99-$2.99)

3. **Advertising**
   - Interstitial ads after every 3 riddles (free tier)
   - Rewarded video ads for extra hints
   - Target CPM: $5-15

### Growth Revenue Streams (Month 2-6)

4. **B2B Licensing**
   - White-label riddle platform for educational institutions
   - Corporate team-building packages
   - Pricing: $500-2000/month per organization

5. **Affiliate Revenue**
   - Partner with puzzle book publishers
   - Brain training product recommendations
   - Commission: 5-15%

### Revenue Target
- Month 1: $2,000 (ads + early adopters)
- Month 3: $10,000 (500 premium subscribers + ads)
- Month 6: $25,000 (1,500 premium + B2B deals)

## Technical Stack

### 1. Mobile App (Primary Platform)

**Stack: React Native + Expo**
- Cross-platform (iOS + Android) from single codebase
- Fast time-to-market
- Large talent pool
- Strong community support

**State Management: Zustand**
- Lightweight and performant
- Simple API for mobile apps

**UI Framework: NativeWind (Tailwind CSS for React Native)**
- Rapid UI development
- Consistent design system

### 2. Backend API

**Stack: Node.js + Express + TypeScript**
- Fast development cycle
- JavaScript across full stack
- Excellent async handling for AI API calls
- Strong typing with TypeScript

**Database: PostgreSQL + Redis**
- PostgreSQL: User data, riddles, leaderboards
- Redis: Session management, caching, real-time leaderboards

**ORM: Prisma**
- Type-safe database queries
- Great developer experience
- Easy migrations

### 3. AI Integration

**Primary: OpenAI GPT-4**
- Hint generation
- Riddle variation creation
- Content moderation

**Secondary: Anthropic Claude (for testing/fallback)**
- Alternative AI provider
- Cost optimization

**AI Layer: LangChain**
- Prompt engineering framework
- Chain complex AI operations
- Easy provider switching

### 4. Authentication & Payments

**Auth: Clerk or Supabase Auth**
- Social login (Google, Apple, Facebook)
- Email/password
- Session management

**Payments: Stripe + RevenueCat**
- Stripe: Web payments, B2B subscriptions
- RevenueCat: Mobile IAP management (iOS + Android)
- Unified subscription handling

### 5. Analytics & Monitoring

**Analytics:**
- Mixpanel: User behavior and conversion tracking
- PostHog: Product analytics and feature flags

**Monitoring:**
- Sentry: Error tracking
- Datadog or New Relic: Performance monitoring

**A/B Testing:**
- PostHog or Optimizely

### 6. Infrastructure

**Hosting: Vercel (API) + AWS (Database)**
- Vercel: Serverless Node.js API deployment
- AWS RDS: Managed PostgreSQL
- AWS ElastiCache: Managed Redis
- CloudFront: CDN for static assets

**Alternative: Railway or Render**
- Simpler deployment
- Lower initial costs
- Good for MVP

### 7. Admin Dashboard

**Stack: Next.js + TypeScript + Tailwind CSS**
- Content management
- User analytics
- Revenue tracking
- Riddle curation tools

**Admin UI: Tremor or shadcn/ui**
- Pre-built analytics components
- Professional dashboards

### 8. CI/CD

**Pipeline:**
- GitHub Actions
- Automated testing (Jest + Playwright)
- EAS Build (Expo Application Services) for mobile
- Automated deployment to Vercel

## Go-To-Market Strategy

### Phase 1: MVP (Weeks 1-6)
- Core riddle gameplay
- AI hint system
- Basic freemium model
- Ad integration
- iOS + Android apps

### Phase 2: Monetization (Weeks 7-10)
- Premium subscriptions
- In-app purchases
- Enhanced leaderboards
- Social sharing

### Phase 3: Growth (Weeks 11-16)
- Daily challenges
- Push notifications
- Referral program
- Viral mechanics
- App Store Optimization (ASO)

### Phase 4: Scale (Month 5+)
- B2B licensing platform
- Web version
- Educational partnerships
- International markets

## Competitive Advantages

1. **AI-Powered Content**: Unlimited riddles vs. static content
2. **Adaptive Experience**: Personalized difficulty and hints
3. **Quick Monetization**: Multiple revenue streams from day 1
4. **Low Content Costs**: AI generation vs. human writers
5. **Viral Mechanics**: Shareable daily challenges

## Key Metrics

### User Engagement
- Daily Active Users (DAU)
- Session length: Target 10+ minutes
- Retention: D1 >40%, D7 >20%, D30 >10%
- Riddles per session: Target 8-12

### Revenue
- ARPU (Average Revenue Per User): Target $2-3/month
- Conversion rate: Target 3-5%
- LTV:CAC ratio: Target >3:1
- Churn rate: Target <5%/month

## Development Priorities

1. **Week 1-2**: Core riddle engine + basic UI
2. **Week 3-4**: AI integration + hint system
3. **Week 5**: Ads + payment integration
4. **Week 6**: Beta testing + polish
5. **Week 7**: Launch + marketing
6. **Week 8+**: Iterate based on user feedback

## Success Criteria

### 3-Month Goals
- 10,000 downloads
- 500 paying subscribers
- $10,000 MRR
- 4.5+ app store rating

### 6-Month Goals
- 50,000 downloads
- 2,000 paying subscribers
- $30,000 MRR
- First B2B customer

## Risk Mitigation

1. **AI Costs**: Implement caching, use cheaper models for simple tasks
2. **User Acquisition**: Focus on organic growth, ASO, and viral features
3. **Competition**: Rapid iteration, unique AI features
4. **Platform Risk**: Build for both iOS and Android from day 1
5. **Payment Processing**: Use established providers (Stripe, RevenueCat)

## Next Steps

1. Set up development environment
2. Create Figma designs for MVP
3. Set up backend infrastructure (database, API)
4. Implement core riddle gameplay
5. Integrate AI for hints
6. Set up payment providers
7. Beta test with 50-100 users
8. Launch and iterate

---

**Contact**: burger@boksburger.co.za
