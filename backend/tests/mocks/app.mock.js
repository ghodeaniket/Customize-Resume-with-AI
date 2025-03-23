// tests/mocks/app.mock.js
const express = require('express');

/**
 * Create a mock Express app for testing
 */
function createMockApp() {
  const app = express();
  
  // Mock middleware
  app.use(express.json());
  
  // Mock routes
  app.post('/api/v1/resume/customize', (req, res) => {
    res.status(201).json({
      status: 'success',
      message: 'Resume customization job submitted successfully',
      data: {
        jobId: 'mock-job-123'
      }
    });
  });
  
  app.get('/api/v1/resume/status/:jobId', (req, res) => {
    res.status(200).json({
      status: 'success',
      data: {
        jobId: req.params.jobId,
        status: 'completed',
        result: 'Customized resume content',
        createdAt: new Date(),
        completedAt: new Date()
      }
    });
  });
  
  app.get('/api/v1/resume/history', (req, res) => {
    res.status(200).json({
      status: 'success',
      data: {
        jobs: [
          {
            jobId: 'mock-job-123',
            status: 'completed',
            createdAt: new Date(),
            completedAt: new Date()
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      }
    });
  });
  
  return app;
}

module.exports = createMockApp;
