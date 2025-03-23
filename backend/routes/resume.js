// routes/resume.js
const express = require('express');
const router = express.Router();
const { authenticateApiKey } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimit');
const resumeController = require('../controllers/resumeController');
const Validator = require('../utils/validator');
const errorHandler = require('../utils/errorHandler');

// Apply authentication middleware to all routes
router.use(authenticateApiKey);

// Apply rate limiting middleware
router.use(rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests, please try again later.'
}));

// Resume customization routes
router.post(
  '/customize', 
  Validator.validateBody(Validator.schemas.resumeCustomization),
  resumeController.customizeResume
);

router.get(
  '/status/:jobId', 
  Validator.validateParams(Validator.schemas.jobStatus),
  resumeController.getJobStatus
);

router.get('/history', resumeController.getJobHistory);

// Apply error handling middleware
router.use(errorHandler.apiErrorMiddleware());

module.exports = router;