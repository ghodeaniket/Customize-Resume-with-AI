// controllers/resumeController.js
const { v4: uuidv4 } = require('uuid');
const Queue = require('bull');
const db = require('../models');
const logger = require('../utils/logger');
const config = require('../config/config');
const errorHandler = require('../utils/errorHandler');

// Initialize queue
const resumeQueue = new Queue('resume-processing', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined
  }
});

/**
 * Submit a resume for customization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.customizeResume = async (req, res, next) => {
  try {
    // Get validated data from middleware
    const {
      resumeContent,
      jobDescription,
      resumeFormat,
      isJobDescriptionUrl,
      profilerModel,
      researcherModel,
      strategistModel
    } = req.validatedBody;

    // Get user ID from API key (set by auth middleware)
    const userId = req.user.userId;

    // Create job record in database
    const job = await db.Job.create({
      jobId: uuidv4(),
      userId,
      status: 'pending',
      resumeFormat,
      isJobDescriptionUrl,
      profilerModel,
      researcherModel,
      strategistModel
    });

    // Add job to processing queue
    await resumeQueue.add('customize-resume', {
      jobId: job.jobId,
      userId,
      resumeContent,
      jobDescription,
      resumeFormat,
      isJobDescriptionUrl,
      profilerModel,
      researcherModel,
      strategistModel
    }, {
      attempts: 3, // Retry up to 3 times
      backoff: {
        type: 'exponential',
        delay: 5000 // Starting delay of 5 seconds
      }
    });

    logger.info('Resume customization job submitted', { jobId: job.jobId, userId });

    res.status(201).json({
      status: 'success',
      message: 'Resume customization job submitted successfully',
      data: {
        jobId: job.jobId
      }
    });
  } catch (error) {
    logger.error('Error submitting resume customization job', { error });
    
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
      message: 'Failed to submit resume customization job',
      details: { error: error.message }
    });
  }
};

/**
 * Get status of a job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getJobStatus = async (req, res, next) => {
  try {
    // Get jobId from validated params
    const { jobId } = req.validatedParams;
    const userId = req.user.userId;

    // Find job in database
    const job = await db.Job.findOne({
      where: {
        jobId,
        userId
      }
    });

    if (!job) {
      return next({
        statusCode: 404,
        message: 'Job not found',
        details: { jobId }
      });
    }

    // Prepare response
    const response = {
      status: 'success',
      data: {
        jobId: job.jobId,
        status: job.status,
        createdAt: job.createdAt
      }
    };

    // Add result and completedAt if job is completed
    if (job.status === 'completed') {
      response.data.result = job.result;
      response.data.completedAt = job.completedAt;
    }

    // Add error if job failed
    if (job.status === 'failed') {
      response.data.error = job.error;
    }

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting job status', { error, jobId: req.params.jobId });
    next({
      statusCode: 500,
      message: 'Failed to get job status',
      details: { error: error.message }
    });
  }
};

/**
 * Get job history for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getJobHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Find all jobs for user with pagination
    const { count, rows: jobs } = await db.Job.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: ['jobId', 'status', 'createdAt', 'completedAt', 'resumeFormat']
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: 'success',
      data: {
        jobs,
        pagination: {
          total: count,
          page,
          limit,
          totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Error getting job history', { error, userId: req.user.userId });
    next({
      statusCode: 500,
      message: 'Failed to get job history',
      details: { error: error.message }
    });
  }
};