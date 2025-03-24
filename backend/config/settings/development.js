// config/settings/development.js
const base = require('./base');

/**
 * Development environment specific settings
 * These will override base settings in development environment
 */
module.exports = {
  ...base,
  
  logging: {
    ...base.logging,
    level: 'debug',
    format: 'console'
  },
  
  database: {
    ...base.database,
    logging: true
  },
  
  // Override any settings specific to development
  jobs: {
    ...base.jobs,
    defaultConcurrency: 1 // Reduce concurrency in development
  }
};
