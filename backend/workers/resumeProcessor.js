// workers/resumeProcessor.js
const BaseWorker = require('../utils/BaseWorker');
const AIService = require('../utils/AIService');
const logger = require('../utils/logger');
const { resumeCustomization } = require('../jobs');

/**
 * Worker for processing resume customization jobs
 */
class ResumeProcessor extends BaseWorker {
  /**
   * Initialize the resume processor
   */
  constructor() {
    // Initialize the base worker with the queue name and processors mapping
    const processors = {
      'customize-resume': async function(job) {
        return await resumeCustomization.processResumeCustomizationJob(job, this.services);
      }
    };
    
    super('resume-processing', processors);
    
    // Set up services after super() call
    this.aiService = new AIService(this.aiClient);
    this.services = {
      aiService: this.aiService
    };
    
    logger.info('Resume processor worker started');
  }
}

// Initialize and export worker
const resumeProcessor = new ResumeProcessor();
module.exports = resumeProcessor.queue;
