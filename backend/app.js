// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const config = require('./config/config');

// Import routes
const resumeRoutes = require('./routes/resume');
const formattedResumeRoutes = require('./routes/formattedResume');

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for larger documents
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

// Routes
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
