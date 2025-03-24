// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const config = require('./config/config');
const errorHandler = require('./utils/errorHandler');
const logger = require('./utils/logger');

// Import routes
const resumeRoutes = require('./routes/resume');
const formattedResumeRoutes = require('./routes/formattedResume');
const healthRoutes = require('./routes/health');

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.app.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for larger documents
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || 
           req.query.requestId || 
           require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Set up request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Health check routes (no auth required)
app.use('/api/v1/health', healthRoutes);

// Main API routes
app.use('/api/v1/resume', resumeRoutes);
app.use('/api/v1/formatted-resume', formattedResumeRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Resume Customizer API is running',
    version: '1.1.0',
    features: [
      'Text resume customization',
      'Formatted PDF output',
      'Multiple input formats (PDF, DOCX, HTML, JSON, Text)'
    ]
  });
});

// Add Prometheus metrics endpoint if enabled
if (process.env.ENABLE_METRICS === 'true') {
  const promBundle = require('express-prom-bundle');
  const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    includeUp: true,
    customLabels: { app: 'resume-customizer-api' },
    promClient: {
      collectDefaultMetrics: {
        timeout: 5000
      }
    }
  });
  app.use(metricsMiddleware);
  logger.info('Prometheus metrics enabled at /metrics');
}

// Global error handling middleware
app.use(errorHandler.errorMiddleware);

module.exports = app;
