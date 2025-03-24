// config/errors/error-handler.js
const logger = require('../../utils/logger');
const { BaseError } = require('./error-types');

/**
 * Centralized error handling for the application
 */
class ErrorHandler {
  /**
   * Capture and log an error
   * @param {Error} error - The error to capture
   * @param {Object} context - Additional context information
   */
  captureError(error, context = {}) {
    // Add stack trace to the context
    const errorContext = {
      ...context,
      stack: error.stack,
      name: error.name,
      message: error.message
    };
    
    // Different logging based on error type
    if (error instanceof BaseError) {
      // This is an expected operational error
      if (error.isOperational) {
        logger.warn(error.message, {
          statusCode: error.statusCode,
          ...errorContext,
          ...error.context
        });
      } else {
        // Non-operational errors are more serious
        logger.error(error.message, {
          statusCode: error.statusCode,
          ...errorContext,
          ...error.context
        });
      }
    } else {
      // Unexpected error - log with full details
      logger.error('Unexpected error occurred', {
        ...errorContext
      });
    }
    
    // Here you could add integration with error monitoring services
    // like Sentry, New Relic, etc.
    // Example: this.sendToErrorMonitoring(error, context);
  }
  
  /**
   * Handle job processing errors
   * @param {Object} job - The job that failed
   * @param {Error} error - The error that occurred
   */
  handleJobError(job, error) {
    const jobInfo = {
      jobId: job.id,
      jobName: job.name,
      data: job.data,
      attemptsMade: job.attemptsMade
    };
    
    this.captureError(error, { jobInfo });
    
    // Determine if the job should be retried
    if (this.shouldRetryJob(error, job)) {
      logger.info(`Job will be retried`, { jobInfo });
      return true;
    }
    
    logger.error(`Job failed permanently`, { jobInfo });
    return false;
  }
  
  /**
   * Determine if a job should be retried
   * @param {Error} error - The error that occurred
   * @param {Object} job - The job that failed
   * @returns {boolean} - Whether the job should be retried
   */
  shouldRetryJob(error, job) {
    // Don't retry validation or parsing errors as they'll likely fail again
    if (error.name === 'ValidationError' || 
        error.name === 'ResumeParsingError') {
      return false;
    }
    
    // Always retry rate limit errors
    if (error.name === 'RateLimitError') {
      return true;
    }
    
    // Retry external API errors, but not too many times
    if (error.name === 'ExternalAPIError' && job.attemptsMade < 3) {
      return true;
    }
    
    // Default retry logic based on job attempts
    return job.attemptsMade < job.opts.attempts;
  }
  
  /**
   * Create a standardized API error response
   * @param {Error} error - The error to create a response for
   * @returns {Object} - Standardized error response
   */
  createErrorResponse(error) {
    // For operational errors, return specific status and message
    if (error instanceof BaseError) {
      return {
        status: 'error',
        statusCode: error.statusCode,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
      };
    }
    
    // For unexpected errors, return a generic message in production
    return {
      status: 'error',
      statusCode: 500,
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
    };
  }
  
  /**
   * Send error to external monitoring service
   * @private
   */
  /*
  sendToErrorMonitoring(error, context) {
    // Example integration with Sentry
    if (Sentry) {
      Sentry.withScope(scope => {
        Object.keys(context).forEach(key => {
          scope.setExtra(key, context[key]);
        });
        Sentry.captureException(error);
      });
    }
  }
  */
}

// Create singleton instance
const errorHandler = new ErrorHandler();

module.exports = errorHandler;
