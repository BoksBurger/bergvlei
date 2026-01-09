import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  API_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  REVENUECAT_API_KEY: z.string(),
  REVENUECAT_WEBHOOK_AUTH_TOKEN: z.string().optional(),
  GEMINI_API_KEY: z.string(),

  ALLOWED_ORIGINS: z.string().default('http://localhost:19000,http://localhost:19001,http://localhost:19002,http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001'),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

export const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  apiUrl: env.API_URL,

  database: {
    url: env.DATABASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN as string | number,
  },

  revenueCat: {
    apiKey: env.REVENUECAT_API_KEY,
    webhookAuthToken: env.REVENUECAT_WEBHOOK_AUTH_TOKEN,
  },

  gemini: {
    apiKey: env.GEMINI_API_KEY,
  },

  cors: {
    allowedOrigins: env.ALLOWED_ORIGINS.split(','),
  },

  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },

  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
};
