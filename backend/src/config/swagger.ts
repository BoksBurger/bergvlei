import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bergvlei Backend API',
    version: '1.0.0',
    description: 'AI-powered riddle game backend API with authentication, gameplay, and subscription management',
    contact: {
      name: 'Bergvlei',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Development server',
    },
    {
      url: config.apiUrl,
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer {token}',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
              },
              code: {
                type: 'string',
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          username: {
            type: 'string',
          },
          isPremium: {
            type: 'boolean',
          },
          subscriptionTier: {
            type: 'string',
            enum: ['FREE', 'PREMIUM'],
          },
          riddlesPerDayLimit: {
            type: 'integer',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Riddle: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          question: {
            type: 'string',
          },
          answer: {
            type: 'string',
          },
          difficulty: {
            type: 'string',
            enum: ['EASY', 'MEDIUM', 'HARD'],
          },
          category: {
            type: 'string',
          },
          hints: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Subscription: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          userId: {
            type: 'string',
            format: 'uuid',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'CANCELED', 'EXPIRED', 'TRIAL'],
          },
          tier: {
            type: 'string',
            enum: ['FREE', 'PREMIUM'],
          },
          currentPeriodStart: {
            type: 'string',
            format: 'date-time',
          },
          currentPeriodEnd: {
            type: 'string',
            format: 'date-time',
          },
          cancelAtPeriodEnd: {
            type: 'boolean',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
    {
      name: 'Authentication',
      description: 'User authentication and registration',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Riddles',
      description: 'Riddle management and gameplay',
    },
    {
      name: 'Leaderboard',
      description: 'Leaderboard and rankings',
    },
    {
      name: 'Subscription',
      description: 'Subscription and payment management',
    },
  ],
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/server.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
