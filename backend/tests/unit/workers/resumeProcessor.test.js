// tests/unit/workers/resumeProcessor.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const db = require('../../../models');
const { parseResume } = require('../../../utils/resumeParser');
const { fetchJobDescription } = require('../../../utils/jobScraper');
const MockResumeProcessor = require('../../mocks/resumeProcessor.mock');

describe('Resume Processor', () => {
  let resumeProcessor;
  
  beforeEach(() => {
    // Create mock resume processor
    resumeProcessor = new MockResumeProcessor();
    
    // Stub external dependencies
    sinon.stub(parseResume).resolves('Parsed resume content');
    sinon.stub(fetchJobDescription).resolves('Fetched job description');
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('processCustomization', () => {
    it('should process a job successfully', async () => {
      // Setup mock job
      const mockJob = {
        data: {
          jobId: 'test-job-123',
          userId: 'test-user-456',
          resumeContent: 'John Doe resume',
          jobDescription: 'Software Engineer job',
          resumeFormat: 'text',
          isJobDescriptionUrl: false
        }
      };
      
      // Execute the method
      const result = await resumeProcessor.processCustomization(mockJob);
      
      // Verify result
      expect(result.status).to.equal('success');
      expect(result.jobId).to.equal(mockJob.data.jobId);
      
      // Verify status updates
      expect(resumeProcessor.updateJobStatus.calledTwice).to.be.true;
      
      // First call should set status to processing
      expect(resumeProcessor.updateJobStatus.firstCall.args[1]).to.equal('processing');
      
      // Second call should set status to completed
      expect(resumeProcessor.updateJobStatus.secondCall.args[1]).to.equal('completed');
      
      // Verify AI service calls
      expect(resumeProcessor.aiService.generateProfileFromResume.calledOnce).to.be.true;
      expect(resumeProcessor.aiService.analyzeJobDescription.calledOnce).to.be.true;
      expect(resumeProcessor.aiService.generateCustomizedResume.calledOnce).to.be.true;
    });
    
    it('should handle processing errors', async () => {
      // Setup mock job
      const mockJob = {
        data: {
          jobId: 'test-job-123',
          userId: 'test-user-456',
          resumeContent: 'John Doe resume',
          jobDescription: 'Software Engineer job'
        }
      };
      
      // Make AI service throw an error
      const testError = new Error('Test AI error');
      resumeProcessor.aiService.generateProfileFromResume.rejects(testError);
      
      // Execute the method and catch error
      try {
        await resumeProcessor.processCustomization(mockJob);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Verify error handling
        expect(error).to.equal(testError);
        expect(resumeProcessor.handleProcessingError.calledOnce).to.be.true;
        expect(resumeProcessor.handleProcessingError.firstCall.args[0]).to.equal(mockJob.data.jobId);
        expect(resumeProcessor.handleProcessingError.firstCall.args[1]).to.equal(testError);
      }
    });
  });
});
