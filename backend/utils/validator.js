// utils/validator.js
const Ajv = require('ajv');
const logger = require('./logger');

// Initialize validator
const ajv = new Ajv({ allErrors: true });

/**
 * Middleware factory for validating request body
 * @param {Object} schema - JSON schema for validation
 * @returns {function} Express middleware
 */
exports.validateBody = (schema) => {
  const validate = ajv.compile(schema);
  
  return (req, res, next) => {
    const valid = validate(req.body);
    
    if (!valid) {
      logger.warn('Validation error in request body', { errors: validate.errors });
      
      return next({
        statusCode: 400,
        message: 'Invalid request data',
        details: validate.errors.map(err => ({
          field: err.instancePath.substring(1), // Remove leading slash
          message: err.message
        }))
      });
    }
    
    // Store validated body for controllers to use
    req.validatedBody = req.body;
    next();
  };
};

/**
 * Middleware factory for validating request parameters
 * @param {Object} schema - JSON schema for validation
 * @returns {function} Express middleware
 */
exports.validateParams = (schema) => {
  const validate = ajv.compile(schema);
  
  return (req, res, next) => {
    const valid = validate(req.params);
    
    if (!valid) {
      logger.warn('Validation error in request parameters', { errors: validate.errors });
      
      return next({
        statusCode: 400,
        message: 'Invalid request parameters',
        details: validate.errors.map(err => ({
          field: err.instancePath.substring(1), // Remove leading slash
          message: err.message
        }))
      });
    }
    
    // Store validated params for controllers to use
    req.validatedParams = req.params;
    next();
  };
};

/**
 * Middleware factory for validating query parameters
 * @param {Object} schema - JSON schema for validation
 * @returns {function} Express middleware
 */
exports.validateQuery = (schema) => {
  const validate = ajv.compile(schema);
  
  return (req, res, next) => {
    const valid = validate(req.query);
    
    if (!valid) {
      logger.warn('Validation error in query parameters', { errors: validate.errors });
      
      return next({
        statusCode: 400,
        message: 'Invalid query parameters',
        details: validate.errors.map(err => ({
          field: err.instancePath.substring(1), // Remove leading slash
          message: err.message
        }))
      });
    }
    
    // Store validated query for controllers to use
    req.validatedQuery = req.query;
    next();
  };
};

// Define validation schemas
exports.schemas = {
  resumeCustomization: {
    type: 'object',
    required: ['resumeContent', 'jobDescription'],
    properties: {
      resumeContent: { type: 'string', minLength: 1 },
      jobDescription: { type: 'string', minLength: 1 },
      resumeFormat: { type: 'string', enum: ['text', 'pdf', 'docx', 'html', 'json'] },
      outputFormat: { type: 'string', enum: ['text', 'markdown', 'html', 'pdf'] },
      preserveOriginalFormat: { type: 'boolean' },
      isJobDescriptionUrl: { type: 'boolean' },
      profilerModel: { type: 'string' },
      researcherModel: { type: 'string' },
      strategistModel: { type: 'string' },
      markdownModel: { type: 'string' },
      htmlModel: { type: 'string' }
    }
  },
  jobStatus: {
    type: 'object',
    required: ['jobId'],
    properties: {
      jobId: { type: 'string', minLength: 1 }
    }
  },
  jobDescription: {
    type: 'object',
    required: ['title', 'content'],
    properties: {
      title: { type: 'string', minLength: 1 },
      content: { type: 'string', minLength: 1 },
      sourceUrl: { type: 'string' }
    }
  },
  idParam: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', minLength: 1 }
    }
  }
};

// Validation middleware for resume uploads
exports.validateResume = (req, res, next) => {
  if (!req.file) {
    return next({
      statusCode: 400,
      message: 'No file uploaded',
    });
  }

  if (!req.body.title || typeof req.body.title !== 'string' || req.body.title.trim() === '') {
    return next({
      statusCode: 400,
      message: 'Title is required',
    });
  }

  // Validate file type
  const fileType = req.file.mimetype;
  if (
    fileType !== 'application/pdf' &&
    fileType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return next({
      statusCode: 400,
      message: 'Only PDF and DOCX files are supported',
    });
  }

  // Create validatedBody object
  req.validatedBody = {
    title: req.body.title
  };

  next();
};
