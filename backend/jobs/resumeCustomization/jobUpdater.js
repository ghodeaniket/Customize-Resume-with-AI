// jobs/resumeCustomization/jobUpdater.js
const logger = require('../../utils/logger');
const db = require('../../models');

/**
 * Update job status in the database
 * @param {string} jobId - ID of the job to update
 * @param {string} status - New status of the job
 * @param {Object} additionalData - Additional fields to update
 * @returns {Promise<void>}
 */
async function updateJobStatus(jobId, status, additionalData = {}) {
  try {
    logger.debug('Updating job status', { jobId, status });
    
    await db.Job.update({
      status,
      ...additionalData
    }, {
      where: { jobId }
    });
    
    logger.debug('Job status updated successfully', { jobId, status });
  } catch (error) {
    logger.error('Failed to update job status', { 
      jobId, 
      status, 
      error,
      errorMessage: error.message
    });
    
    throw new Error(`Database update failed: ${error.message}`);
  }
}

/**
 * Get job status from the database
 * @param {string} jobId - ID of the job to get
 * @returns {Promise<Object>} - Job information
 */
async function getJobStatus(jobId) {
  try {
    const job = await db.Job.findOne({
      where: { jobId }
    });
    
    return job;
  } catch (error) {
    logger.error('Failed to get job status', { 
      jobId, 
      error,
      errorMessage: error.message
    });
    
    throw new Error(`Database query failed: ${error.message}`);
  }
}

module.exports = {
  updateJobStatus,
  getJobStatus
};
