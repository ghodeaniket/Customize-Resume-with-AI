// utils/apiUtils.js
const axios = require('axios');
const logger = require('./logger');
const errorHandler = require('./errorHandler');
const config = require('../config/config');

/**
 * Circuit breaker state
 */
const circuitBreakers = {};

/**
 * Create a circuit breaker for API calls
 * @param {string} serviceName - Name of the service
 * @param {Object} options - Circuit breaker options
 * @returns {Object} - Circuit breaker instance
 */
function createCircuitBreaker(serviceName, options = {}) {
  // Default options
  const opts = {
    failureThreshold: options.failureThreshold || 5,
    resetTimeout: options.resetTimeout || 30000, // 30 seconds
    monitorInterval: options.monitorInterval || 5000, // 5 seconds
    ...options
  };
  
  // Create circuit breaker if it doesn't exist
  if (!circuitBreakers[serviceName]) {
    circuitBreakers[serviceName] = {
      state: 'CLOSED',
      failures: 0,
      lastFailure: null,
      lastSuccess: null,
      resetTimer: null,
      options: opts
    };
    
    // Start monitor
    startCircuitBreakerMonitor(serviceName);
  }
  
  return circuitBreakers[serviceName];
}

/**
 * Start a monitor for the circuit breaker
 * @param {string} serviceName - Name of the service
 */
function startCircuitBreakerMonitor(serviceName) {
  const cb = circuitBreakers[serviceName];
  
  // Reset monitor if it's already running
  if (cb.monitorInterval) {
    clearInterval(cb.monitorInterval);
  }
  
  // Create monitor interval
  cb.monitorInterval = setInterval(() => {
    // Check if circuit breaker should be reset
    if (cb.state === 'OPEN' && 
        cb.lastFailure && 
        Date.now() - cb.lastFailure > cb.options.resetTimeout) {
      // Move to half-open state
      cb.state = 'HALF-OPEN';
      logger.info(`Circuit breaker for ${serviceName} is now HALF-OPEN`);
    }
  }, cb.options.monitorInterval);
}

/**
 * Make a request with retry and circuit breaker
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Response data
 */
async function makeRequest(options) {
  const {
    serviceName = 'default',
    method = 'GET',
    url,
    data,
    headers = {},
    retries = 3,
    retryDelay = 1000,
    timeout = 30000,
    circuitBreakerOptions = {},
    validateStatus = null
  } = options;
  
  // Setup circuit breaker
  const circuitBreaker = createCircuitBreaker(serviceName, circuitBreakerOptions);
  
  // Check if circuit is open
  if (circuitBreaker.state === 'OPEN') {
    logger.warn(`Circuit is OPEN for ${serviceName}, request rejected`);
    throw errorHandler.errors.externalServiceError(
      `Service ${serviceName} is currently unavailable`,
      { circuit: 'OPEN' }
    );
  }
  
  // Try to make request with retries
  let lastError = null;
  let attempts = 0;
  
  while (attempts <= retries) {
    try {
      // Create axios request options
      const requestOptions = {
        method,
        url,
        data,
        headers,
        timeout,
        validateStatus
      };
      
      // Make request
      const response = await axios(requestOptions);
      
      // Update circuit breaker on success
      circuitBreaker.lastSuccess = Date.now();
      circuitBreaker.failures = 0;
      
      // If circuit was half-open, close it on success
      if (circuitBreaker.state === 'HALF-OPEN') {
        circuitBreaker.state = 'CLOSED';
        logger.info(`Circuit breaker for ${serviceName} is now CLOSED`);
      }
      
      return response.data;
    } catch (error) {
      lastError = error;
      attempts++;
      
      // Get status code if available
      const statusCode = error.response?.status;
      
      // Determine if this error should trigger a retry
      const shouldRetry = (
        // Only retry server errors or network errors
        (!statusCode || statusCode >= 500) &&
        // Don't retry if we've reached the limit
        attempts <= retries
      );
      
      // Log the error
      logger.warn(`Request to ${serviceName} failed (attempt ${attempts}/${retries + 1})`, {
        url,
        method,
        statusCode,
        errorMessage: error.message,
        willRetry: shouldRetry
      });
      
      if (shouldRetry) {
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempts - 1);
        logger.debug(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Update circuit breaker
        circuitBreaker.failures++;
        circuitBreaker.lastFailure = Date.now();
        
        // Open circuit if too many failures
        if (circuitBreaker.state === 'CLOSED' && 
            circuitBreaker.failures >= circuitBreaker.options.failureThreshold) {
          circuitBreaker.state = 'OPEN';
          logger.error(`Circuit breaker for ${serviceName} is now OPEN due to too many failures`);
          
          // Setup auto-reset
          if (circuitBreaker.resetTimer) {
            clearTimeout(circuitBreaker.resetTimer);
          }
          
          circuitBreaker.resetTimer = setTimeout(() => {
            circuitBreaker.state = 'HALF-OPEN';
            logger.info(`Circuit breaker for ${serviceName} is now HALF-OPEN`);
          }, circuitBreaker.options.resetTimeout);
        }
        
        break;
      }
    }
  }
  
  // If we get here, all retries failed
  const error = lastError || new Error(`Request to ${serviceName} failed after ${retries + 1} attempts`);
  
  // Enhance error with retry information
  error.attempts = attempts;
  error.serviceName = serviceName;
  
  // Convert to application error
  const appError = errorHandler.captureError(error, { serviceName, url, method });
  throw appError;
}

/**
 * Create a pre-configured API client
 * @param {string} baseURL - Base URL for requests
 * @param {Object} options - Client options
 * @returns {Object} - API client instance
 */
function createApiClient(baseURL, options = {}) {
  const {
    serviceName = baseURL.replace(/^https?:\/\//, '').split('.')[0],
    headers = {},
    retries = 3,
    retryDelay = 1000,
    timeout = 30000,
    circuitBreakerOptions = {}
  } = options;
  
  return {
    /**
     * Make GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} params - URL parameters
     * @param {Object} requestOptions - Additional options
     * @returns {Promise<Object>} - Response data
     */
    get: async (endpoint, params = {}, requestOptions = {}) => {
      const url = `${baseURL}${endpoint}`;
      
      return makeRequest({
        method: 'GET',
        url,
        params,
        headers,
        serviceName,
        retries,
        retryDelay,
        timeout,
        circuitBreakerOptions,
        ...requestOptions
      });
    },
    
    /**
     * Make POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     * @param {Object} requestOptions - Additional options
     * @returns {Promise<Object>} - Response data
     */
    post: async (endpoint, data = {}, requestOptions = {}) => {
      const url = `${baseURL}${endpoint}`;
      
      return makeRequest({
        method: 'POST',
        url,
        data,
        headers,
        serviceName,
        retries,
        retryDelay,
        timeout,
        circuitBreakerOptions,
        ...requestOptions
      });
    },
    
    /**
     * Make PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     * @param {Object} requestOptions - Additional options
     * @returns {Promise<Object>} - Response data
     */
    put: async (endpoint, data = {}, requestOptions = {}) => {
      const url = `${baseURL}${endpoint}`;
      
      return makeRequest({
        method: 'PUT',
        url,
        data,
        headers,
        serviceName,
        retries,
        retryDelay,
        timeout,
        circuitBreakerOptions,
        ...requestOptions
      });
    },
    
    /**
     * Make DELETE request
     * @param {string} endpoint - API endpoint
     * @param {Object} requestOptions - Additional options
     * @returns {Promise<Object>} - Response data
     */
    delete: async (endpoint, requestOptions = {}) => {
      const url = `${baseURL}${endpoint}`;
      
      return makeRequest({
        method: 'DELETE',
        url,
        headers,
        serviceName,
        retries,
        retryDelay,
        timeout,
        circuitBreakerOptions,
        ...requestOptions
      });
    }
  };
}

// Create pre-configured OpenRouter client
const openrouterClient = createApiClient('https://openrouter.ai/api/v1', {
  serviceName: 'openrouter',
  headers: {
    'Authorization': `Bearer ${config.openrouter.apiKey}`,
    'HTTP-Referer': config.openrouter.serviceUrl, 
    'Content-Type': 'application/json'
  },
  retries: 2,
  retryDelay: 2000,
  timeout: config.openrouter.timeout || 60000,
  circuitBreakerOptions: {
    failureThreshold: 5,
    resetTimeout: 60000 // 1 minute
  }
});

module.exports = {
  makeRequest,
  createApiClient,
  openrouterClient
};
