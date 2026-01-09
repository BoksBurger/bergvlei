import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { config } from '../config/env';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check endpoint
 *     description: Returns the health status of the API server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-08T10:30:00.000Z
 *                     environment:
 *                       type: string
 *                       example: development
 *                     uptime:
 *                       type: number
 *                       description: Server uptime in seconds
 *                       example: 123.45
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.env,
      uptime: process.uptime(),
    },
  });
});

/**
 * @swagger
 * /health/db:
 *   get:
 *     summary: Database health check endpoint
 *     description: Tests the database connection and returns connection status with latency
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is healthy and connected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: connected
 *                     database:
 *                       type: string
 *                       example: PostgreSQL
 *                     latency:
 *                       type: number
 *                       description: Database query latency in milliseconds
 *                       example: 12.34
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-08T10:30:00.000Z
 *       500:
 *         description: Database connection failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Database health check failed
 *                     details:
 *                       type: string
 *                       example: Connection timeout
 */
router.get('/db', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Test database connection with a simple query
    await prisma.$queryRaw`SELECT 1 as result`;

    // Get database version info
    const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    const version = versionResult[0]?.version || 'Unknown';

    const latency = Date.now() - startTime;

    // Extract database type from version string
    const dbType = version.includes('PostgreSQL') ? 'PostgreSQL' : 'Unknown';

    res.json({
      success: true,
      data: {
        status: 'connected',
        database: dbType,
        latency: latency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'Database health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * @swagger
 * /health/full:
 *   get:
 *     summary: Full system health check
 *     description: Comprehensive health check including server, database, and system resources
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Full system health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     server:
 *                       type: object
 *                       properties:
 *                         environment:
 *                           type: string
 *                           example: development
 *                         uptime:
 *                           type: number
 *                           example: 123.45
 *                         nodeVersion:
 *                           type: string
 *                           example: v20.10.0
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: connected
 *                         type:
 *                           type: string
 *                           example: PostgreSQL
 *                         latency:
 *                           type: number
 *                           example: 12.34
 *                     memory:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: number
 *                           description: Used memory in MB
 *                           example: 45.67
 *                         total:
 *                           type: number
 *                           description: Total memory in MB
 *                           example: 512.00
 *       500:
 *         description: System health check failed
 */
router.get('/full', async (req: Request, res: Response) => {
  try {
    // Check database
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as result`;
    const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    const version = versionResult[0]?.version || 'Unknown';
    const dbLatency = Date.now() - dbStartTime;
    const dbType = version.includes('PostgreSQL') ? 'PostgreSQL' : 'Unknown';

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100;

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: {
          environment: config.env,
          uptime: process.uptime(),
          nodeVersion: process.version,
        },
        database: {
          status: 'connected',
          type: dbType,
          latency: dbLatency,
        },
        memory: {
          used: memoryUsedMB,
          total: memoryTotalMB,
          percentUsed: Math.round((memoryUsedMB / memoryTotalMB) * 100),
        },
      },
    });
  } catch (error) {
    console.error('Full health check failed:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
