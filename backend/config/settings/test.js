// config/settings/test.js
const base = require('./base');

/**
 * Test environment specific settings
 * These will override base settings in test environment
 */
module.exports = {
  ...base,
  
  logging: {
    ...base.logging,
    level: 'error', // Minimize logging in tests
    format: 'console'
  },
  
  database: {
    ...base.database,
    database: 'resume_customizer_test',
    logging: false,
    pool: {
      ...base.database.pool,
      max: 5
    }
  },
  
  redis: {
    ...base.redis,
    // Use a different DB number for tests to avoid conflicts
    db: 1
  },
  
  // Reduce timeouts for faster tests
  jobs: {
    ...base.jobs,
    defaultConcurrency: 1,
    defaultTimeout: 10000, // 10 seconds for tests
    maxRetries: 0 // No retries in tests
  },
  
  auth: {
    ...base.auth,
    jwtSecret: 'test-jwt-secret',
    jwtExpiresIn: '1h'
  }
};
