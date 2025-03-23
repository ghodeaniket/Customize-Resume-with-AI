// middleware/rateLimit.js
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Initialize Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

/**
 * Rate limiter middleware
 * @param {Object} options - Rate limiter options
 * @returns {Function} - Express middleware function
 */
function rateLimiter(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 10, // 10 requests per minute
    message = 'Too many requests, please try again later.'
  } = options;

  return async (req, res, next) => {
    try {
      // Use API key or IP address as identifier
      const identifier = req.user ? req.user.userId : req.ip;
      const key = `ratelimit:${identifier}`;
      
      // Get current count
      const current = await redisClient.get(key);
      
      if (current && parseInt(current) >= max) {
        return res.status(429).json({
          status: 'error',
          message
        });
      }
      
      // Increment count
      await redisClient.incr(key);
      
      // Set expiry if key is new
      if (!current) {
        await redisClient.expire(key, windowMs / 1000);
      }
      
      next();
    } catch (error) {
      logger.error('Rate limiting error', { error });
      // Allow request through if rate limiting fails
      next();
    }
  };
}

module.exports = rateLimiter;
