// utils/BaseWorker.js
const Queue = require('bull');
const axios = require('axios');
const config = require('../config/config');
const logger = require('./logger');
const db = require('../models');

/**
 * Base worker class that provides common functionality for all worker processors
 */
class BaseWorker {
  /**
   * Initialize a new worker with a queue and processors
   * @param {string} queueName - Name of the worker queue
   * @param {Object} processors - Object mapping processor names to handler functions
   */
  constructor(queueName, processors = {}) {
    this.queue = new Queue(queueName, {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined
      }
    });
    
    // Setup client for AI API
    this.aiClient = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${config.openrouter.apiKey}`,
        'HTTP-Referer': config.openrouter.serviceUrl,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 seconds timeout
    });
    
    // Register processors
    Object.entries(processors).forEach(([processorName, processorFn]) => {
      this.queue.process(processorName, processorFn.bind(this));
    });
    
    // Setup error handling
    this.queue.on('failed', this.handleFailedJob.bind(this));
    this.queue.on('error', this.handleQueueError.bind(this));
    
    logger.info(`Worker initialized: ${queueName}`);
  }
  
  /**
   * Handle failed jobs
   */
  handleFailedJob(job, error) {
    logger.error('Job failed', { 
      jobId: job.data.jobId,
      error: error.message,
      stack: error.stack
    });
  }
  
  /**
   * Handle queue errors
   */
  handleQueueError(error) {
    logger.error('Queue error', { error: error.message });
  }
  
  /**
   * Update job status in the database
   */
  async updateJobStatus(jobId, status, additionalData = {}) {
    try {
      await db.Job.update({
        status,
        ...additionalData
      }, {
        where: { jobId }
      });
    } catch (error) {
      logger.error('Failed to update job status', { jobId, status, error });
      throw new Error(`Database update failed: ${error.message}`);
    }
  }
  
  /**
   * Handle processing errors
   */
  async handleProcessingError(jobId, error) {
    logger.error('Job processing failed', { error, jobId });
    
    try {
      await this.updateJobStatus(jobId, 'failed', { 
        error: error.message 
      });
    } catch (dbError) {
      logger.error('Failed to update job status after error', { 
        jobId, 
        originalError: error.message,
        dbError
      });
    }
  }
}

module.exports = BaseWorker;
