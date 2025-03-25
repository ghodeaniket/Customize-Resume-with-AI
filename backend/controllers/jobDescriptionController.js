// controllers/jobDescriptionController.js
const db = require('../models');
const logger = require('../utils/logger');
const { analyzeJobDescription } = require('../services/aiService');

/**
 * Create a new job description
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createJobDescription = async (req, res, next) => {
  try {
    // Get validated data from middleware
    const { title, content, sourceUrl } = req.validatedBody;

    // Get user ID from API key (set by auth middleware)
    const userId = req.user.userId;

    // Analyze job description content using AI
    const analyzedData = await analyzeJobDescription(content, title);

    // Create job description in database
    const jobDescription = await db.JobDescription.create({
      title,
      content,
      sourceUrl: sourceUrl || null,
      analyzedData,
      userId
    });

    logger.info('Job description created', { id: jobDescription.id, userId });

    res.status(201).json({
      status: 'success',
      message: 'Job description created successfully',
      data: {
        id: jobDescription.id,
        title: jobDescription.title,
        sourceUrl: jobDescription.sourceUrl,
        createdAt: jobDescription.createdAt,
        analyzedData: jobDescription.analyzedData
      }
    });
  } catch (error) {
    logger.error('Error creating job description', { error });
    
    // Database errors require special handling
    if (error.name === 'SequelizeValidationError') {
      return next({
        statusCode: 400,
        message: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    next({
      statusCode: 500,
      message: 'Failed to create job description',
      details: { error: error.message }
    });
  }
};

/**
 * Get all job descriptions for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllJobDescriptions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Find all job descriptions for user with pagination
    const { count, rows: jobDescriptions } = await db.JobDescription.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'title', 'sourceUrl', 'createdAt', 'updatedAt']
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: 'success',
      data: {
        jobDescriptions,
        pagination: {
          total: count,
          page,
          limit,
          totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Error getting job descriptions', { error, userId: req.user.userId });
    next({
      statusCode: 500,
      message: 'Failed to get job descriptions',
      details: { error: error.message }
    });
  }
};

/**
 * Get a specific job description
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getJobDescription = async (req, res, next) => {
  try {
    const { id } = req.validatedParams;
    const userId = req.user.userId;

    // Find job description in database
    const jobDescription = await db.JobDescription.findOne({
      where: {
        id,
        userId
      }
    });

    if (!jobDescription) {
      return next({
        statusCode: 404,
        message: 'Job description not found',
        details: { id }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        id: jobDescription.id,
        title: jobDescription.title,
        content: jobDescription.content,
        sourceUrl: jobDescription.sourceUrl,
        analyzedData: jobDescription.analyzedData,
        createdAt: jobDescription.createdAt,
        updatedAt: jobDescription.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error getting job description', { error, id: req.params.id });
    next({
      statusCode: 500,
      message: 'Failed to get job description',
      details: { error: error.message }
    });
  }
};

/**
 * Update a job description
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateJobDescription = async (req, res, next) => {
  try {
    const { id } = req.validatedParams;
    const { title, content, sourceUrl } = req.validatedBody;
    const userId = req.user.userId;

    // Find job description in database
    const jobDescription = await db.JobDescription.findOne({
      where: {
        id,
        userId
      }
    });

    if (!jobDescription) {
      return next({
        statusCode: 404,
        message: 'Job description not found',
        details: { id }
      });
    }

    // Re-analyze if content changed
    let analyzedData = jobDescription.analyzedData;
    if (content !== jobDescription.content) {
      analyzedData = await analyzeJobDescription(content, title);
    }

    // Update job description
    await jobDescription.update({
      title,
      content,
      sourceUrl: sourceUrl || null,
      analyzedData
    });

    logger.info('Job description updated', { id, userId });

    res.status(200).json({
      status: 'success',
      message: 'Job description updated successfully',
      data: {
        id: jobDescription.id,
        title: jobDescription.title,
        sourceUrl: jobDescription.sourceUrl,
        updatedAt: jobDescription.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error updating job description', { error, id: req.params.id });
    next({
      statusCode: 500,
      message: 'Failed to update job description',
      details: { error: error.message }
    });
  }
};

/**
 * Delete a job description
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteJobDescription = async (req, res, next) => {
  try {
    const { id } = req.validatedParams;
    const userId = req.user.userId;

    // Find job description in database
    const jobDescription = await db.JobDescription.findOne({
      where: {
        id,
        userId
      }
    });

    if (!jobDescription) {
      return next({
        statusCode: 404,
        message: 'Job description not found',
        details: { id }
      });
    }

    // Delete job description
    await jobDescription.destroy();

    logger.info('Job description deleted', { id, userId });

    res.status(200).json({
      status: 'success',
      message: 'Job description deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting job description', { error, id: req.params.id });
    next({
      statusCode: 500,
      message: 'Failed to delete job description',
      details: { error: error.message }
    });
  }
};
