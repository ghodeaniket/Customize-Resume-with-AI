// tests/unit/utils/FactVerification.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const AIService = require('../../../utils/AIService');
const promptManager = require('../../../utils/promptManager');
const logger = require('../../../utils/logger');

describe('Fact Verification Functions', () => {
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
    loggerStub = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub()
    };
    sinon.stub(logger, 'info').callsFake(loggerStub.info);
    sinon.stub(logger, 'warn').callsFake(loggerStub.warn);
    sinon.stub(logger, 'error').callsFake(loggerStub.error);
    
    // Create instance with mock client
    aiService = new AIService(mockAxiosClient);
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('extractFactualInformation', () => {
    it('should extract factual information from resume content', async () => {
      // Mock resume content
      const resumeContent = `
John Doe
Software Engineer
john.doe@example.com | (123) 456-7890

EXPERIENCE
Senior Developer, ABC Tech Inc., 2018-Present
- Led development of cloud applications
- Managed team of 5 engineers

Junior Developer, XYZ Solutions, 2015-2018
- Developed web applications

EDUCATION
Computer Science, B.S., University of Technology, 2015
`;

      // Mock extracted facts (JSON response)
      const mockExtractedFacts = {
        personalInfo: {
          name: "John Doe",
          contact: {
            email: "john.doe@example.com",
            phone: "(123) 456-7890"
          }
        },
        workExperience: [
          {
            company: "ABC Tech Inc.",
            title: "Senior Developer",
            startDate: "2018",
            endDate: "Present"
          },
          {
            company: "XYZ Solutions",
            title: "Junior Developer",
            startDate: "2015",
            endDate: "2018"
          }
        ],
        education: [
          {
            institution: "University of Technology",
            degree: "B.S., Computer Science",
            endDate: "2015"
          }
        ]
      };

      // Setup API response
      mockAxiosClient.post.resolves({
        data: {
          choices: [{ message: { content: JSON.stringify(mockExtractedFacts) } }]
        }
      });

      // Call the method
      const result = await aiService.extractFactualInformation(resumeContent);

      // Verify result
      expect(result).to.deep.equal(mockExtractedFacts);
      
      // Verify prompt template was loaded
      expect(loadPromptTemplateStub.calledWith('fact-extractor')).to.be.true;
      
      // Verify AI API was called with the correct parameters
      expect(mockAxiosClient.post.calledOnce).to.be.true;
      
      const callArgs = mockAxiosClient.post.firstCall.args;
      expect(callArgs[1].model).to.equal('anthropic/claude-3-haiku');
      expect(callArgs[1].temperature).to.equal(0.1);
      expect(callArgs[1].messages[1].content).to.equal(resumeContent);
    });
    
    it('should handle non-JSON responses gracefully', async () => {
      // Mock non-JSON response
      const textResponse = `
Personal Info:
Name: John Doe
Email: john.doe@example.com
Phone: (123) 456-7890

Work Experience:
- Senior Developer at ABC Tech Inc. (2018-Present)
- Junior Developer at XYZ Solutions (2015-2018)

Education:
- B.S. in Computer Science, University of Technology (2015)
`;

      // Setup API response with text instead of JSON
      mockAxiosClient.post.resolves({
        data: {
          choices: [{ message: { content: textResponse } }]
        }
      });

      // Call the method
      const result = await aiService.extractFactualInformation("Some resume content");

      // Verify result contains the raw text
      expect(result).to.have.property('rawFactualData');
      expect(result.rawFactualData).to.equal(textResponse);
      
      // Verify warning was logged
      expect(loggerStub.warn.calledOnce).to.be.true;
      expect(loggerStub.warn.firstCall.args[0]).to.include('non-JSON response');
    });
    
    it('should handle extraction errors without failing the process', async () => {
      // Setup API error
      mockAxiosClient.post.rejects(new Error('API Error'));

      // Call the method
      const result = await aiService.extractFactualInformation("Some resume content");

      // Verify empty object is returned
      expect(result).to.deep.equal({});
      
      // Verify error was logged
      expect(loggerStub.error.calledOnce).to.be.true;
      expect(loggerStub.error.firstCall.args[0]).to.equal('Fact extraction failed');
    });
  });
  
  describe('verifyFactualInformation', () => {
    it('should verify and correct facts in generated resume', async () => {
      // Setup factual info
      const factualInfo = {
        personalInfo: {
          name: "John Doe",
          contact: { email: "john.doe@example.com" }
        },
        workExperience: [
          {
            company: "ABC Tech Inc.",
            title: "Senior Developer",
            startDate: "2018",
            endDate: "Present"
          }
        ]
      };
      
      // Setup generated resume
      const generatedResume = `
John Smith
Software Engineer
john.smith@example.com

EXPERIENCE
Lead Developer, ABC Technology Inc., 2017-Present
...
`;

      // Setup corrected resume
      const correctedResume = `
John Doe
Software Engineer
john.doe@example.com

EXPERIENCE
Senior Developer, ABC Tech Inc., 2018-Present
...
`;

      // Setup API response
      mockAxiosClient.post.resolves({
        data: {
          choices: [{ message: { content: correctedResume } }]
        }
      });

      // Call the method
      const result = await aiService.verifyFactualInformation(generatedResume, factualInfo);

      // Verify result
      expect(result).to.equal(correctedResume);
      
      // Verify prompt template was loaded
      expect(loadPromptTemplateStub.calledWith('fact-verifier')).to.be.true;
      
      // Verify AI API was called with the correct parameters
      expect(mockAxiosClient.post.calledOnce).to.be.true;
      
      const callArgs = mockAxiosClient.post.firstCall.args;
      expect(callArgs[1].model).to.equal('anthropic/claude-3-7-sonnet');
      expect(callArgs[1].temperature).to.equal(0.2);
      expect(callArgs[1].messages[0].content).to.include(JSON.stringify(factualInfo));
      expect(callArgs[1].messages[0].content).to.include(generatedResume);
    });
    
    it('should return original resume if factual info is empty', async () => {
      const generatedResume = "Some generated resume content";
      
      // Call the method with empty factual info
      const result = await aiService.verifyFactualInformation(generatedResume, {});

      // Original resume should be returned without API call
      expect(result).to.equal(generatedResume);
      expect(mockAxiosClient.post.called).to.be.false;
    });
    
    it('should handle verification errors by returning original resume', async () => {
      // Setup factual info
      const factualInfo = { personalInfo: { name: "John Doe" } };
      
      // Setup generated resume
      const generatedResume = "Some generated resume content";
      
      // Setup API error
      mockAxiosClient.post.rejects(new Error('Verification Error'));

      // Call the method
      const result = await aiService.verifyFactualInformation(generatedResume, factualInfo);

      // Original resume should be returned
      expect(result).to.equal(generatedResume);
      
      // Verify error was logged
      expect(loggerStub.error.calledOnce).to.be.true;
      expect(loggerStub.error.firstCall.args[0]).to.equal('Resume verification failed');
    });
  });
  
  describe('generateCustomizedResume with fact checking', () => {
    it('should extract facts, generate resume, and verify facts', async () => {
      // Setup stubs for the extraction and verification methods
      const extractStub = sinon.stub(aiService, 'extractFactualInformation').resolves({
        personalInfo: { name: "John Doe" }
      });
      
      const makeRequestStub = sinon.stub(aiService, 'makeRequest').resolves('Customized resume content');
      
      const verifyStub = sinon.stub(aiService, 'verifyFactualInformation').resolves('Verified resume content');
      
      // Call the method
      const result = await aiService.generateCustomizedResume(
        'Profile content',
        'Research content',
        'Original resume',
        { strategistModel: 'test-model' }
      );
      
      // Verify the full flow
      expect(extractStub.calledOnce).to.be.true;
      expect(extractStub.calledWith('Original resume')).to.be.true;
      
      expect(makeRequestStub.calledOnce).to.be.true;
      expect(makeRequestStub.firstCall.args[0]).to.equal('test-model');
      expect(makeRequestStub.firstCall.args[2]).to.include('Profile content');
      expect(makeRequestStub.firstCall.args[2]).to.include('Research content');
      expect(makeRequestStub.firstCall.args[2]).to.include('Original resume');
      expect(makeRequestStub.firstCall.args[2]).to.include('factual information to preserve');
      
      expect(verifyStub.calledOnce).to.be.true;
      expect(verifyStub.calledWith('Customized resume content', { personalInfo: { name: "John Doe" } })).to.be.true;
      
      // Verify final result
      expect(result).to.equal('Verified resume content');
    });
  });
});
