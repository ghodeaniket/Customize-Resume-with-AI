// routes/formattedResume.js
const express = require('express');
const router = express.Router();
const { authenticateApiKey } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimit');
const formattedResumeController = require('../controllers/formattedResumeController');
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

// Formatted resume customization routes
router.post(
  '/customize', 
  Validator.validateBody(Validator.schemas.resumeCustomization),
  formattedResumeController.customizeFormattedResume
);

router.get(
  '/status/:jobId', 
  Validator.validateParams(Validator.schemas.jobStatus),
  formattedResumeController.getFormattedJobStatus
);

router.get(
  '/pdf/:jobId', 
  Validator.validateParams(Validator.schemas.jobStatus),
  formattedResumeController.getFormattedPdfResult
);

// Apply error handling middleware
router.use(errorHandler.errorMiddleware);

module.exports = router;
