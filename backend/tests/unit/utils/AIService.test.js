// tests/unit/utils/AIService.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const { loadPromptTemplate } = require('../../../utils/promptManager');
const AIService = require('../../../utils/AIService');

describe('AIService', () => {
  let aiService;
  let mockAiClient;
  let promptManagerStub;
  
  beforeEach(() => {
    // Create a mock axios client for OpenRouter
    mockAiClient = {
      post: sinon.stub()
    };
    
    // Create an instance of AIService with the mock client
    aiService = new AIService(mockAiClient);
    
    // Stub the prompt manager
    promptManagerStub = sinon.stub(loadPromptTemplate);
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('generateProfileFromResume', () => {
    it('should call OpenRouter API with correct parameters', async () => {
      // Setup
      const resumeText = 'John Doe\nSoftware Engineer\nSkills: JavaScript, React, Node.js';
      const promptText = 'You are a professional profile generator';
      promptManagerStub.withArgs('profiler').resolves(promptText);
      
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Professional profile for John Doe'
              }
            }
          ]
        }
      };
      
      mockAiClient.post.resolves(mockResponse);
      
      // Act
      const result = await aiService.generateProfileFromResume(resumeText, { profilerModel: 'test-model' });
      
      // Assert
      expect(result).to.equal('Professional profile for John Doe');
      expect(mockAiClient.post.calledOnce).to.be.true;
      
      const postArgs = mockAiClient.post.firstCall.args;
      expect(postArgs[0]).to.equal('/chat/completions');
      expect(postArgs[1].model).to.equal('test-model');
      expect(postArgs[1].messages[0].role).to.equal('system');
      expect(postArgs[1].messages[0].content).to.equal(promptText);
      expect(postArgs[1].messages[1].role).to.equal('user');
      expect(postArgs[1].messages[1].content).to.equal(resumeText);
    });
    
    it('should use default model if not specified', async () => {
      // Setup
      const resumeText = 'Test resume content';
      promptManagerStub.resolves('Test prompt');
      
      mockAiClient.post.resolves({
        data: { choices: [{ message: { content: 'result' } }] }
      });
      
      process.env.DEFAULT_PROFILER_MODEL = 'default-test-model';
      
      // Act
      await aiService.generateProfileFromResume(resumeText);
      
      // Assert
      const postArgs = mockAiClient.post.firstCall.args;
      expect(postArgs[1].model).to.equal('default-test-model');
      
      // Clean up
      delete process.env.DEFAULT_PROFILER_MODEL;
    });
    
    it('should handle API errors gracefully', async () => {
      // Setup
      const resumeText = 'Test resume content';
      promptManagerStub.resolves('Test prompt');
      
      const errorResponse = {
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      };
      
      mockAiClient.post.rejects(errorResponse);
      
      // Act & Assert
      try {
        await aiService.generateProfileFromResume(resumeText);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to generate profile');
      }
    });
  });
  
  describe('analyzeJobDescription', () => {
    it('should call OpenRouter API with correct parameters', async () => {
      // Setup
      const jobText = 'We are looking for a Software Engineer...';
      const promptText = 'You are a job description analyzer';
      promptManagerStub.withArgs('researcher').resolves(promptText);
      
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Analysis of the job description'
              }
            }
          ]
        }
      };
      
      mockAiClient.post.resolves(mockResponse);
      
      // Act
      const result = await aiService.analyzeJobDescription(jobText, { researcherModel: 'test-model' });
      
      // Assert
      expect(result).to.equal('Analysis of the job description');
      expect(mockAiClient.post.calledOnce).to.be.true;
      
      const postArgs = mockAiClient.post.firstCall.args;
      expect(postArgs[0]).to.equal('/chat/completions');
      expect(postArgs[1].model).to.equal('test-model');
      expect(postArgs[1].messages[0].role).to.equal('system');
      expect(postArgs[1].messages[0].content).to.equal(promptText);
      expect(postArgs[1].messages[1].role).to.equal('user');
      expect(postArgs[1].messages[1].content).to.equal(jobText);
    });
  });
  
  describe('generateCustomizedResume', () => {
    it('should call OpenRouter API with correct parameters', async () => {
      // Setup
      const profileContent = 'Professional profile data';
      const researchContent = 'Job analysis data';
      const originalResume = 'Original resume content';
      const promptText = 'You are a resume customization expert';
      promptManagerStub.withArgs('resume-strategist').resolves(promptText);
      
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Customized resume content'
              }
            }
          ]
        }
      };
      
      mockAiClient.post.resolves(mockResponse);
      
      // Act
      const result = await aiService.generateCustomizedResume(
        profileContent, 
        researchContent, 
        originalResume, 
        { strategistModel: 'test-model' }
      );
      
      // Assert
      expect(result).to.equal('Customized resume content');
      expect(mockAiClient.post.calledOnce).to.be.true;
      
      const postArgs = mockAiClient.post.firstCall.args;
      expect(postArgs[0]).to.equal('/chat/completions');
      expect(postArgs[1].model).to.equal('test-model');
      expect(postArgs[1].messages[0].role).to.equal('system');
      expect(postArgs[1].messages[0].content).to.equal(promptText);
      expect(postArgs[1].messages[1].role).to.equal('user');
      expect(postArgs[1].messages[1].content).to.include(profileContent);
      expect(postArgs[1].messages[1].content).to.include(researchContent);
      expect(postArgs[1].messages[1].content).to.include(originalResume);
    });
  });
  
  describe('makeRequest', () => {
    it('should handle rate limit errors with appropriate message', async () => {
      // Setup
      const errorResponse = {
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' }
        }
      };
      
      mockAiClient.post.rejects(errorResponse);
      
      // Act & Assert
      try {
        await aiService.makeRequest('test-model', 'prompt', 'content');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Rate limit exceeded. Please try again later.');
      }
    });
    
    it('should handle authentication errors with appropriate message', async () => {
      // Setup
      const errorResponse = {
        response: {
          status: 401,
          data: { error: 'Invalid API key' }
        }
      };
      
      mockAiClient.post.rejects(errorResponse);
      
      // Act & Assert
      try {
        await aiService.makeRequest('test-model', 'prompt', 'content');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Authentication failed. Please check your API key.');
      }
    });
  });
});
