// utils/validator.js
const Joi = require('joi');
const logger = require('./logger');

/**
 * Validator utility for API request validation
 */
class Validator {
  /**
   * Validate request against schema
   * @param {Object} req - Express request object
   * @param {Object} schema - Joi validation schema
   * @returns {Object} - Validation result
   */
  static validate(data, schema) {
    const options = {
      abortEarly: false,
      stripUnknown: true
    };
    
    const { error, value } = schema.validate(data, options);
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        message: detail.message,
        path: detail.path
      }));
      
      logger.debug('Validation error', { errorDetails });
      
      throw {
        statusCode: 400,
        message: 'Invalid request data',
        details: errorDetails
      };
    }
    
    return value;
  }
  
  /**
   * Middleware for validating request body
   * @param {Object} schema - Joi schema for validation
   * @returns {Function} - Express middleware
   */
  static validateBody(schema) {
    return (req, res, next) => {
      try {
        req.validatedBody = this.validate(req.body, schema);
        next();
      } catch (error) {
        next(error);
      }
    };
  }
  
  /**
   * Middleware for validating request params
   * @param {Object} schema - Joi schema for validation
   * @returns {Function} - Express middleware
   */
  static validateParams(schema) {
    return (req, res, next) => {
      try {
        req.validatedParams = this.validate(req.params, schema);
        next();
      } catch (error) {
        next(error);
      }
    };
  }
  
  /**
   * Middleware for validating request query
   * @param {Object} schema - Joi schema for validation
   * @returns {Function} - Express middleware
   */
  static validateQuery(schema) {
    return (req, res, next) => {
      try {
        req.validatedQuery = this.validate(req.query, schema);
        next();
      } catch (error) {
        next(error);
      }
    };
  }
  
  /**
   * Common validation schemas
   */
  static schemas = {
    // Resume customization request schema
    resumeCustomization: Joi.object({
      resumeContent: Joi.string().required().min(10)
        .messages({
          'string.empty': 'Resume content is required',
          'string.min': 'Resume content is too short to be valid'
        }),
      jobDescription: Joi.string().required().min(10)
        .messages({
          'string.empty': 'Job description is required',
          'string.min': 'Job description is too short to be valid'
        }),
      resumeFormat: Joi.string().valid('text', 'pdf', 'docx', 'html', 'json').default('text')
        .messages({
          'any.only': 'Resume format must be one of: text, pdf, docx, html, json'
        }),
      outputFormat: Joi.string().valid('text', 'markdown', 'html', 'pdf').default('text')
        .messages({
          'any.only': 'Output format must be one of: text, markdown, html, pdf'
        }),
      preserveOriginalFormat: Joi.boolean().default(false)
        .messages({
          'boolean.base': 'Preserve original format must be a boolean'
        }),
      isJobDescriptionUrl: Joi.boolean().default(false),
      profilerModel: Joi.string(),
      researcherModel: Joi.string(),
      strategistModel: Joi.string(),
      markdownModel: Joi.string(),
      htmlModel: Joi.string()
    }),
    
    // Job status request schema
    jobStatus: Joi.object({
      jobId: Joi.string().required()
        .messages({
          'string.empty': 'Job ID is required'
        })
    }),
    
    // Generic ID parameter schema
    idParam: Joi.object({
      id: Joi.string().required()
        .messages({
          'string.empty': 'ID parameter is required'
        })
    })
  };
}

module.exports = Validator;
