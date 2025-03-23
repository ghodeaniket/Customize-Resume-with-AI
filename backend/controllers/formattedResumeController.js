// controllers/formattedResumeController.js
const { v4: uuidv4 } = require('uuid');
const Queue = require('bull');
const db = require('../models');
const logger = require('../utils/logger');
const config = require('../config/config');

// Initialize queue
const formattedResumeQueue = new Queue('formatted-resume-processing', {
  redis: {
    host: config.redis.host,
    port: config.redis.port
  }
});

/**
 * Submit a resume for customization with formatting preserved
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.customizeFormattedResume = async (req, res) => {
  try {
    const {
      resumeContent,
      jobDescription,
      resumeFormat = 'text',
      isJobDescriptionUrl = false,
      profilerModel,
      researcherModel,
      strategistModel,
      preserveFormatting = true
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

    // Add job to processing queue based on formatting preference
    if (preserveFormatting) {
      await formattedResumeQueue.add('customize-formatted-resume', {
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
      
      logger.info('Formatted resume customization job submitted', { jobId: job.jobId, userId });
    } else {
      // Use the regular resume queue for text-only output
      const resumeQueue = require('../workers/resumeProcessor');
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
      
      logger.info('Standard resume customization job submitted', { jobId: job.jobId, userId });
    }
    
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
 * Get status of a job including formatted result if available
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getFormattedJobStatus = async (req, res) => {
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
        createdAt: job.createdAt,
        resultFormat: job.resultFormat || null
      }
    };

    // Add result and completedAt if job is completed
    if (job.status === 'completed') {
      response.data.result = job.result;
      
      // Include formatted result if available
      if (job.formattedResult) {
        response.data.formattedResult = job.formattedResult;
      }
      
      response.data.completedAt = job.completedAt;
    }

    // Add error if job failed
    if (job.status === 'failed') {
      response.data.error = job.error;
    }

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting formatted job status', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get job status'
    });
  }
};

/**
 * Get the formatted PDF result
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getFormattedPdfResult = async (req, res) => {
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

    if (job.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Job is not completed'
      });
    }

    if (!job.formattedResult) {
      return res.status(404).json({
        status: 'error',
        message: 'No formatted result available'
      });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(job.formattedResult, 'base64');

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="customized-resume-${jobId}.pdf"`);
    
    // Send the PDF
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error getting formatted PDF result', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get formatted PDF result'
    });
  }
};
