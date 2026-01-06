import app from './app';
import { config } from './config/env';

const startServer = async () => {
  try {
    const server = app.listen(config.port, () => {
      console.log(`
┌─────────────────────────────────────────┐
│  Bergvlei Backend API                   │
│  Environment: ${config.env.padEnd(28)}│
│  Port: ${config.port.toString().padEnd(33)}│
│  URL: ${config.apiUrl.padEnd(34)}│
└─────────────────────────────────────────┘
      `);
    });

    const shutdown = async () => {
      console.log('\nShutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
