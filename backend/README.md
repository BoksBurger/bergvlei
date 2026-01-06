# Bergvlei Backend API

Backend API for the Bergvlei AI-powered riddle game. Built with Node.js, Express, TypeScript, PostgreSQL, Redis, and Stripe.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express with TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis (ioredis)
- **Payments**: Stripe
- **Authentication**: JWT
- **Validation**: Zod

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma           # Database schema
├── src/
│   ├── config/                 # Configuration files
│   │   ├── env.ts             # Environment variables
│   │   ├── database.ts        # Prisma client
│   │   └── redis.ts           # Redis client
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── riddle.controller.ts
│   │   ├── leaderboard.controller.ts
│   │   └── subscription.controller.ts
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts           # Authentication
│   │   ├── errorHandler.ts   # Error handling
│   │   ├── rateLimiter.ts    # Rate limiting
│   │   └── validation.ts     # Request validation
│   ├── routes/               # API routes
│   │   ├── auth.routes.ts
│   │   ├── riddle.routes.ts
│   │   ├── leaderboard.routes.ts
│   │   ├── subscription.routes.ts
│   │   └── index.ts
│   ├── services/             # Business logic
│   │   ├── auth.service.ts
│   │   ├── riddle.service.ts
│   │   ├── cache.service.ts
│   │   ├── leaderboard.service.ts
│   │   └── stripe.service.ts
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   ├── app.ts                # Express app setup
│   └── server.ts             # Server entry point
└── package.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bergvlei

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PREMIUM_PRICE_ID=price_your_premium_subscription_price_id

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Set Up Database

Make sure PostgreSQL is running, then:

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view/edit data
npm run prisma:studio
```

### 4. Set Up Redis

Make sure Redis is running locally or use a cloud Redis service.

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Auth

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (authenticated)

#### Riddles

- `GET /api/riddles` - Get random riddle (authenticated)
- `POST /api/riddles/submit` - Submit riddle answer (authenticated)
- `GET /api/riddles/:riddleId/hint` - Get hint for riddle (authenticated)
- `GET /api/riddles/stats` - Get user statistics (authenticated)

#### Leaderboard

- `GET /api/leaderboard` - Get leaderboard (optional auth)
- `GET /api/leaderboard/rank` - Get user rank (authenticated)

#### Subscription

- `POST /api/subscription/checkout` - Create Stripe checkout session (authenticated)
- `POST /api/subscription/portal` - Create Stripe billing portal session (authenticated)
- `GET /api/subscription/status` - Get subscription status (authenticated)
- `POST /api/subscription/webhook` - Stripe webhook handler (Stripe only)

### Example Requests

#### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "username": "player1"
  }'
```

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

#### Get Riddle

```bash
curl -X GET "http://localhost:3000/api/riddles?difficulty=MEDIUM" \
  -H "Authorization: Bearer <your-token>"
```

#### Submit Answer

```bash
curl -X POST http://localhost:3000/api/riddles/submit \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "riddleId": "clx123456789",
    "answer": "The answer",
    "timeSpent": 45,
    "hintsUsed": 1
  }'
```

## Database Schema

### Key Models

- **User**: User accounts with subscription info
- **Subscription**: Stripe subscription data
- **Riddle**: AI-generated riddles
- **RiddleAttempt**: User attempts at solving riddles
- **UserStats**: Aggregate user statistics
- **DailyProgress**: Daily activity tracking
- **Leaderboard**: Leaderboard rankings

See `prisma/schema.prisma` for complete schema.

## Features

### Freemium Model

- Free users: 5 riddles per day with ads
- Premium users: Unlimited riddles, no ads, extra hints

### Rate Limiting

- API: 100 requests per 15 minutes
- Auth: 5 attempts per 15 minutes
- Riddles: 10 requests per minute

### Caching

Redis is used to cache:
- User profiles
- User statistics
- Daily riddle limits
- Leaderboards
- AI hints

### Leaderboards

Real-time leaderboards with Redis sorted sets:
- Daily
- Weekly
- Monthly
- All-time

## Stripe Integration

### Setup

1. Create a Stripe account
2. Get your API keys from Stripe Dashboard
3. Create a Premium subscription product
4. Configure webhook endpoint: `https://yourdomain.com/api/subscription/webhook`
5. Add webhook secret to `.env`

### Testing

Use Stripe test mode and test cards:
- Success: `4242 4242 4242 4242`
- Failure: `4000 0000 0000 0002`

## Deployment

### Option 1: Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Option 2: Vercel + External Database

1. Deploy API to Vercel
2. Use external PostgreSQL (Supabase, Neon, AWS RDS)
3. Use external Redis (Upstash, Redis Cloud)

### Option 3: Docker

```bash
# Build image
docker build -t bergvlei-backend .

# Run container
docker run -p 3000:3000 --env-file .env bergvlei-backend
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| NODE_ENV | Yes | Environment (development/production) |
| PORT | Yes | Server port |
| DATABASE_URL | Yes | PostgreSQL connection string |
| REDIS_URL | Yes | Redis connection string |
| JWT_SECRET | Yes | Secret for JWT signing (min 32 chars) |
| JWT_EXPIRES_IN | No | JWT expiration (default: 7d) |
| STRIPE_SECRET_KEY | Yes | Stripe API secret key |
| STRIPE_WEBHOOK_SECRET | Yes | Stripe webhook signing secret |
| STRIPE_PREMIUM_PRICE_ID | Yes | Stripe price ID for premium tier |
| GEMINI_API_KEY | Yes | Google Gemini API key |
| ALLOWED_ORIGINS | No | CORS allowed origins (comma-separated) |

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-04T12:00:00.000Z",
    "environment": "development"
  }
}
```

## License

ISC
