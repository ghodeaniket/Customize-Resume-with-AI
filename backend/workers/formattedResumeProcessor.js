// workers/formattedResumeProcessor.js
const db = require('../models');
const logger = require('../utils/logger');
const BaseWorker = require('../utils/BaseWorker');
const AIService = require('../utils/AIService');
const { parseResumeWithFormatting } = require('../utils/enhancedResumeParser');
const { fetchJobDescription } = require('../utils/jobScraper');
const { reconstructDocument } = require('../utils/documentReconstructor');
const errorHandler = require('../utils/errorHandler');

/**
 * Worker for processing formatted resume customization jobs
 */
class FormattedResumeProcessor extends BaseWorker {
  /**
   * Initialize the formatted resume processor
   */
  constructor() {
    super('formatted-resume-processing', {
      'customize-formatted-resume': this.processFormattedCustomization
    });
    
    this.aiService = new AIService(this.aiClient);
    logger.info('Formatted resume processor worker started');
  }
  
  /**
   * Process a formatted resume customization job
   * @param {Object} job - The job to process
   * @returns {Promise<Object>} - Processing result
   */
  async processFormattedCustomization(job) {
    const { jobId, userId, resumeContent, jobDescription } = job.data;
    logger.info('Processing formatted resume customization job', { jobId });
    
    try {
      // Update job status
      await this.updateJobStatus(jobId, 'processing');
      
      // Parse resume with formatting preserved
      const parsedResumeData = await this.parseFormattedResume(job.data);
      const parsedResumeContent = parsedResumeData.text;
      
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
      const customizedTextContent = await this.aiService.generateCustomizedResume(
        profileContent,
        researchContent,
        parsedResumeContent,
        { strategistModel: job.data.strategistModel }
      );
      
      // Step 4: Create a formatted PDF with the customized content
      const pdfBuffer = await reconstructDocument(parsedResumeData, customizedTextContent);
      
      // Convert the PDF buffer to base64 for storage
      const pdfBase64 = pdfBuffer.toString('base64');
      
      // Update job with result
      await this.updateJobStatus(jobId, 'completed', {
        result: customizedTextContent,
        formattedResult: pdfBase64,
        resultFormat: 'pdf',
        completedAt: new Date()
      });
      
      logger.info('Formatted resume customization completed successfully', { jobId });
      return { status: 'success', jobId };
      
    } catch (error) {
      errorHandler.captureError(error, { jobId, userId });
      await this.handleProcessingError(jobId, error);
      throw error;
    }
  }
  
  /**
   * Parse formatted resume content based on format
   * @param {Object} jobData - Job data containing resume content and format
   * @returns {Promise<Object>} - Parsed resume data
   */
  async parseFormattedResume(jobData) {
    const { resumeContent, resumeFormat } = jobData;
    
    if (resumeFormat && resumeFormat !== 'text') {
      try {
        return await parseResumeWithFormatting(resumeContent, resumeFormat);
      } catch (error) {
        logger.error('Formatted resume parsing failed', { error, format: resumeFormat });
        throw new Error(`Failed to parse formatted resume: ${error.message}`);
      }
    }
    
    // For plain text, create a simple structure
    return {
      text: resumeContent,
      format: 'text',
      structure: {
        type: 'text',
        content: resumeContent
      },
      originalBuffer: null
    };
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
const formattedResumeProcessor = new FormattedResumeProcessor();
module.exports = formattedResumeProcessor.queue;