// services/api-client.js
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/app-config');
const { ExternalAPIError, RateLimitError } = require('../config/errors/error-types');

/**
 * Create a retryable API client with advanced error handling
 * @param {Object} options - Configuration options
 * @returns {Object} - API client instance
 */
function createApiClient(options = {}) {
  const {
    baseURL,
    headers = {},
    timeout = 30000,
    maxRetries = 3,
    retryDelay = 1000,
    retryStatusCodes = [429, 500, 502, 503, 504],
    enableCircuitBreaker = true
  } = options;
  
  // Circuit breaker state
  let circuitState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  let failureCount = 0;
  let lastFailureTime = null;
  const FAILURE_THRESHOLD = 5;
  const CIRCUIT_TIMEOUT = 30000; // 30 seconds
  
  // Create axios instance with base configuration
  const instance = axios.create({
    baseURL,
    headers,
    timeout
  });
  
  // Track retry attempts
  instance.interceptors.request.use(config => {
    // Add retry count to request config
    config.retryCount = config.retryCount || 0;
    return config;
  });
  
  // Handle responses
  instance.interceptors.response.use(
    response => response,
    async error => {
      // Get the request configuration
      const { config } = error;
      
      // If no config, it's a client-side error (e.g. network error)
      if (!config) {
        return Promise.reject(new ExternalAPIError('Network error', { 
          originalError: error.message 
        }));
      }
      
      // Check if circuit breaker is open
      if (enableCircuitBreaker && circuitState === 'OPEN') {
        const currentTime = Date.now();
        if (currentTime - lastFailureTime > CIRCUIT_TIMEOUT) {
          // Move to half-open state
          circuitState = 'HALF_OPEN';
          logger.info('Circuit breaker moved to HALF_OPEN state');
        } else {
          return Promise.reject(
            new ServiceUnavailableError('Service temporarily unavailable (circuit open)', {
              service: baseURL,
              retryAfter: Math.floor((CIRCUIT_TIMEOUT - (currentTime - lastFailureTime)) / 1000)
            })
          );
        }
      }
      
      // Handle rate limiting specifically
      if (error.response && error.response.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after']) || 60;
        return Promise.reject(
          new RateLimitError('Rate limit exceeded', {
            retryAfter,
            service: baseURL
          })
        );
      }
      
      // Check if we should retry
      const shouldRetry = 
        config.retryCount < maxRetries && 
        (!error.response || retryStatusCodes.includes(error.response.status));
      
      if (shouldRetry) {
        // Increment retry count
        config.retryCount += 1;
        
        // Calculate delay with exponential backoff
        const delay = retryDelay * Math.pow(2, config.retryCount - 1);
        
        logger.warn(`Retrying request (${config.retryCount}/${maxRetries}) after ${delay}ms`, {
          url: config.url,
          method: config.method,
          status: error.response?.status
        });
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the request
        return instance(config);
      }
      
      // Handle circuit breaker state changes
      if (enableCircuitBreaker) {
        if (circuitState === 'HALF_OPEN') {
          // If request failed in half-open state, open the circuit again
          circuitState = 'OPEN';
          lastFailureTime = Date.now();
          logger.warn('Circuit breaker moved back to OPEN state after failed test request');
        } else if (circuitState === 'CLOSED') {
          // Increment failure count
          failureCount += 1;
          
          // Check if we should open the circuit
          if (failureCount >= FAILURE_THRESHOLD) {
            circuitState = 'OPEN';
            lastFailureTime = Date.now();
            logger.warn('Circuit breaker OPEN after multiple failures', { 
              failures: failureCount,
              service: baseURL 
            });
          }
        }
      }
      
      // Create appropriate error based on response
      if (error.response) {
        // Server responded with a status code outside of 2xx
        return Promise.reject(new ExternalAPIError(
          `API request failed with status ${error.response.status}`, {
            status: error.response.status,
            data: error.response.data,
            service: baseURL,
            url: config.url,
            method: config.method
          }
        ));
      } else if (error.request) {
        // Request was made but no response received
        return Promise.reject(new ExternalAPIError(
          'No response received from server', {
            service: baseURL,
            url: config.url,
            method: config.method
          }
        ));
      } else {
        // Error in request configuration
        return Promise.reject(new ExternalAPIError(
          'Error setting up request', {
            message: error.message,
            service: baseURL
          }
        ));
      }
    }
  );
  
  // Add circuit breaker reset method
  instance.resetCircuitBreaker = () => {
    circuitState = 'CLOSED';
    failureCount = 0;
    lastFailureTime = null;
    logger.info('Circuit breaker manually reset to CLOSED state');
  };
  
  // Add method to check circuit state
  instance.getCircuitState = () => ({
    state: circuitState,
    failureCount,
    lastFailureTime
  });
  
  return instance;
}

/**
 * Create an OpenRouter AI API client
 * @returns {Object} - Configured API client for OpenRouter
 */
function createOpenRouterClient() {
  const openrouterConfig = config.ai.openrouter;
  
  return createApiClient({
    baseURL: openrouterConfig.baseUrl,
    headers: {
      'Authorization': `Bearer ${openrouterConfig.apiKey}`,
      'HTTP-Referer': openrouterConfig.serviceUrl,
      'Content-Type': 'application/json'
    },
    timeout: openrouterConfig.timeout,
    maxRetries: 3,
    retryStatusCodes: [429, 500, 502, 503, 504],
    enableCircuitBreaker: true
  });
}

module.exports = {
  createApiClient,
  createOpenRouterClient
};
