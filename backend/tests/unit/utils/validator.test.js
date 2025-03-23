// tests/unit/utils/validator.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const Validator = require('../../../utils/validator');
const logger = require('../../../utils/logger');

describe('Validator', () => {
  let loggerStub;
  let mockRequest;
  let mockResponse;
  let mockNext;
  
  beforeEach(() => {
    // Stub logger
    loggerStub = sinon.stub(logger, 'debug');
    
    // Mock Express objects
    mockRequest = {};
    mockResponse = {};
    mockNext = sinon.stub();
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('validate', () => {
    it('should return validated data when valid', () => {
      const schema = {
        validate: sinon.stub().returns({
          error: null,
          value: { username: 'testUser', email: 'test@example.com' }
        })
      };
      
      const data = { username: 'testUser', email: 'test@example.com', extraField: 'should be removed' };
      const result = Validator.validate(data, schema);
      
      expect(result).to.deep.equal({ username: 'testUser', email: 'test@example.com' });
      expect(schema.validate.calledOnce).to.be.true;
      
      // Check if options were passed correctly
      const options = schema.validate.firstCall.args[1];
      expect(options.abortEarly).to.be.false;
      expect(options.stripUnknown).to.be.true;
    });
    
    it('should throw error with details when validation fails', () => {
      const schema = {
        validate: sinon.stub().returns({
          error: {
            details: [
              { message: 'Username is required', path: ['username'] },
              { message: 'Email must be valid', path: ['email'] }
            ]
          },
          value: {}
        })
      };
      
      const data = { email: 'invalid' };
      
      try {
        Validator.validate(data, schema);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.equal('Invalid request data');
        expect(error.details).to.be.an('array').with.lengthOf(2);
        expect(error.details[0].message).to.equal('Username is required');
        expect(error.details[1].message).to.equal('Email must be valid');
      }
    });
  });
  
  describe('validateBody', () => {
    it('should add validatedBody to request when valid', () => {
      const schema = {
        validate: sinon.stub().returns({
          error: null,
          value: { username: 'testUser' }
        })
      };
      
      mockRequest.body = { username: 'testUser', extraField: 'remove me' };
      
      const middleware = Validator.validateBody(schema);
      middleware(mockRequest, mockResponse, mockNext);
      
      expect(mockRequest.validatedBody).to.deep.equal({ username: 'testUser' });
      expect(mockNext.calledOnce).to.be.true;
      expect(mockNext.firstCall.args.length).to.equal(0); // No error passed
    });
    
    it('should call next with error when validation fails', () => {
      const schema = {
        validate: sinon.stub().returns({
          error: {
            details: [{ message: 'Username is required', path: ['username'] }]
          },
          value: {}
        })
      };
      
      mockRequest.body = { email: 'test@example.com' }; // Missing username
      
      const middleware = Validator.validateBody(schema);
      middleware(mockRequest, mockResponse, mockNext);
      
      expect(mockRequest.validatedBody).to.be.undefined;
      expect(mockNext.calledOnce).to.be.true;
      
      // Verify error was passed to next
      const error = mockNext.firstCall.args[0];
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.equal('Invalid request data');
    });
  });
  
  describe('validateParams', () => {
    it('should add validatedParams to request when valid', () => {
      const schema = {
        validate: sinon.stub().returns({
          error: null,
          value: { id: '123' }
        })
      };
      
      mockRequest.params = { id: '123' };
      
      const middleware = Validator.validateParams(schema);
      middleware(mockRequest, mockResponse, mockNext);
      
      expect(mockRequest.validatedParams).to.deep.equal({ id: '123' });
      expect(mockNext.calledOnce).to.be.true;
    });
    
    it('should call next with error when validation fails', () => {
      const schema = {
        validate: sinon.stub().returns({
          error: {
            details: [{ message: 'ID must be a string', path: ['id'] }]
          },
          value: {}
        })
      };
      
      mockRequest.params = { id: 123 }; // Number instead of string
      
      const middleware = Validator.validateParams(schema);
      middleware(mockRequest, mockResponse, mockNext);
      
      expect(mockRequest.validatedParams).to.be.undefined;
      expect(mockNext.calledOnce).to.be.true;
      
      // Verify error was passed to next
      const error = mockNext.firstCall.args[0];
      expect(error.statusCode).to.equal(400);
    });
  });
  
  describe('validateQuery', () => {
    it('should add validatedQuery to request when valid', () => {
      const schema = {
        validate: sinon.stub().returns({
          error: null,
          value: { page: 1, limit: 10 }
        })
      };
      
      mockRequest.query = { page: '1', limit: '10' };
      
      const middleware = Validator.validateQuery(schema);
      middleware(mockRequest, mockResponse, mockNext);
      
      expect(mockRequest.validatedQuery).to.deep.equal({ page: 1, limit: 10 });
      expect(mockNext.calledOnce).to.be.true;
    });
    
    it('should call next with error when validation fails', () => {
      const schema = {
        validate: sinon.stub().returns({
          error: {
            details: [{ message: 'Page must be a number', path: ['page'] }]
          },
          value: {}
        })
      };
      
      mockRequest.query = { page: 'invalid' };
      
      const middleware = Validator.validateQuery(schema);
      middleware(mockRequest, mockResponse, mockNext);
      
      expect(mockRequest.validatedQuery).to.be.undefined;
      expect(mockNext.calledOnce).to.be.true;
      
      // Verify error was passed to next
      const error = mockNext.firstCall.args[0];
      expect(error.statusCode).to.equal(400);
    });
  });
  
  describe('schema validation', () => {
    it('should validate resumeCustomization schema correctly', () => {
      const validData = {
        resumeContent: 'This is a valid resume content with sufficient length',
        jobDescription: 'This is a valid job description with sufficient length',
        resumeFormat: 'pdf',
        isJobDescriptionUrl: true
      };
      
      const result = Validator.schemas.resumeCustomization.validate(validData);
      expect(result.error).to.be.null;
      expect(result.value).to.deep.equal(validData);
    });
    
    it('should use default values when not provided', () => {
      const data = {
        resumeContent: 'Valid resume content',
        jobDescription: 'Valid job description'
      };
      
      const result = Validator.schemas.resumeCustomization.validate(data);
      expect(result.error).to.be.null;
      expect(result.value.resumeFormat).to.equal('text');
      expect(result.value.isJobDescriptionUrl).to.be.false;
    });
    
    it('should validate resumeFormat values', () => {
      const invalidData = {
        resumeContent: 'Valid resume content',
        jobDescription: 'Valid job description',
        resumeFormat: 'invalid-format' // Invalid format
      };
      
      const result = Validator.schemas.resumeCustomization.validate(invalidData);
      expect(result.error).to.not.be.null;
      
      const formatError = result.error.details.find(detail => 
        detail.path.includes('resumeFormat')
      );
      expect(formatError).to.exist;
    });
    
    it('should require jobId in jobStatus schema', () => {
      const validData = { jobId: '12345' };
      
      const result = Validator.schemas.jobStatus.validate(validData);
      expect(result.error).to.be.null;
      
      const invalidData = {};
      const invalidResult = Validator.schemas.jobStatus.validate(invalidData);
      expect(invalidResult.error).to.not.be.null;
    });
  });
});
