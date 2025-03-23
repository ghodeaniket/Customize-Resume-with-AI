// tests/index.test.js
/**
 * Main test runner file to ensure all tests are properly included
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Common test includes
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');

// Base tests to ensure the test framework is working
describe('Test framework', () => {
  it('should be correctly set up', () => {
    expect(true).to.be.true;
  });
  
  it('should have chai assertions working', () => {
    expect({ a: 1 }).to.deep.equal({ a: 1 });
    expect([1, 2, 3]).to.have.lengthOf(3);
    expect('test string').to.be.a('string').and.have.lengthOf(11);
  });
  
  it('should have sinon working', () => {
    const stub = sinon.stub().returns(42);
    expect(stub()).to.equal(42);
    expect(stub.calledOnce).to.be.true;
  });
});

// Basic app test
describe('Application', () => {
  it('should load without errors', () => {
    // This will throw if there's a syntax error in app.js
    const app = require('../app');
    expect(app).to.exist;
  });
});
