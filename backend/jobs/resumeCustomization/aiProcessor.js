// jobs/resumeCustomization/aiProcessor.js
const logger = require('../../utils/logger');

/**
 * Process the AI steps for resume customization
 * @param {string} parsedResumeContent - The parsed resume content
 * @param {string} jobDescription - The job description content
 * @param {Object} jobData - The job configuration data
 * @param {Object} aiService - The AI service for making requests
 * @returns {Promise<Object>} - Results of AI processing
 */
async function processAISteps(parsedResumeContent, jobDescription, jobData, aiService) {
  // Get optimization preset from job data
  const optimizationPreset = jobData.optimizationFocus || 'default';
  logger.info('Using optimization preset', { optimizationPreset });
  
  // Common options for all AI requests
  const aiOptions = {
    optimizationPreset,
    profilerModel: jobData.profilerModel,
    researcherModel: jobData.researcherModel,
    strategistModel: jobData.strategistModel
  };
  
  try {
    // Step 1: Generate professional profile
    logger.info('Starting professional profile generation');
    const profileContent = await aiService.generateProfileFromResume(
      parsedResumeContent, 
      aiOptions
    );
    
    // Step 2: Analyze job description
    logger.info('Starting job description analysis');
    const researchContent = await aiService.analyzeJobDescription(
      jobDescription,
      aiOptions
    );
    
    // Step 3: Generate customized resume
    logger.info('Starting resume customization');
    const customizedResume = await aiService.generateCustomizedResume(
      profileContent,
      researchContent,
      parsedResumeContent,
      aiOptions
    );
    
    return { 
      profileContent, 
      researchContent, 
      customizedResume 
    };
  } catch (error) {
    logger.error('AI processing failed', { 
      error, 
      stage: error.stage || 'unknown',
      errorMessage: error.message 
    });
    
    // Add more context to the error
    const enrichedError = new Error(`AI processing failed: ${error.message}`);
    enrichedError.stage = error.stage;
    enrichedError.originalError = error;
    
    throw enrichedError;
  }
}

module.exports = {
  processAISteps
};
