// config/errors/error-types.js
/**
 * Custom error types for better error handling and classification
 */

class BaseError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode || 500;
    this.isOperational = options.isOperational || true;
    this.context = options.context || {};
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends BaseError {
  constructor(message, context = {}) {
    super(message, { 
      statusCode: 400, 
      isOperational: true,
      context
    });
  }
}

class NotFoundError extends BaseError {
  constructor(message, context = {}) {
    super(message, { 
      statusCode: 404, 
      isOperational: true,
      context
    });
  }
}

class AuthenticationError extends BaseError {
  constructor(message, context = {}) {
    super(message, { 
      statusCode: 401, 
      isOperational: true,
      context
    });
  }
}

class AuthorizationError extends BaseError {
  constructor(message, context = {}) {
    super(message, { 
      statusCode: 403, 
      isOperational: true,
      context
    });
  }
}

class ServiceUnavailableError extends BaseError {
  constructor(message, context = {}) {
    super(message, { 
      statusCode: 503, 
      isOperational: true,
      context
    });
  }
}

class ExternalAPIError extends BaseError {
  constructor(message, context = {}) {
    super(message, { 
      statusCode: 502, 
      isOperational: true,
      context
    });
  }
}

class RateLimitError extends BaseError {
  constructor(message, context = {}) {
    super(message, { 
      statusCode: 429, 
      isOperational: true,
      context,
      retryAfter: context.retryAfter
    });
  }
}

class ResumeParsingError extends BaseError {
  constructor(message, context = {}) {
    super(message, { 
      statusCode: 422, 
      isOperational: true,
      context
    });
  }
}

class JobScrapingError extends BaseError {
  constructor(message, context = {}) {
    super(message, { 
      statusCode: 422, 
      isOperational: true,
      context
    });
  }
}

class AIProcessingError extends BaseError {
  constructor(message, context = {}) {
    super(message, { 
      statusCode: 500, 
      isOperational: true,
      context
    });
  }
}

module.exports = {
  BaseError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ServiceUnavailableError,
  ExternalAPIError,
  RateLimitError,
  ResumeParsingError,
  JobScrapingError,
  AIProcessingError
};
