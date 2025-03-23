// workers/resumeProcessor.js
const db = require('../models');
const logger = require('../utils/logger');
const BaseWorker = require('../utils/BaseWorker');
const AIService = require('../utils/AIService');
const { parseResume } = require('../utils/resumeParser');
const { fetchJobDescription } = require('../utils/jobScraper');
const errorHandler = require('../utils/errorHandler');

/**
 * Worker for processing resume customization jobs
 */
class ResumeProcessor extends BaseWorker {
  /**
   * Initialize the resume processor
   */
  constructor() {
    super('resume-processing', {
      'customize-resume': this.processCustomization
    });
    
    this.aiService = new AIService(this.aiClient);
    logger.info('Resume processor worker started');
  }
  
  /**
   * Process a resume customization job
   * @param {Object} job - The job to process
   * @returns {Promise<Object>} - Processing result
   */
  async processCustomization(job) {
    const { jobId, userId, resumeContent, jobDescription } = job.data;
    logger.info('Processing resume customization job', { jobId });
    
    try {
      // Update job status
      await this.updateJobStatus(jobId, 'processing');
      
      // Parse resume if needed
      const parsedResumeContent = await this.parseResumeContent(job.data);
      
      // Fetch job description if needed
      const actualJobDescription = await this.fetchJobDescription(job.data);
      
      // Step 1: Generate professional profile
      const profileContent = await this.aiService.generateProfileFromResume(
        parsedResumeContent, 
        { profilerModel: job.data.profilerModel }
      );
      
      // Step 2: Analyze job description
      const researchContent = await this.aiService.analyzeJobDescription(
        actualJobDescription,
        { researcherModel: job.data.researcherModel }
      );
      
      // Step 3: Generate customized resume
      const customizedResume = await this.aiService.generateCustomizedResume(
        profileContent,
        researchContent,
        parsedResumeContent,
        { strategistModel: job.data.strategistModel }
      );
      
      // Update job with result
      await this.updateJobStatus(jobId, 'completed', { 
        result: customizedResume,
        completedAt: new Date()
      });
      
      logger.info('Resume customization completed successfully', { jobId });
      return { status: 'success', jobId };
      
    } catch (error) {
      errorHandler.captureError(error, { jobId, userId });
      await this.handleProcessingError(jobId, error);
      throw error;
    }
  }
  
  /**
   * Parse resume content based on format
   * @param {Object} jobData - Job data containing resume content and format
   * @returns {Promise<string>} - Parsed resume content
   */
  async parseResumeContent(jobData) {
    const { resumeContent, resumeFormat } = jobData;
    
    if (resumeFormat && resumeFormat !== 'text') {
      try {
        return await parseResume(resumeContent, resumeFormat);
      } catch (error) {
        logger.error('Resume parsing failed', { error, format: resumeFormat });
        throw new Error(`Failed to parse resume: ${error.message}`);
      }
    }
    
    return resumeContent;
  }
  
  /**
   * Fetch job description if it's a URL
   * @param {Object} jobData - Job data containing job description
   * @returns {Promise<string>} - Job description text
   */
  async fetchJobDescription(jobData) {
    const { jobDescription, isJobDescriptionUrl } = jobData;
    
    if (isJobDescriptionUrl && jobDescription.startsWith('http')) {
      try {
        return await fetchJobDescription(jobDescription);
      } catch (error) {
        logger.error('Job description fetching failed', { error, url: jobDescription });
        throw new Error(`Failed to fetch job description: ${error.message}`);
      }
    }
    
    return jobDescription;
  }
}

// Initialize and export worker
const resumeProcessor = new ResumeProcessor();
module.exports = resumeProcessor.queue;
