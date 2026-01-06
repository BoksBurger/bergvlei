# Bergvlei API Reference

Complete API documentation for the Bergvlei backend.

## Base URL

```
Production: https://api.bergvlei.com/api
Development: http://localhost:3000/api
```

## Authentication

Most endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Response Format

All responses follow this structure:

```typescript
{
  success: boolean;
  data?: any;
  error?: {
    message: string;
    code?: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

## Endpoints

### Authentication

#### Register User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "player1"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123",
      "email": "user@example.com",
      "username": "player1",
      "subscriptionTier": "FREE",
      "isPremium": false,
      "createdAt": "2024-01-04T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123",
      "email": "user@example.com",
      "username": "player1",
      "subscriptionTier": "FREE",
      "isPremium": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Profile

```http
GET /api/auth/profile
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123",
      "email": "user@example.com",
      "username": "player1",
      "subscriptionTier": "FREE",
      "isPremium": false,
      "riddlesPerDayLimit": 5,
      "riddlesTodayCount": 2,
      "totalRiddlesSolved": 42,
      "currentStreak": 5,
      "longestStreak": 12,
      "createdAt": "2024-01-04T12:00:00.000Z"
    }
  }
}
```

---

### Riddles

#### Get Random Riddle

```http
GET /api/riddles?difficulty=MEDIUM
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `difficulty` (optional): `EASY`, `MEDIUM`, `HARD`, `EXPERT`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "riddle": {
      "id": "clx456",
      "question": "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
      "difficulty": "MEDIUM",
      "category": "Nature",
      "hintsAvailable": 3
    }
  }
}
```

**Errors:**
- `403` - Daily riddle limit reached (free users)
- `404` - No riddles available for difficulty

#### Submit Answer

```http
POST /api/riddles/submit
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "riddleId": "clx456",
  "answer": "An echo",
  "timeSpent": 45,
  "hintsUsed": 1
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "correct": true,
    "answer": "An echo",
    "message": "Correct! Well done!"
  }
}
```

#### Get Hint

```http
GET /api/riddles/:riddleId/hint?hintNumber=0
```

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `riddleId`: Riddle ID

**Query Parameters:**
- `hintNumber`: Hint index (0-based)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "hint": "Think about sounds in nature",
    "hintNumber": 0,
    "totalHints": 3
  }
}
```

**Errors:**
- `403` - Premium required for hints beyond first (free users)
- `400` - Invalid hint number

#### Get User Stats

```http
GET /api/riddles/stats
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalRiddlesSolved": 42,
      "totalAttempts": 58,
      "totalHintsUsed": 12,
      "totalTimeSpent": 3600,
      "easyRiddlesSolved": 15,
      "mediumRiddlesSolved": 20,
      "hardRiddlesSolved": 6,
      "expertRiddlesSolved": 1,
      "averageTime": 62.5,
      "accuracy": 72.4,
      "currentStreak": 5,
      "longestStreak": 12
    }
  }
}
```

---

### Leaderboard

#### Get Leaderboard

```http
GET /api/leaderboard?period=daily&limit=100
```

**Query Parameters:**
- `period` (optional): `daily`, `weekly`, `monthly`, `alltime` (default: `daily`)
- `limit` (optional): Number of results (default: 100)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "userId": "clx123",
        "username": "player1",
        "score": 156,
        "riddlesSolved": 156,
        "averageTime": 45.2,
        "rank": 1
      },
      {
        "userId": "clx124",
        "username": "player2",
        "score": 142,
        "riddlesSolved": 142,
        "rank": 2
      }
    ]
  }
}
```

#### Get User Rank

```http
GET /api/leaderboard/rank?period=daily
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period` (optional): `daily`, `weekly`, `monthly`, `alltime` (default: `daily`)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "rank": 42
  }
}
```

---

### Subscription

#### Create Checkout Session

```http
POST /api/subscription/checkout
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_abc123",
    "url": "https://checkout.stripe.com/pay/cs_test_abc123"
  }
}
```

**Usage:**
Redirect user to the returned `url` to complete payment.

#### Create Portal Session

```http
POST /api/subscription/portal
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/abc123"
  }
}
```

**Usage:**
Redirect user to the returned `url` to manage their subscription.

#### Get Subscription Status

```http
GET /api/subscription/status
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "clx789",
      "userId": "clx123",
      "status": "ACTIVE",
      "tier": "PREMIUM",
      "currentPeriodStart": "2024-01-01T00:00:00.000Z",
      "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
      "cancelAtPeriodEnd": false
    },
    "isPremium": true,
    "tier": "PREMIUM",
    "riddlesPerDayLimit": 999999
  }
}
```

#### Stripe Webhook

```http
POST /api/subscription/webhook
```

**Headers:**
- `stripe-signature`: Stripe webhook signature

**Request Body:** Raw Stripe event JSON

**Response:** `200 OK`
```json
{
  "received": true
}
```

**Note:** This endpoint is called by Stripe, not by clients.

---

## Error Codes

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions or limits reached |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| All API endpoints | 100 requests / 15 minutes |
| Auth (login/register) | 5 requests / 15 minutes |
| Riddles | 10 requests / 1 minute |

## Subscription Tiers

| Tier | Riddles/Day | Hints | Ads |
|------|-------------|-------|-----|
| FREE | 5 | First hint only | Yes |
| PREMIUM | Unlimited | All hints | No |

## WebSocket Support

Coming soon for real-time features:
- Live leaderboard updates
- Multiplayer riddles
- Real-time notifications

## SDK/Client Libraries

Coming soon:
- JavaScript/TypeScript SDK
- React Native SDK
- Swift SDK
- Kotlin SDK
