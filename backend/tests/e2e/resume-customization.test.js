// tests/e2e/resume-customization.test.js
const { expect } = require('chai');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const app = require('../../app');
const Queue = require('bull');
const db = require('../../models');

describe('End-to-end Resume Customization Flow', function() {
  // These tests might take longer to run
  this.timeout(10000);
  
  let authToken;
  let testJobId;
  
  // Setup test data
  const mockResumePath = path.join(__dirname, '../mocks/data/sample-resume.txt');
  const mockJobDescriptionPath = path.join(__dirname, '../mocks/data/sample-job-description.txt');
  
  before(async () => {
    // Create test auth token
    authToken = 'test-api-key';
    
    // Mock auth middleware
    const authMiddleware = require('../../middleware/auth');
    sinon.stub(authMiddleware, 'authenticateApiKey').callsFake((req, res, next) => {
      req.user = { userId: 'e2e-test-user' };
      next();
    });
    
    // Load test resume and job description
    const resumeContent = fs.readFileSync(mockResumePath, 'utf-8');
    const jobDescription = fs.readFileSync(mockJobDescriptionPath, 'utf-8');
    
    // Setup database mocks
    // For job creation
    sinon.stub(db.Job, 'create').callsFake(async (jobData) => {
      testJobId = jobData.jobId;
      return {
        ...jobData,
        createdAt: new Date()
      };
    });
    
    // For job status
    const jobStatusStub = sinon.stub(db.Job, 'findOne');
    
    // First status check - processing
    jobStatusStub.onFirstCall().resolves({
      jobId: testJobId,
      userId: 'e2e-test-user',
      status: 'processing',
      createdAt: new Date()
    });
    
    // Second status check - completed
    jobStatusStub.onSecondCall().resolves({
      jobId: testJobId,
      userId: 'e2e-test-user',
      status: 'completed',
      result: 'Customized resume content tailored to Senior Software Engineer role',
      createdAt: new Date(),
      completedAt: new Date()
    });
    
    // For job history
    sinon.stub(db.Job, 'findAndCountAll').resolves({
      count: 1,
      rows: [
        {
          jobId: testJobId,
          status: 'completed',
          createdAt: new Date(),
          completedAt: new Date(),
          resumeFormat: 'text'
        }
      ]
    });
    
    // Mock queue processing
    sinon.stub(Queue.prototype, 'add').resolves({ id: 'mock-queue-job' });
    
    // Create a fake updateJobStatus function that would normally be done by worker
    global.simulateJobCompletion = async () => {
      // This is just for simulation purposes
      console.log('Job completion simulation triggered');
    };
  });
  
  after(() => {
    sinon.restore();
    delete global.simulateJobCompletion;
  });
  
  it('should complete the full resume customization flow', async () => {
    // Step 1: Submit the resume for customization
    console.log('Submitting resume customization job...');
    const resumeContent = fs.readFileSync(mockResumePath, 'utf-8');
    const jobDescription = fs.readFileSync(mockJobDescriptionPath, 'utf-8');
    
    const submitResponse = await request(app)
      .post('/api/v1/resume/customize')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        resumeContent,
        jobDescription,
        resumeFormat: 'text',
        isJobDescriptionUrl: false
      })
      .expect(201);
    
    // Verify job was submitted successfully
    expect(submitResponse.body.status).to.equal('success');
    expect(submitResponse.body.data).to.have.property('jobId');
    testJobId = submitResponse.body.data.jobId;
    console.log(`Job submitted with ID: ${testJobId}`);
    
    // Step 2: Check initial job status (should be processing)
    console.log('Checking initial job status...');
    const initialStatusResponse = await request(app)
      .get(`/api/v1/resume/status/${testJobId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(initialStatusResponse.body.status).to.equal('success');
    expect(initialStatusResponse.body.data.status).to.equal('processing');
    
    // Step 3: Simulate job completion (this would normally be done by the worker)
    console.log('Simulating job completion...');
    if (typeof global.simulateJobCompletion === 'function') {
      await global.simulateJobCompletion();