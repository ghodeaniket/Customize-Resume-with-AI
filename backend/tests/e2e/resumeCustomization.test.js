// tests/e2e/resumeCustomization.test.js
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const sinon = require('sinon');
const app = require('../../app');
const Queue = require('bull');
const db = require('../../models');
const { parseResume } = require('../../utils/resumeParser');
const { fetchJobDescription } = require('../../utils/jobScraper');
const logger = require('../../utils/logger');

/**
 * This test simulates a complete end-to-end flow of the resume customization process,
 * from API request to worker processing and status updates.
 */
describe('End-to-End Resume Customization Flow', function() {
  // Increase timeout for E2E tests
  this.timeout(10000);
  
  let authToken;
  let jobQueue;
  let jobQueueStub;
  let loggerStub;
  
  // Test data
  const testUserId = 'test-user-123';
  const testJobId = 'test-job-' + Date.now().toString();
  let testResumePath;
  let testResumeContent;
  
  before(async () => {
    // Generate test file path
    testResumePath = path.join(__dirname, '../fixtures/test-resume.pdf');
    
    // Ensure test directory exists
    const fixturesDir = path.join(__dirname, '../fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    
    // Create a simple test PDF file if it doesn't exist
    if (!fs.existsSync(testResumePath)) {
      // This is a minimal valid PDF file
      const minimalPDF = '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF\n';
      fs.writeFileSync(testResumePath, minimalPDF);
    }
    
    // Read test resume content
    testResumeContent = fs.readFileSync(testResumePath);
    
    // Mock auth middleware
    const authMiddleware = require('../../middleware/auth');
    sinon.stub(authMiddleware, 'authenticateApiKey').callsFake((req, res, next) => {
      req.user = { userId: testUserId };
      next();
    });
    
    // Create a test auth token
    authToken = 'test-api-key';
    
    // Stub logger to prevent console spam during tests
    loggerStub = sinon.stub(logger, 'info');
    sinon.stub(logger, 'error');
    
    // Setup mock job queue that we can control
    jobQueue = {
      add: sinon.stub().resolves({ id: 'bull-job-123' }),
      process: sinon.stub().callsFake((name, handler) => {
        // Store the handler for later use
        jobQueue.handler = handler;
      }),
      on: sinon.stub()
    };
    
    // Replace Bull queue with our mock
    jobQueueStub = sinon.stub(Queue, 'prototype').returns(jobQueue);
    
    // Stub resume parser
    sinon.stub(parseResume).resolves('Parsed resume content for John Doe');
    
    // Stub job description fetcher
    sinon.stub(fetchJobDescription).resolves('Job description for Software Engineer position');
  });
  
  after(() => {
    sinon.restore();
  });
  
  it('should process a resume customization job from start to finish', async () => {
    // 1. Setup database stubs
    const createJobStub = sinon.stub(db.Job, 'create').callsFake(async (data) => {
      return {
        ...data,
        jobId: testJobId,
        createdAt: new Date()
      };
    });
    
    const updateJobStub = sinon.stub(db.Job, 'update').resolves([1]);
    
    const findJobStub = sinon.stub(db.Job, 'findOne').callsFake(async ({ where }) => {
      // Initially job is pending
      if (updateJobStub.callCount === 0) {
        return {
          jobId: testJobId,
          userId: testUserId,
          status: 'pending',
          createdAt: new Date()
        };
      }
      
      // After first update, job is processing
      if (updateJobStub.callCount === 1) {
        return {
          jobId: testJobId,
          userId: testUserId,
          status: 'processing',
          createdAt: new Date()
        };
      }
      
      // After second update, job is completed
      return {
        jobId: testJobId,
        userId: testUserId,
        status: 'completed',
        result: 'Customized resume content for John Doe',
        createdAt: new Date(),
        completedAt: new Date()
      };
    });
    
    // 2. Submit a new resume customization job
    console.log('Step 1: Submitting resume customization job');
    const submitResponse = await request(app)
      .post('/api/v1/resume/customize')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        resumeContent: testResumeContent.toString('base64'),
        jobDescription: 'Looking for a Software Engineer with 5+ years of experience',
        resumeFormat: 'pdf',
        isJobDescriptionUrl: false
      })
      .expect(201);
    
    expect(submitResponse.body.status).to.equal('success');
    expect(submitResponse.body.data.jobId).to.equal(testJobId);
    
    // Verify job was created in database
    expect(createJobStub.calledOnce).to.be.true;
    
    // 3. Check initial job status (should be pending)
    console.log('Step 2: Checking initial job status');
    const initialStatusResponse = await request(app)
      .get(`/api/v1/resume/status/${testJobId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(initialStatusResponse.body.data.status).to.equal('pending');
    
    // 4. Simulate worker processing the job
    console.log('Step 3: Simulating worker processing');
    
    // Create a mock job object for the worker handler
    const mockJob = {
      data: {
        jobId: testJobId,
        userId: testUserId,
        resumeContent: testResumeContent.toString('base64'),
        jobDescription: 'Looking for a Software Engineer with 5+ years of experience',
        resumeFormat: 'pdf'
      }
    };
    
    // Create a mock AI client response
    const mockAiClient = {
      post: sinon.stub().resolves({
        data: {
          choices: [
            {
              message: {
                content: 'AI generated content'
              }
            }
          ]
        }
      })
    };
    
    // Create a worker instance with our mocks
    const BaseWorker = require('../../utils/BaseWorker');
    const worker = new BaseWorker('test-queue', { 'test-processor': () => {} });
    
    // Replace the AI client with our mock
    worker.aiClient = mockAiClient;
    
    // Now execute the handler that was registered with the queue
    const resumeProcessor = require('../../workers/resumeProcessor');
    // Assuming processCustomization is bound to the worker instance in the actual code
    const processCustomization = resumeProcessor.handler || (() => {});
    
    // Execute the handler
    await processCustomization.call(worker, mockJob);
    
    // 5. Check final job status (should be completed)
    console.log('Step 4: Checking final job status');
    const finalStatusResponse = await request(app)
      .get(`/api/v1/resume/status/${testJobId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(finalStatusResponse.body.data.status).to.equal('completed');
    expect(finalStatusResponse.body.data.result).to.equal('Customized resume content for John Doe');
    
    // Verify job was updated properly
    expect(updateJobStub.calledTwice).to.be.true;
    
    // First call should set status to processing
    expect(updateJobStub.firstCall.args[0].status).to.equal('processing');
    
    // Second call should set status to completed and include the result
    expect(updateJobStub.secondCall.args[0].status).to.equal('completed');
    expect(updateJobStub.secondCall.args[0].result).to.exist;
    
    console.log('E2E test completed successfully');
    
    // Clean up
    createJobStub.restore();
    updateJobStub.restore();
    findJobStub.restore();
  });
});
