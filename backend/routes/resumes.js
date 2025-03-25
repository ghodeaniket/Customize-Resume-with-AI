// routes/resumes.js
const express = require('express');
const router = express.Router();
const { authenticateApiKey } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimit');
const resumesController = require('../controllers/resumesController');
const Validator = require('../utils/validator');
const errorHandler = require('../utils/errorHandler');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow only PDF and DOCX
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'), false);
    }
  }
});

// Apply authentication middleware to all routes
router.use(authenticateApiKey);

// Apply rate limiting middleware
router.use(rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests, please try again later.'
}));

// Resumes routes
router.post(
  '/',
  upload.single('file'),
  Validator.validateResume,
  resumesController.uploadResume
);

router.get('/', resumesController.getAllResumes);

router.get(
  '/:id',
  Validator.validateParams(Validator.schemas.idParam),
  resumesController.getResume
);

router.delete(
  '/:id',
  Validator.validateParams(Validator.schemas.idParam),
  resumesController.deleteResume
);

// Apply error handling middleware
router.use(errorHandler.errorMiddleware);

module.exports = router;
