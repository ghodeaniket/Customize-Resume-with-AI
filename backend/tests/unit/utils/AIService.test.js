// tests/unit/utils/AIService.test.js
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const AIService = require('../../../utils/AIService');
const promptManager = require('../../../utils/promptManager');
const logger = require('../../../utils/logger');

describe('AIService', () => {
  let aiService;
  let mockAxiosClient;
  let loadPromptTemplateStub;
  let loggerStub;
  
  beforeEach(() => {
    // Create mock axios client
    mockAxiosClient = {
      post: sinon.stub()
    };
    
    // Stub the loadPromptTemplate function
    loadPromptTemplateStub = sinon.stub(promptManager, 'loadPromptTemplate');
    loadPromptTemplateStub.resolves('mock prompt content');
    
    // Stub logger to avoid console output during tests
    loggerStub = sinon.stub(logger, 'error');
    
    // Create instance with mock client
    aiService = new AIService(mockAxiosClient);
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('generateProfileFromResume', () => {
    it('should call AI API with correct parameters and return profile content', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Generated profile content'
              }
            }
          ]
        }
      };
      mockAxiosClient.post.resolves(mockResponse);
      
      // Call the method
      const result = await aiService.generateProfileFromResume('Resume content', {
        profilerModel: 'test-model'
      });
      
      // Verify result
      expect(result).to.equal('Generated profile content');
      
      // Verify prompt template was loaded
      expect(loadPromptTemplateStub.calledWith('profiler')).to.be.true;
      
      // Verify API was called correctly
      expect(mockAxiosClient.post.calledOnce).to.be.true;
      
      const callArgs = mockAxiosClient.post.firstCall.args;
      expect(callArgs[0]).to.equal('/chat/completions');
      expect(callArgs[1].model).to.equal('test-model');
      expect(callArgs[1].messages[0].role).to.equal('system');
      expect(callArgs[1].messages[0].content).to.equal('mock prompt content');
      expect(callArgs[1].messages[1].role).to.equal('user');
      expect(callArgs[1].messages[1].content).to.equal('Resume content');
    });
    
    it('should use default model if not specified', async () => {
      // Setup environment variable for testing
      const originalEnv = process.env.DEFAULT_PROFILER_MODEL;
      process.env.DEFAULT_PROFILER_MODEL = 'default-test-model';
      
      // Setup mock response
      mockAxiosClient.post.resolves({
        data: {
          choices: [{ message: { content: 'Result' } }]
        }
      });
      
      // Call the method without specifying a model
      await aiService.generateProfileFromResume('Resume content');
      
      // Verify correct model was used
      const callArgs = mockAxiosClient.post.firstCall.args;
      expect(callArgs[1].model).to.equal('default-test-model');
      
      // Restore environment
      if (originalEnv) {
        process.env.DEFAULT_PROFILER_MODEL = originalEnv;
      } else {
        delete process.env.DEFAULT_PROFILER_MODEL;
      }
    });
    
    it('should handle API errors properly', async () => {
      // Setup mock error response
      const apiError = new Error('API Error');
      apiError.response = {
        status: 429,
        data: { error: 'Rate limit exceeded' }
      };
      
      mockAxiosClient.post.rejects(apiError);
      
      // Call the method and expect it to throw
      try {
        await aiService.generateProfileFromResume('Resume content');
        // If we get here, the test failed
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Verify error handling
        expect(error.message).to.include('Failed to generate profile');
        expect(loggerStub.calledOnce).to.be.true;
      }
    });
  });
  
  describe('analyzeJobDescription', () => {
    it('should call AI API with correct parameters and return analysis', async () => {
      // Setup mock response
      mockAxiosClient.post.resolves({
        data: {
          choices: [{ message: { content: 'Job analysis result' } }]
        }
      });
      
      // Call the method
      const result = await aiService.analyzeJobDescription('Job description text', {
        researcherModel: 'researcher-model'
      });
      
      // Verify result
      expect(result).to.equal('Job analysis result');
      
      // Verify prompt template was loaded
      expect(loadPromptTemplateStub.calledWith('researcher')).to.be.true;
      
      // Verify API was called correctly
      const callArgs = mockAxiosClient.post.firstCall.args;
      expect(callArgs[1].model).to.equal('researcher-model');
      expect(callArgs[1].messages[1].content).to.equal('Job description text');
    });
  });
  
  describe('generateCustomizedResume', () => {
    it('should combine inputs and call AI API correctly', async () => {
      // Setup mock response
      mockAxiosClient.post.resolves({
        data: {
          choices: [{ message: { content: 'Customized resume' } }]
        }
      });
      
      // Call the method
      const result = await aiService.generateCustomizedResume(
        'Profile content',
        'Research content',
        'Original resume',
        { strategistModel: 'strategist-model' }
      );
      
      // Verify result
      expect(result).to.equal('Customized resume');
      
      // Verify prompt template was loaded
      expect(loadPromptTemplateStub.calledWith('resume-strategist')).to.be.true;
      
      // Verify API was called correctly
      const callArgs = mockAxiosClient.post.firstCall.args;
      expect(callArgs[1].model).to.equal('strategist-model');
      expect(callArgs[1].messages[1].content).to.include('Profile content');
      expect(callArgs[1].messages[1].content).to.include('Research content');
      expect(callArgs[1].messages[1].content).to.include('Original resume');
    });
  });
  
  describe('makeRequest', () => {
    it('should handle authentication errors', async () => {
      // Setup mock error response
      const authError = new Error('Auth Error');
      authError.response = {
        status: 401,
        data: { error: 'Invalid API key' }
      };
      
      mockAxiosClient.post.rejects(authError);
      
      // Call the method and expect it to throw
      try {
        await aiService.makeRequest('model', 'prompt', 'content');
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Verify specific error message for auth failures
        expect(error.message).to.equal('Authentication failed. Please check your API key.');
      }
    });
    
    it('should handle rate limit errors', async () => {
      // Setup mock error response
      const rateLimitError = new Error('Rate Limit Error');
      rateLimitError.response = {
        status: 429,
        data: { error: 'Rate limit exceeded' }
      };
      
      mockAxiosClient.post.rejects(rateLimitError);
      
      // Call the method and expect it to throw
      try {
        await aiService.makeRequest('model', 'prompt', 'content');
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Verify specific error message for rate limiting
        expect(error.message).to.equal('Rate limit exceeded. Please try again later.');
      }
    });
    
    it('should handle general errors', async () => {
      // Setup mock error response without response object
      const generalError = new Error('General Error');
      
      mockAxiosClient.post.rejects(generalError);
      
      // Call the method and expect it to throw
      try {
        await aiService.makeRequest('model', 'prompt', 'content');
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Verify general error message
        expect(error.message).to.equal('AI processing failed: General Error');
      }
    });
  });
});
