// tests/integration/routes/resume.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const app = require('../../../app');
const db = require('../../../models');
const Queue = require('bull');

describe('Resume API Routes', () => {
  let authToken;
  let jobQueue;
  let mockUserId;
  
  before(async () => {
    // Setup mock authentication
    mockUserId = 'test-user-123';
    
    // Mock auth middleware to always authenticate as test user
    const authMiddleware = require('../../../middleware/auth');
    sinon.stub(authMiddleware, 'authenticateApiKey').callsFake((req, res, next) => {
      req.user = { userId: mockUserId };
      next();
    });
    
    // Create a mock auth token
    authToken = 'test-api-key';
    
    // Mock the job queue
    jobQueue = {
      add: sinon.stub().resolves({ id: 'job-123' })
    };
    
    // Stub Queue constructor to return our mock
    sinon.stub(Queue, 'prototype').returns(jobQueue);
  });
  
  after(() => {
    sinon.restore();
  });
  
  describe('POST /api/v1/resume/customize', () => {
    let dbCreateStub;
    
    beforeEach(() => {
      // Stub database operations
      dbCreateStub = sinon.stub(db.Job, 'create').resolves({
        jobId: uuidv4(),
        userId: mockUserId,
        status: 'pending'
      });
    });
    
    afterEach(() => {
      dbCreateStub.restore();
    });
    
    it('should return 201 with jobId for valid request', async () => {
      // Setup test data
      const requestBody = {
        resumeContent: 'John Doe\nSoftware Engineer',
        jobDescription: 'We are looking for a Software Engineer',
        resumeFormat: 'text',
        isJobDescriptionUrl: false
      };
      
      // Make request
      const response = await request(app)
        .post('/api/v1/resume/customize')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);
      
      // Verify response
      expect(response.body.status).to.equal('success');
      expect(response.body.message).to.include('submitted successfully');
      expect(response.body.data).to.have.property('jobId');
      
      // Verify database was called
      expect(dbCreateStub.calledOnce).to.be.true;
      
      // Verify job was added to queue
      expect(jobQueue.add.calledOnce).to.be.true;
      expect(jobQueue.add.firstCall.args[0]).to.equal('customize-resume');
      expect(jobQueue.add.firstCall.args[1].resumeContent).to.equal(requestBody.resumeContent);
      expect(jobQueue.add.firstCall.args[1].jobDescription).to.equal(requestBody.jobDescription);
    });
    
    it('should return 400 when required fields are missing', async () => {
      // Make request with missing fields
      const response = await request(app)
        .post('/api/v1/resume/customize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing resumeContent
          jobDescription: 'We are looking for a Software Engineer'
        })
        .expect(400);
      
      // Verify response
      expect(response.body.status).to.equal('error');
      expect(response.body.message).to.include('Invalid request data');
      
      // Verify database was not called
      expect(dbCreateStub.called).to.be.false;
    });
    
    it('should handle database errors gracefully', async () => {
      // Setup database error
      dbCreateStub.rejects(new Error('Database connection error'));
      
      // Make request
      const response = await request(app)
        .post('/api/v1/resume/customize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resumeContent: 'John Doe\nSoftware Engineer',
          jobDescription: 'We are looking for a Software Engineer'
        })
        .expect(500);
      
      // Verify response
      expect(response.body.status).to.equal('error');
      expect(response.body.message).to.include('Failed to submit');
    });
    
    it('should validate resumeFormat field', async () => {
      // Make request with invalid format
      const response = await request(app)
        .post('/api/v1/resume/customize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resumeContent: 'John Doe\nSoftware Engineer',
          jobDescription: 'We are looking for a Software Engineer',
          resumeFormat: 'invalid-format' // Invalid format
        })
        .expect(400);
      
      // Verify response
      expect(response.body.status).to.equal('error');
      expect(response.body.message).to.include('Invalid request data');
      expect(response.body.details).to.be.an('array');
      
      // Find the specific validation error
      const formatError = response.body.details.find(
        error => error.path.includes('resumeFormat')
      );
      expect(formatError).to.exist;
    });
  });
  
  describe('GET /api/v1/resume/status/:jobId', () => {
    let dbFindOneStub;
    const testJobId = 'test-job-123';
    
    beforeEach(() => {
      // Stub database operations
      dbFindOneStub = sinon.stub(db.Job, 'findOne');
    });
    
    afterEach(() => {
      dbFindOneStub.restore();
    });
    
    it('should return job status for valid jobId', async () => {
      // Setup mock job data
      const mockJob = {
        jobId: testJobId,
        status: 'completed',
        result: 'Customized resume content',
        createdAt: new Date(),
        completedAt: new Date()
      };
      
      dbFindOneStub.resolves(mockJob);
      
      // Make request
      const response = await request(app)
        .get(`/api/v1/resume/status/${testJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify response
      expect(response.body.status).to.equal('success');
      expect(response.body.data.jobId).to.equal(testJobId);
      expect(response.body.data.status).to.equal('completed');
      expect(response.body.data.result).to.equal('Customized resume content');
      
      // Verify database was called correctly
      expect(dbFindOneStub.calledOnce).to.be.true;
      expect(dbFindOneStub.firstCall.args[0].where.jobId).to.equal(testJobId);
      expect(dbFindOneStub.firstCall.args[0].where.userId).to.equal(mockUserId);
    });
    
    it('should return processing status properly', async () => {
      // Setup mock job data for processing status
      const mockJob = {
        jobId: testJobId,
        status: 'processing',
        createdAt: new Date()
      };
      
      dbFindOneStub.resolves(mockJob);
      
      // Make request
      const response = await request(app)
        .get(`/api/v1/resume/status/${testJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify response
      expect(response.body.status).to.equal('success');
      expect(response.body.data.jobId).to.equal(testJobId);
      expect(response.body.data.status).to.equal('processing');
      expect(response.body.data).to.not.have.property('result');
      expect(response.body.data).to.not.have.property('completedAt');
    });
    
    it('should return 404 for non-existent job', async () => {
      // Setup database to return null (job not found)
      dbFindOneStub.resolves(null);
      
      // Make request
      const response = await request(app)
        .get(`/api/v1/resume/status/${testJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      // Verify response
      expect(response.body.status).to.equal('error');
      expect(response.body.message).to.include('Job not found');
    });
    
    it('should handle database errors gracefully', async () => {
      // Setup database error
      dbFindOneStub.rejects(new Error('Database error'));
      
      // Make request
      const response = await request(app)
        .get(`/api/v1/resume/status/${testJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);
      
      // Verify response
      expect(response.body.status).to.equal('error');
      expect(response.body.message).to.include('Failed to get job status');
    });
  });
  
  describe('GET /api/v1/resume/history', () => {
    let dbFindAndCountAllStub;
    
    beforeEach(() => {
      // Stub database operations
      dbFindAndCountAllStub = sinon.stub(db.Job, 'findAndCountAll');
    });
    
    afterEach(() => {
      dbFindAndCountAllStub.restore();
    });
    
    it('should return paginated job history', async () => {
      // Setup mock job history data
      const mockJobs = {
        count: 25,
        rows: [
          {
            jobId: 'job-1',
            status: 'completed',
            createdAt: new Date(),
            completedAt: new Date()
          },
          {
            jobId: 'job-2',
            status: 'processing',
            createdAt: new Date()
          }
        ]
      };
      
      dbFindAndCountAllStub.resolves(mockJobs);
      
      // Make request
      const response = await request(app)
        .get('/api/v1/resume/history?page=2&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify response
      expect(response.body.status).to.equal('success');
      expect(response.body.data.jobs).to.have.lengthOf(2);
      expect(response.body.data.pagination.total).to.equal(25);
      expect(response.body.data.pagination.page).to.equal(2);
      expect(response.body.data.pagination.limit).to.equal(10);
      expect(response.body.data.pagination.totalPages).to.equal(3);
      
      // Verify database was called correctly
      expect(dbFindAndCountAllStub.calledOnce).to.be.true;
      expect(dbFindAndCountAllStub.firstCall.args[0].where.userId).to.equal(mockUserId);
      expect(dbFindAndCountAllStub.firstCall.args[0].limit).to.equal(10);
      expect(dbFindAndCountAllStub.firstCall.args[0].offset).to.equal(10); // page 2, limit 10
    });
    
    it('should use default pagination when not specified', async () => {
      // Setup mock job history data
      dbFindAndCountAllStub.resolves({ count: 5, rows: [] });
      
      // Make request without pagination params
      await request(app)
        .get('/api/v1/resume/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify default pagination was used
      expect(dbFindAndCountAllStub.firstCall.args[0].limit).to.equal(10); // default limit
      expect(dbFindAndCountAllStub.firstCall.args[0].offset).to.equal(0); // default offset (page 1)
    });
    
    it('should handle database errors gracefully', async () => {
      // Setup database error
      dbFindAndCountAllStub.rejects(new Error('Database error'));
      
      // Make request
      const response = await request(app)
        .get('/api/v1/resume/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);
      
      // Verify response
      expect(response.body.status).to.equal('error');
      expect(response.body.message).to.include('Failed to get job history');
    });
    
    it('should handle invalid pagination parameters', async () => {
      // Make request with invalid parameters
      const response = await request(app)
        .get('/api/v1/resume/history?page=invalid&limit=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // Should still work with defaults
      
      // Verify default pagination was used despite invalid input
      expect(dbFindAndCountAllStub.firstCall.args[0].limit).to.equal(10);
      expect(dbFindAndCountAllStub.firstCall.args[0].offset).to.equal(0);
    });
    
    it('should handle empty result set', async () => {
      // Setup empty history
      dbFindAndCountAllStub.resolves({ count: 0, rows: [] });
      
      // Make request
      const response = await request(app)
        .get('/api/v1/resume/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify response
      expect(response.body.status).to.equal('success');
      expect(response.body.data.jobs).to.be.an('array').that.is.empty;
      expect(response.body.data.pagination.total).to.equal(0);
      expect(response.body.data.pagination.totalPages).to.equal(0);
    });
  });
});
