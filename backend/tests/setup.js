// tests/setup.js
// Setup file for mocha tests
const mocha = require('mocha');
const { before, after } = mocha;

// Set test environment
process.env.NODE_ENV = 'test';

// Load environment variables from .env file
require('dotenv').config();

// Global test setup
before(function() {
  // Common setup for all tests
  console.log('Starting test suite...');
});

// Global test teardown
after(function() {
  // Clean up after all tests
  console.log('Test suite completed.');
});
