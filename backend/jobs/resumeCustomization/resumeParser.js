// jobs/resumeCustomization/resumeParser.js
const logger = require('../../utils/logger');
const { parseResume } = require('../../utils/resumeParser');

/**
 * Parse resume content based on format
 * @param {Object} jobData - Job data containing resume content and format
 * @returns {Promise<string>} - Parsed resume content
 */
async function parseResumeContent(jobData) {
  const { resumeContent, resumeFormat } = jobData;
  
  // Skip parsing if it's already in text format
  if (!resumeFormat || resumeFormat === 'text') {
    logger.debug('Resume already in text format, skipping parsing');
    return resumeContent;
  }
  
  try {
    logger.info('Parsing resume', { format: resumeFormat });
    return await parseResume(resumeContent, resumeFormat);
  } catch (error) {
    logger.error('Resume parsing failed', { 
      error, 
      format: resumeFormat,
      errorMessage: error.message
    });
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
}

module.exports = {
  parseResumeContent
};
