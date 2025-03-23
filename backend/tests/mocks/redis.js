// tests/mocks/redis.js
const sinon = require('sinon');

// Mock Redis client
const redisMock = {
  on: sinon.stub(),
  connect: sinon.stub().resolves(),
  disconnect: sinon.stub().resolves(),
  set: sinon.stub().resolves('OK'),
  get: sinon.stub().resolves(null),
  del: sinon.stub().resolves(1),
  keys: sinon.stub().resolves([]),
  flushall: sinon.stub().resolves('OK')
};

// Export mock
module.exports = function() {
  return redisMock;
};
