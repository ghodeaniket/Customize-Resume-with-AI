// utils/errorHandler.js
const logger = require('./logger');
const config = require('../config/config');

/**
 * Error types for better categorization
 */
const ErrorTypes = {
  VALIDATION: 'ValidationError',
  AUTHENTICATION: 'AuthenticationError',
  AUTHORIZATION: 'AuthorizationError',
  RESOURCE_NOT_FOUND: 'ResourceNotFoundError',
  EXTERNAL_SERVICE: 'ExternalServiceError',
  DATABASE: 'DatabaseError',
  AI_SERVICE: 'AIServiceError',
  JOB_PROCESSING: 'JobProcessingError',
  FILE_PROCESSING: 'FileProcessingError',
  RATE_LIMIT: 'RateLimitError',
  INTERNAL: 'InternalServerError'
};

/**
 * Base application error class
 */
class AppError extends Error {
  constructor(message, type = ErrorTypes.INTERNAL, statusCode = 500, details = {}) {
    super(message);
    this.name = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    // Return a safe JSON representation of the error
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.safeSerialize(this.details),
      timestamp: this.timestamp,
      stack: config.app.environment === 'development' ? this.stack : undefined
    };
  }
  
  // Safely serialize objects to avoid circular references
  safeSerialize(obj) {
    try {
      const seen = new WeakSet();
      return JSON.parse(JSON.stringify(obj, (key, value) => {
        // Handle circular references
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
          
          // Handle request/response objects
          if (value.constructor && 
             (value.constructor.name === 'IncomingMessage' || 
              value.constructor.name === 'ClientRequest' ||
              value.constructor.name === 'ServerResponse')) {
            return `[${value.constructor.name}]`;
          }
        }
        return value;
      }));
    } catch (e) {
      // If serialization fails, return a simple object
      return { 
        serializationError: true,
        message: 'Error object could not be fully serialized'
      };
    }
  }
}

/**
 * Error handler middleware for Express
 */
function errorMiddleware(err, req, res, next) {
  let error = err;
  
  // Convert non-AppError instances to AppError
  if (!(err instanceof AppError)) {
    // Handle Sequelize errors
    if (err.name === 'SequelizeValidationError') {
      error = new AppError(
        'Validation error',
        ErrorTypes.VALIDATION,
        400,
        { errors: err.errors.map(e => ({ field: e.path, message: e.message })) }
      );
    } else if (err.name === 'SequelizeUniqueConstraintError') {
      error = new AppError(
        'Unique constraint violation',
        ErrorTypes.VALIDATION,
        400,
        { errors: err.errors.map(e => ({ field: e.path, message: e.message })) }
      );
    }
    // Handle other common errors
    else {
      error = new AppError(
        err.message || 'Internal server error',
        ErrorTypes.INTERNAL,
        err.statusCode || 500
      );
    }
  }
  
  // Log the error
  if (error.statusCode >= 500) {
    logger.error('Server error', { 
      error: error.toJSON(),
      requestId: req.id,
      url: req.originalUrl,
      method: req.method
    });
  } else {
    logger.warn('Client error', { 
      error: error.message || 'Unknown error',
      requestId: req.id,
      url: req.originalUrl,
      method: req.method
    });
  }
  
  // Send the response
  res.status(error.statusCode).json({
    status: 'error',
    message: error.message,
    code: error.statusCode,
    error: error.name,
    details: error.details,
    requestId: req.id,
    timestamp: error.timestamp
  });
}

/**
 * Capture and process errors in workers and background jobs
 */
function captureError(error, context = {}) {
  // Categorize the error if possible
  let errorType = ErrorTypes.INTERNAL;
  let statusCode = 500;
  
  if (error.name === 'AxiosError') {
    if (error.response?.status === 401 || error.response?.status === 403) {
      errorType = ErrorTypes.AUTHENTICATION;
      statusCode = error.response.status;
    } else if (error.response?.status === 404) {
      errorType = ErrorTypes.RESOURCE_NOT_FOUND;
      statusCode = 404;
    } else if (error.response?.status === 429) {
      errorType = ErrorTypes.RATE_LIMIT;
      statusCode = 429;
    } else {
      errorType = ErrorTypes.EXTERNAL_SERVICE;
      statusCode = error.response?.status || 500;
    }
  } else if (error.message?.includes('database') || error.name?.includes('Sequelize')) {
    errorType = ErrorTypes.DATABASE;
  } else if (error.message?.includes('job') || error.message?.includes('queue')) {
    errorType = ErrorTypes.JOB_PROCESSING;
  } else if (error.message?.includes('parse') || error.message?.includes('file')) {
    errorType = ErrorTypes.FILE_PROCESSING;
  } else if (error.message?.includes('AI') || error.message?.includes('model')) {
    errorType = ErrorTypes.AI_SERVICE;
  }
  
  // Create a standardized error with safe details
  const appError = new AppError(
    error.message,
    errorType,
    statusCode,
    {
      originalError: {
        name: error.name,
        message: error.message,
        code: error.code
      },
      context
    }
  );
  
  // Log the error with context
  logger.error('Error captured', {
    error: appError.message,
    type: errorType,
    stack: error.stack
  });
  
  // Return the processed error
  return appError;
}

/**
 * Create common error instances
 */
function createErrors() {
  return {
    validationError: (message, details) => new AppError(
      message || 'Validation error',
      ErrorTypes.VALIDATION,
      400,
      details
    ),
    
    authenticationError: (message, details) => new AppError(
      message || 'Authentication failed',
      ErrorTypes.AUTHENTICATION,
      401,
      details
    ),
    
    authorizationError: (message, details) => new AppError(
      message || 'Not authorized',
      ErrorTypes.AUTHORIZATION,
      403,
      details
    ),
    
    notFoundError: (message, details) => new AppError(
      message || 'Resource not found',
      ErrorTypes.RESOURCE_NOT_FOUND,
      404,
      details
    ),
    
    externalServiceError: (message, details) => new AppError(
      message || 'External service error',
      ErrorTypes.EXTERNAL_SERVICE,
      502,
      details
    ),
    
    databaseError: (message, details) => new AppError(
      message || 'Database operation failed',
      ErrorTypes.DATABASE,
      500,
      details
    ),
    
    aiServiceError: (message, details) => new AppError(
      message || 'AI service error',
      ErrorTypes.AI_SERVICE,
      502,
      details
    ),
    
    jobProcessingError: (message, details) => new AppError(
      message || 'Job processing failed',
      ErrorTypes.JOB_PROCESSING,
      500,
      details
    ),
    
    fileProcessingError: (message, details) => new AppError(
      message || 'File processing failed',
      ErrorTypes.FILE_PROCESSING,
      400,
      details
    ),
    
    rateLimitError: (message, details) => new AppError(
      message || 'Rate limit exceeded',
      ErrorTypes.RATE_LIMIT,
      429,
      details
    ),
    
    internalError: (message, details) => new AppError(
      message || 'Internal server error',
      ErrorTypes.INTERNAL,
      500,
      details
    )
  };
}

module.exports = {
  AppError,
  ErrorTypes,
  errorMiddleware,
  captureError,
  errors: createErrors()
};
