// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');

// Import routes
const resumeRoutes = require('./routes/resume');

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Routes
app.use('/api/v1/resume', resumeRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Resume Customizer API is running'
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
