// routes/resume.js
const express = require('express');
const router = express.Router();
const { authenticateApiKey } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimit');
const resumeController = require('../controllers/resumeController');

// Apply authentication middleware to all routes
router.use(authenticateApiKey);

// Apply rate limiting middleware
router.use(rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests, please try again later.'
}));

// Resume customization routes
router.post('/customize', resumeController.customizeResume);
router.get('/status/:jobId', resumeController.getJobStatus);
router.get('/history', resumeController.getJobHistory);

module.exports = router;
