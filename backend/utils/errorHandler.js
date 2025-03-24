// utils/errorHandler.js
const logger = require('./logger');

/**
 * Centralized error handling utility
 */
class ErrorHandler {
  constructor() {
    this.errors = [];
    
    // Set up external error monitoring in production
    if (process.env.NODE_ENV === 'production') {
      // Initialize error monitoring service like Sentry if needed
      // this.initErrorMonitoring();
    }
  }
  
  /**
   * Capture and log an error with context
   * @param {Error} error - The error object
   * @param {Object} context - Additional context for the error
   * @returns {Error} - The original error
   */
  captureError(error, context = {}) {
    // Log the error
    logger.error(error.message, {
      stack: error.stack,
      ...context
    });
    
    // Store in memory for debugging
    this.errors.push({
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
      context
    });
    
    // Keep only the last 100 errors in memory
    if (this.errors.length > 100) {
      this.errors.shift();
    }
    
    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      // this.sendToMonitoringService(error, context);
    }
    
    return error;
  }
  
  /**
   * Get recent errors for debugging
   * @returns {Array} - Recent errors
   */
  getRecentErrors() {
    return this.errors;
  }
  
  /**
   * Create an API error response
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Object} details - Additional error details
   * @returns {Object} - Formatted error response
   */
  createApiError(message, statusCode = 500, details = {}) {
    return {
      status: 'error',
      message,
      statusCode,
      details: Object.keys(details).length > 0 ? details : undefined,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * API error middleware for Express
   */
  apiErrorMiddleware() {
    return (err, req, res, next) => {
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      
      // Log the error
      this.captureError(err, { 
        path: req.path, 
        method: req.method,
        body: req.body,
        statusCode 
      });
      
      // Send response to client
      res.status(statusCode).json(
        this.createApiError(message, statusCode, err.details)
      );
    };
  }
}

// Export singleton instance
module.exports = new ErrorHandler();
