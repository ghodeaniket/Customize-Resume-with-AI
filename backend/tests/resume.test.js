const request = require('supertest');
const app = require('../app');
const db = require('../models');

describe('Resume API', () => {
  // Mock user for testing
  const testUser = {
    userId: '12345678-1234-1234-1234-123456789012',
    email: 'test@example.com',
    apiKey: 'test-api-key'
  };

  // Setup before tests
  beforeAll(async () => {
    // Create test user in database
    await db.User.create({
      userId: testUser.userId,
      email: testUser.email,
      apiKey: testUser.apiKey
    });
  });

  // Cleanup after tests
  afterAll(async () => {
    // Delete test user
    await db.User.destroy({
      where: { userId: testUser.userId }
    });
    
    // Close database connection
    await db.sequelize.close();
  });

  describe('POST /api/v1/resume/customize', () => {
    it('should return 401 if no API key is provided', async () => {
      const response = await request(app)
        .post('/api/v1/resume/customize')
        .send({
          resumeContent: 'Test resume content',
          jobDescription: 'Test job description'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should return 200 with a job ID if valid request', async () => {
      const response = await request(app)
        .post('/api/v1/resume/customize')
        .set('Authorization', `Bearer ${testUser.apiKey}`)
        .send({
          resumeContent: 'Test resume content',
          jobDescription: 'Test job description'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('jobId');
    });
  });

  describe('GET /api/v1/resume/status/:jobId', () => {
    it('should return job status for valid job ID', async () => {
      // First create a job
      const createResponse = await request(app)
        .post('/api/v1/resume/customize')
        .set('Authorization', `Bearer ${testUser.apiKey}`)
        .send({
          resumeContent: 'Test resume content',
          jobDescription: 'Test job description'
        });
      
      const jobId = createResponse.body.data.jobId;
      
      // Then check status
      const response = await request(app)
        .get(`/api/v1/resume/status/${jobId}`)
        .set('Authorization', `Bearer ${testUser.apiKey}`);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('jobId', jobId);
      expect(response.body.data).toHaveProperty('status');
    });
  });
});
