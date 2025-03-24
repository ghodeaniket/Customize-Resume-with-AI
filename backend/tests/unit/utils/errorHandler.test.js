// tests/unit/utils/errorHandler.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const errorHandler = require('../../../utils/errorHandler');
const logger = require('../../../utils/logger');

describe('errorHandler', () => {
  let loggerStub;
  let mockRequest;
  let mockResponse;
  let mockNext;
  
  beforeEach(() => {
    // Stub logger
    loggerStub = sinon.stub(logger, 'error');
    
    // Mock Express objects
    mockRequest = {
      path: '/api/test',
      method: 'GET',
      body: { test: 'data' }
    };
    
    mockResponse = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    
    mockNext = sinon.stub();
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('captureError', () => {
    it('should log the error with context', () => {
      const testError = new Error('Test error');
      const context = { userId: '123', operation: 'test' };
      
      errorHandler.captureError(testError, context);
      
      expect(loggerStub.calledOnce).to.be.true;
      expect(loggerStub.firstCall.args[0]).to.equal('Test error');
      expect(loggerStub.firstCall.args[1].stack).to.equal(testError.stack);
      expect(loggerStub.firstCall.args[1].userId).to.equal('123');
      expect(loggerStub.firstCall.args[1].operation).to.equal('test');
    });
    
    it('should store the error in memory', () => {
      const testError = new Error('Memory test error');
      errorHandler.captureError(testError);
      
      const recentErrors = errorHandler.getRecentErrors();
      expect(recentErrors.length).to.be.at.least(1);
      
      const lastError = recentErrors[recentErrors.length - 1];
      expect(lastError.message).to.equal('Memory test error');
      expect(lastError.stack).to.equal(testError.stack);
      expect(lastError.timestamp).to.be.instanceOf(Date);
    });
    
    it('should limit the number of errors stored in memory', () => {
      // Reset errors array
      errorHandler.errors = [];
      
      // Add 105 errors
      for (let i = 0; i < 105; i++) {
        errorHandler.captureError(new Error(`Error ${i}`));
      }
      
      const recentErrors = errorHandler.getRecentErrors();
      
      // Should only keep the last 100 errors
      expect(recentErrors.length).to.equal(100);
      
      // The first error should be Error 5 (lost errors 0-4)
      expect(recentErrors[0].message).to.equal('Error 5');
      
      // The last error should be Error 104
      expect(recentErrors[99].message).to.equal('Error 104');
    });
  });
  
  describe('createApiError', () => {
    it('should create an error response object with status code and message', () => {
      const result = errorHandler.createApiError('Test API error', 400);
      
      expect(result.status).to.equal('error');
      expect(result.message).to.equal('Test API error');
      expect(result.statusCode).to.equal(400);
      expect(result.timestamp).to.be.a('string');
      expect(result.details).to.be.undefined;
    });
    
    it('should include details if provided', () => {
      const details = { field: 'username', reason: 'required' };
      const result = errorHandler.createApiError('Validation error', 400, details);
      
      expect(result.details).to.deep.equal(details);
    });
    
    it('should use default status code if not provided', () => {
      const result = errorHandler.createApiError('Server error');
      expect(result.statusCode).to.equal(500);
    });
  });
  
  describe('apiErrorMiddleware', () => {
    it('should send error response with correct status and details', () => {
      const middleware = errorHandler.apiErrorMiddleware();
      const testError = {
        message: 'Middleware test error',
        statusCode: 403,
        details: { reason: 'forbidden' }
      };
      
      middleware(testError, mockRequest, mockResponse, mockNext);
      
      expect(mockResponse.status.calledWith(403)).to.be.true;
      expect(mockResponse.json.calledOnce).to.be.true;
      
      const responseData = mockResponse.json.firstCall.args[0];
      expect(responseData.status).to.equal('error');
      expect(responseData.message).to.equal('Middleware test error');
      expect(responseData.details).to.deep.equal({ reason: 'forbidden' });
    });
    
    it('should use default values for missing error properties', () => {
      const middleware = errorHandler.apiErrorMiddleware();
      const testError = new Error(); // No message or status code
      
      middleware(testError, mockRequest, mockResponse, mockNext);
      
      expect(mockResponse.status.calledWith(500)).to.be.true;
      
      const responseData = mockResponse.json.firstCall.args[0];
      expect(responseData.message).to.equal('Internal Server Error');
    });
    
    it('should log the error with request context', () => {
      const middleware = errorHandler.apiErrorMiddleware();
      const testError = new Error('API error');
      
      middleware(testError, mockRequest, mockResponse, mockNext);
      
      expect(loggerStub.calledOnce).to.be.true;
      expect(loggerStub.firstCall.args[1].path).to.equal('/api/test');
      expect(loggerStub.firstCall.args[1].method).to.equal('GET');
      expect(loggerStub.firstCall.args[1].body).to.deep.equal({ test: 'data' });
    });
  });
});
