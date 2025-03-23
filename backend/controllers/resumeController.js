// controllers/resumeController.js
const { v4: uuidv4 } = require('uuid');
const Queue = require('bull');
const db = require('../models');
const logger = require('../utils/logger');

// Initialize queue
const resumeQueue = new Queue('resume-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

/**
 * Submit a resume for customization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.customizeResume = async (req, res) => {
  try {
    const {
      resumeContent,
      jobDescription,
      resumeFormat = 'text',
      isJobDescriptionUrl = false,
      profilerModel,
      researcherModel,
      strategistModel
    } = req.body;

    // Validate required fields
    if (!resumeContent) {
      return res.status(400).json({
        status: 'error',
        message: 'Resume content is required'
      });
    }

    if (!jobDescription) {
      return res.status(400).json({
        status: 'error',
        message: 'Job description is required'
      });
    }

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
    });

    logger.info('Resume customization job submitted', { jobId: job.jobId, userId });

    res.status(200).json({
      status: 'success',
      message: 'Resume customization job submitted successfully',
      data: {
        jobId: job.jobId
      }
    });
  } catch (error) {
    logger.error('Error submitting resume customization job', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit resume customization job'
    });
  }
};

/**
 * Get status of a job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;

    // Find job in database
    const job = await db.Job.findOne({
      where: {
        jobId,
        userId
      }
    });

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
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
    logger.error('Error getting job status', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get job status'
    });
  }
};

/**
 * Get job history for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getJobHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all jobs for user
    const jobs = await db.Job.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      attributes: ['jobId', 'status', 'createdAt', 'completedAt']
    });

    res.status(200).json({
      status: 'success',
      data: {
        jobs
      }
    });
  } catch (error) {
    logger.error('Error getting job history', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get job history'
    });
  }
};
