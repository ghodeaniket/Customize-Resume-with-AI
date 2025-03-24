// utils/logger.js
const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// Ensure logs directory exists
const logsDir = config.logging.directory || path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define common formats
const commonFormats = [
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat()
];

// Configure JSON format
const jsonFormat = winston.format.combine(
  ...commonFormats,
  winston.format.json()
);

// Configure console format
const consoleFormat = winston.format.combine(
  ...commonFormats,
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    // Remove service from metadata for cleaner output
    const { service, ...rest } = metadata;
    
    // Format metadata for display
    let metaStr = '';
    if (Object.keys(rest).length > 0) {
      // For error objects, handle specially
      if (rest.error && typeof rest.error === 'object') {
        if (rest.error.stack) {
          rest.error = `${rest.error.message} (${rest.error.name})`;
        }
      }
      
      metaStr = Object.keys(rest).length > 0 ? 
        `\n${JSON.stringify(rest, null, 2)}` : '';
    }
    
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Configure transports
const transports = [];

// Always add console transport in all environments
transports.push(new winston.transports.Console({
  format: consoleFormat
}));

// Add file transport for non-development environments
if (config.app.environment !== 'development') {
  // Use daily rotate file for better log management
  const fileTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, config.logging.filename || 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: config.logging.maxSize || '20m',
    maxFiles: config.logging.maxFiles || '14d',
    format: jsonFormat
  });
  
  transports.push(fileTransport);
  
  // Add separate error log
  const errorFileTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: config.logging.maxSize || '20m',
    maxFiles: config.logging.maxFiles || '14d',
    level: 'error',
    format: jsonFormat
  });
  
  transports.push(errorFileTransport);
}

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  defaultMeta: { 
    service: config.app.name,
    environment: config.app.environment
  },
  transports
});

// Add request ID context
logger.addRequestId = (req) => {
  return {
    ...logger,
    debug: (message, meta = {}) => logger.debug(message, { ...meta, requestId: req.id }),
    info: (message, meta = {}) => logger.info(message, { ...meta, requestId: req.id }),
    warn: (message, meta = {}) => logger.warn(message, { ...meta, requestId: req.id }),
    error: (message, meta = {}) => logger.error(message, { ...meta, requestId: req.id })
  };
};

// Log uncaught exceptions and unhandled rejections in production
if (config.app.environment === 'production') {
  // Exceptions
  const exceptionTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'exceptions-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: config.logging.maxSize || '20m',
    maxFiles: config.logging.maxFiles || '14d',
    format: jsonFormat
  });
  
  logger.exceptions.handle(exceptionTransport);
  
  // Unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason,
      promise
    });
    
    // In production, we might want to gracefully shutdown
    if (config.app.environment === 'production') {
      // Give logs time to write before exiting
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });
}

module.exports = logger;
