// utils/logger.js
const winston = require('winston');
const config = require('../config/config');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: logFormat,
  defaultMeta: { service: 'resume-customizer' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let metaStr = '';
          if (Object.keys(metadata).length > 0 && metadata.service) {
            metaStr = JSON.stringify(metadata);
          }
          return `${timestamp} ${level}: ${message} ${metaStr}`;
        })
      )
    })
  ]
});

// Add file transports in production
if (config.environment === 'production') {
  logger.add(new winston.transports.File({ 
    filename: path.join(logsDir, 'error.log'), 
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5
  }));
  
  logger.add(new winston.transports.File({ 
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 10485760, // 10MB
    maxFiles: 5
  }));
}

// Log uncaught exceptions and unhandled rejections
if (config.environment === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  );
  
  process.on('unhandledRejection', (ex) => {
    throw ex;
  });
}

module.exports = logger;
