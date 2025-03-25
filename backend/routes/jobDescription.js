// routes/jobDescription.js
const express = require('express');
const router = express.Router();
const { authenticateApiKey } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimit');
const jobDescriptionController = require('../controllers/jobDescriptionController');
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

// Job description routes
router.post(
  '/', 
  Validator.validateBody(Validator.schemas.jobDescription),
  jobDescriptionController.createJobDescription
);

router.get('/', jobDescriptionController.getAllJobDescriptions);

router.get(
  '/:id', 
  Validator.validateParams(Validator.schemas.idParam),
  jobDescriptionController.getJobDescription
);

router.put(
  '/:id', 
  Validator.validateParams(Validator.schemas.idParam),
  Validator.validateBody(Validator.schemas.jobDescription),
  jobDescriptionController.updateJobDescription
);

router.delete(
  '/:id', 
  Validator.validateParams(Validator.schemas.idParam),
  jobDescriptionController.deleteJobDescription
);

// Apply error handling middleware
router.use(errorHandler.errorMiddleware);

module.exports = router;
