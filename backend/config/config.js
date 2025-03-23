// config/config.js
require('dotenv').config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'resume_customizer_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
  },
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  
  // OpenRouter configuration
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '', // Using environment variable
    serviceUrl: process.env.SERVICE_URL || 'http://localhost:8080',
    defaultModels: {
      profiler: process.env.DEFAULT_PROFILER_MODEL || 'anthropic/claude-3-opus',
      researcher: process.env.DEFAULT_RESEARCHER_MODEL || 'anthropic/claude-3-opus',
      strategist: process.env.DEFAULT_STRATEGIST_MODEL || 'anthropic/claude-3-opus'
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
