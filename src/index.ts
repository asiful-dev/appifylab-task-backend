import app from './app.js';
import { env } from './config/env.js';

/**
 * Start the server
 */
const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}\nAPI Docs available at http://localhost:${PORT}/api-docs \nAPI Spec available at http://localhost:${PORT}/api-docs.json
  `);
});

/**
 * Graceful shutdown handler
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

/**
 * Uncaught errors handler
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
