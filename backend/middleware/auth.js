// middleware/auth.js
const db = require('../models');
const logger = require('../utils/logger');

/**
 * Authenticate API requests with API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function authenticateApiKey(req, res, next) {
  try {
    // Get API key from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'API key is required'
      });
    }
    
    const apiKey = authHeader.split(' ')[1];
    
    // Find user with API key
    const user = await db.User.findOne({
      where: { apiKey }
    });
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid API key'
      });
    }
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    res.status(500).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
}

module.exports = {
  authenticateApiKey
};
