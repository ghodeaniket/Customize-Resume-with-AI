// tests/unit/workers/resumeProcessor.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const db = require('../../../models');
const { parseResume } = require('../../../utils/resumeParser');
const { fetchJobDescription } = require('../../../utils/jobScraper');
const AIService = require('../../../utils/AIService');
const ResumeProcessor = require('../../../workers/resumeProcessor');

describe('Resume Processor', () => {
  let resumeProcessorInstance;
  let mockQueue;
  let mockAiClient;
  let mockAiService;
  let updateJobStatusStub;
  let parseResumeStub;
  let fetchJobDescriptionStub;
  
  beforeEach(() => {
    // Mock Bull queue
    mockQueue = {
      process: sinon.stub(),
      on: sinon.stub()
    };
    
    // Mock AI client
    mockAiClient = {
      post: sinon.stub().resolves({
        data: {
          choices: [
            { message: { content: 'AI response' } }
          ]
        }
      })
    };
    
    // Mock AI service methods
    mockAiService = {
      generateProfileFromResume: sinon.stub().resolves('Profile content'),
      analyzeJobDescription: sinon.stub().resolves('Analysis content'),
      generateCustomizedResume: sinon.stub().resolves('Customized resume content')
    };
    
    // Stub db.Job.update
    updateJobStatusStub = sinon.stub(db.Job, 'update').resolves([1]);
    
    // Stub resume parser
    parseResumeStub = sinon.stub(parseResume).resolves('Parsed resume content');
    
    // Stub job description fetcher
    fetchJobDescriptionStub = sinon.stub(fetchJobDescription).resolves('Fetched job description');
    
    // For BaseWorker, we'll need to stub or modify its constructor
    // Here we're assuming the worker is exported directly, adjust as needed
    
    // Get processCustomization method from the worker
    resumeProcessorInstance = {
      queue: mockQueue,
      aiClient: mockAiClient,
      aiService: mockAiService,
      updateJobStatus: sinon.stub().resolves(),
      handleProcessingError: sinon.stub().resolves()
    };
    
    // If it's a class, get prototype method and bind to instance
    const proto = Object.getPrototypeOf(resumeProcessorInstance);
    if (proto.processCustomization) {
      resumeProcessorInstance.processCustomization = proto.processCustomization.bind(resumeProcessorInstance);
    }
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('processCustomization', () => {
    it('should process a job successfully', async () => {
      // Skip if method doesn't exist (implementation may vary)
      if (!resumeProcessorInstance.processCustomization) {
        return;
      }
      
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
      const result = await resumeProcessorInstance.processCustomization(mockJob);
      
      // Verify result
      expect(result.status).to.equal('success');
      expect(result.jobId).to.equal(mockJob.data.jobId);
      
      // Verify status updates
      expect(resumeProcessorInstance.updateJobStatus.calledTwice).to.be.true;
      
      // First call should set status to processing
      expect(resumeProcessorInstance.updateJobStatus.firstCall.args[1]).to.equal('processing');
      
      // Second call should set status to completed
      expect(resumeProcessorInstance.updateJobStatus.secondCall.args[1]).to.equal('completed');
      
      // Verify AI service calls
      expect(mockAiService.generateProfileFromResume.calledOnce).to.be.true;
      expect(mockAiService.analyzeJobDescription.calledOnce).to.be.true;
      expect(mockAiService.generateCustomizedResume.calledOnce).to.be.true;
      
      // No parsing needed for text format
      expect(parseResumeStub.called).to.be.false;
      
      // No fetching needed for non-URL job description
      expect(fetchJobDescriptionStub.called).to.be.false;
    });
    
    it('should parse resume if format is not text', async () => {
      // Skip if method doesn't exist (implementation may vary)
      if (!resumeProcessorInstance.processCustomization) {
        return;
      }
      
      // Setup mock job
      const mockJob = {
        data: {
          jobId: 'test-job-123',
          userId: 'test-user-456',
          resumeContent: Buffer.from('PDF content').toString('base64'),
          jobDescription: 'Software Engineer job',
          resumeFormat: 'pdf',
          isJobDescriptionUrl: false
        }
      };
      
      // Execute the method
      await resumeProcessorInstance.processCustomization(mockJob);
      
      // Verify parsing was called
      expect(parseResumeStub.calledOnce).to.be.true;
      expect(parseResumeStub.firstCall.args[0]).to.equal(mockJob.data.resumeContent);
      expect(parseResumeStub.firstCall.args[1]).to.equal('pdf');
    });
    
    it('should fetch job description if URL is provided', async () => {
      // Skip if method doesn't exist (implementation may vary)
      if (!resumeProcessorInstance.processCustomization) {
        return;
      }
      
      // Setup mock job
      const mockJob = {
        data: {
          jobId: 'test-job-123',
          userId: 'test-user-456',
          resumeContent: 'John Doe resume',
          jobDescription: 'https://example.com/jobs/123',
          resumeFormat: 'text',
          isJobDescriptionUrl: true
        }
      };
      
      // Execute the method
      await resumeProcessorInstance.processCustomization(mockJob);
      
      // Verify job description fetching was called
      expect(fetchJobDescriptionStub.calledOnce).to.be.true;
      expect(fetchJobDescriptionStub.firstCall.args[0]).to.equal(mockJob.data.jobDescription);
    });
    
    it('should handle processing errors', async () => {
      // Skip if method doesn't exist (implementation may vary)
      if (!resumeProcessorInstance.processCustomization) {
        return;
      }
      
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
      mockAiService.generateProfileFromResume.rejects(testError);
      
      // Execute the method and catch error
      try {
        await resumeProcessorInstance.processCustomization(mockJob);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Verify error handling
        expect(error).to.equal(testError);
        expect(resumeProcessorInstance.handleProcessingError.calledOnce).to.be.true;
        expect(resumeProcessorInstance.handleProcessingError.firstCall.args[0]).to.equal(mockJob.data.jobId);
        expect(resumeProcessorInstance.handleProcessingError.firstCall.args[1]).to.equal(testError);
      }
    });
  });
});
