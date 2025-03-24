// config/settings/base.js
/**
 * Base configuration settings for the application
 * This file contains settings that are common to all environments
 */
module.exports = {
  app: {
    name: 'Resume Customizer',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    apiVersion: 'v1',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000']
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true'
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'resume_customizer',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      min: parseInt(process.env.DB_POOL_MIN || '0'),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000')
    }
  },
  
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    serviceUrl: process.env.SERVICE_URL || 'http://localhost:3000',
    timeout: parseInt(process.env.OPENROUTER_TIMEOUT || '60000'),
    defaultModels: {
      profiler: process.env.DEFAULT_PROFILER_MODEL || 'anthropic/claude-3-opus',
      researcher: process.env.DEFAULT_RESEARCHER_MODEL || 'anthropic/claude-3-opus',
      strategist: process.env.DEFAULT_STRATEGIST_MODEL || 'anthropic/claude-3-opus',
      formatter: process.env.DEFAULT_FORMATTER_MODEL || 'anthropic/claude-3-sonnet',
      factChecker: process.env.DEFAULT_FACTCHECKER_MODEL || 'anthropic/claude-3-haiku'
    }
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    directory: process.env.LOG_DIRECTORY || './logs',
    filename: process.env.LOG_FILENAME || 'app-%DATE%.log',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '14'),
    maxSize: process.env.LOG_MAX_SIZE || '20m'
  },
  
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    saltRounds: parseInt(process.env.SALT_ROUNDS || '10')
  },
  
  fileStorage: {
    provider: process.env.FILE_STORAGE_PROVIDER || 'local',
    local: {
      directory: process.env.FILE_STORAGE_LOCAL_DIR || './uploads'
    },
    s3: {
      accessKey: process.env.AWS_ACCESS_KEY_ID,
      secretKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION || 'us-east-1'
    }
  },
  
  // Job processing settings
  jobs: {
    defaultConcurrency: parseInt(process.env.JOB_CONCURRENCY || '3'),
    defaultTimeout: parseInt(process.env.JOB_TIMEOUT || '300000'),
    maxRetries: parseInt(process.env.JOB_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.JOB_RETRY_DELAY || '60000')
  }
};
