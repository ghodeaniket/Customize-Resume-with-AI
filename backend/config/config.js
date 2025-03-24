// config/config.js
/**
 * Configuration module for the application
 * Uses environment variables with fallbacks to defaults
 * 
 * Required environment variables:
 * - OPENROUTER_API_KEY: API key for OpenRouter service
 * - SERVICE_URL: URL where the service is hosted
 * - DB_PASSWORD: Database password (in production)
 * 
 * Optional environment variables:
 * - PORT: Server port (default: 3000)
 * - NODE_ENV: Environment (development, test, production)
 * - DB_* variables: Database configuration
 * - REDIS_* variables: Redis configuration
 * - DEFAULT_*_MODEL variables: Default AI models to use
 * - LOG_LEVEL: Logging level
 */

require('dotenv').config();

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = [
    'OPENROUTER_API_KEY',
    'SERVICE_URL',
    'DB_PASSWORD'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(
    envVar => !process.env[envVar]
  );
  
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missingEnvVars.join(', ')}`
    );
  }
}

// Configuration object
const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'resume_customizer_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '5', 10),
      min: parseInt(process.env.DB_POOL_MIN || '0', 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10)
    },
    logging: process.env.DB_LOGGING === 'true'
  },
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined
  },
  
  // OpenRouter configuration
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '', 
    serviceUrl: process.env.SERVICE_URL || 'http://localhost:8080',
    defaultModels: {
      profiler: process.env.DEFAULT_PROFILER_MODEL || 'anthropic/claude-3-opus',
      researcher: process.env.DEFAULT_RESEARCHER_MODEL || 'anthropic/claude-3-opus',
      strategist: process.env.DEFAULT_STRATEGIST_MODEL || 'anthropic/claude-3-opus'
    },
    timeout: parseInt(process.env.AI_REQUEST_TIMEOUT || '60000', 10),
    retries: parseInt(process.env.AI_REQUEST_RETRIES || '2', 10)
  },
  
  // File storage configuration
  storage: {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedFormats: (process.env.ALLOWED_FORMATS || 'pdf,docx,html,txt,json').split(',')
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    logToFile: process.env.LOG_TO_FILE === 'true' || process.env.NODE_ENV === 'production',
    logDir: process.env.LOG_DIR || './logs'
  },
  
  // API configuration
  api: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '10', 10) // 10 requests per minute
  }
};

// Add environment-specific overrides
if (process.env.NODE_ENV === 'test') {
  // Test environment overrides
  config.database.name = 'resume_customizer_test';
  config.logging.level = 'error';
} else if (process.env.NODE_ENV === 'production') {
  // Production environment security checks
  if (!config.openrouter.apiKey) {
    throw new Error('OPENROUTER_API_KEY is required in production');
  }
  
  if (config.database.password === 'postgres') {
    throw new Error('Default database password should not be used in production');
  }
}

module.exports = config;
