// config/settings/production.js
const base = require('./base');

/**
 * Production environment specific settings
 * These will override base settings in production environment
 */
module.exports = {
  ...base,
  
  logging: {
    ...base.logging,
    level: 'info',
    format: 'json'
  },
  
  database: {
    ...base.database,
    logging: false
  },
  
  // Enhance production-specific settings
  jobs: {
    ...base.jobs,
    defaultConcurrency: 5, // More concurrency in production
    defaultTimeout: 600000, // 10 minutes in production
  },
  
  // Additional security for production
  auth: {
    ...base.auth,
    saltRounds: 12
  },
  
  // Force TLS in production
  redis: {
    ...base.redis,
    tls: true
  }
};
