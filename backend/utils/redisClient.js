// utils/redisClient.js
const Redis = require('ioredis');
const config = require('../config/config');
const logger = require('./logger');

// Redis client singleton
let redisClient = null;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Get Redis client instance
 * @returns {Promise<Redis>} Redis client
 */
async function getClient() {
  if (redisClient) {
    return redisClient;
  }
  
  // Create new Redis client
  redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    tls: config.redis.tls ? {} : undefined,
    db: config.redis.db || 0,
    maxRetriesPerRequest: 5,
    enableReadyCheck: true,
    retryStrategy: (times) => {
      connectionAttempts = times;
      
      if (times > MAX_RECONNECT_ATTEMPTS) {
        logger.error('Redis connection failed after maximum retry attempts');
        return null; // Stop retrying
      }
      
      const delay = Math.min(times * 500, 5000);
      logger.warn(`Redis connection attempt ${times} failed, retrying in ${delay}ms`);
      return delay;
    }
  });
  
  // Handle events
  redisClient.on('connect', () => {
    logger.info('Redis connected');
    connectionAttempts = 0;
  });
  
  redisClient.on('ready', () => {
    logger.info('Redis ready');
  });
  
  redisClient.on('error', (err) => {
    logger.error('Redis error', { error: err.message });
  });
  
  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
  });
  
  redisClient.on('reconnecting', () => {
    logger.warn('Redis reconnecting', { attempt: connectionAttempts });
  });
  
  // Wait for client to be ready
  try {
    await waitForRedisReady(redisClient);
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis client', { error: error.message });
    throw error;
  }
}

/**
 * Wait for Redis client to be ready
 * @param {Redis} client - Redis client
 * @returns {Promise<void>}
 */
function waitForRedisReady(client) {
  return new Promise((resolve, reject) => {
    if (client.status === 'ready') {
      return resolve();
    }
    
    const timeout = setTimeout(() => {
      client.removeListener('ready', handleReady);
      client.removeListener('error', handleError);
      reject(new Error('Redis connection timeout'));
    }, 10000);
    
    function handleReady() {
      clearTimeout(timeout);
      client.removeListener('error', handleError);
      resolve();
    }
    
    function handleError(err) {
      clearTimeout(timeout);
      client.removeListener('ready', handleReady);
      reject(err);
    }
    
    client.once('ready', handleReady);
    client.once('error', handleError);
  });
}

/**
 * Close Redis client connection
 * @returns {Promise<void>}
 */
async function closeConnection() {
  if (redisClient) {
    logger.info('Closing Redis connection');
    await redisClient.quit();
    redisClient = null;
  }
}

// Handle process exit
process.on('SIGTERM', async () => {
  await closeConnection();
});

process.on('SIGINT', async () => {
  await closeConnection();
});

module.exports = {
  getClient,
  closeConnection
};
