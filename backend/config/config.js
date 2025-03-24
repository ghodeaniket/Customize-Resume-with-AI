// config/config.js
require('dotenv').config();

/**
 * Configuration loader
 * Loads environment-specific settings
 */

// Get the current environment
const env = process.env.NODE_ENV || 'development';

// Available environments
const environments = ['development', 'test', 'production'];

// Validate environment
if (!environments.includes(env)) {
  console.warn(`Unknown environment: ${env}, fallback to development`);
}

try {
  // Try to load environment-specific configuration
  const config = require(`./settings/${env}`);
  
  // Validate the loaded configuration
  validateConfig(config);
  
  module.exports = config;
} catch (error) {
  console.error(`Failed to load configuration for '${env}' environment:`, error.message);
  console.warn('Falling back to base configuration');
  
  try {
    // Fallback to base configuration
    const baseConfig = require('./settings/base');
    module.exports = baseConfig;
  } catch (fallbackError) {
    console.error('Critical error loading configuration:', fallbackError.message);
    console.error('Application cannot start without valid configuration');
    process.exit(1);
  }
}

/**
 * Validate the configuration
 * @param {Object} config - The configuration to validate
 */
function validateConfig(config) {
  // Validate required configuration sections
  const requiredSections = ['app', 'redis', 'database', 'openrouter', 'logging', 'auth', 'jobs'];
  
  for (const section of requiredSections) {
    if (!config[section]) {
      throw new Error(`Missing required configuration section: ${section}`);
    }
  }
  
  // Validate critical settings
  if (!config.openrouter.apiKey && process.env.NODE_ENV === 'production') {
    console.error('OpenRouter API key is missing in production environment!');
  }
  
  if (!config.auth.jwtSecret || config.auth.jwtSecret === 'your-super-secret-jwt-key') {
    console.warn('Using default JWT secret. This is insecure for production!');
  }
}
