// worker.js
require('dotenv').config();
const logger = require('./utils/logger');
const resumeQueue = require('./workers/resumeProcessor');

logger.info('Worker process started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing connections');
  await resumeQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing connections');
  await resumeQueue.close();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason });
});
