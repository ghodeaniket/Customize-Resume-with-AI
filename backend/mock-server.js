// mock-server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/config');
const errorHandler = require('./utils/errorHandler');
const logger = require('./utils/logger');

// Import routes
const healthRoutes = require('./routes/health');

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.app.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || 
           req.query.requestId || 
           require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Debug logging for requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Received request to ${req.method} ${req.originalUrl}`);
  next();
});

// Health check route
app.use('/api/v1/health', healthRoutes);

// Custom mock endpoints for development
app.post('/api/v1/resume/customize', (req, res) => {
  // Mock successful job submission
  const jobId = require('crypto').randomUUID();
  res.status(201).json({
    status: 'success',
    message: 'Resume customization job submitted successfully',
    data: { jobId }
  });
});

app.get('/api/v1/resume/status/:jobId', (req, res) => {
  // Mock successful job completion
  res.status(200).json({
    status: 'success',
    data: {
      jobId: req.params.jobId,
      status: 'completed',
      result: '# Your Customized Resume\n\nThis is a mock customized resume for development purposes.\n\n## Professional Summary\n\nExperienced software engineer with expertise in frontend and backend development.',
      createdAt: new Date(Date.now() - 60000).toISOString(),
      completedAt: new Date().toISOString()
    }
  });
});

app.get('/api/v1/resume/history', (req, res) => {
  // Mock job history
  res.status(200).json({
    status: 'success',
    data: {
      jobs: [
        {
          jobId: 'mock-job-1',
          status: 'completed',
          createdAt: new Date(Date.now() - 60000).toISOString(),
          completedAt: new Date().toISOString(),
          resumeFormat: 'pdf'
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

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Resume Customizer API is running (MOCK MODE)',
    version: '1.1.0-mock'
  });
});

// Global error handling middleware
app.use(errorHandler.errorMiddleware);

// Set port
const PORT = 9001;

// Start server
app.listen(PORT, () => {
  logger.info(`Mock server running on port ${PORT}`);
});
