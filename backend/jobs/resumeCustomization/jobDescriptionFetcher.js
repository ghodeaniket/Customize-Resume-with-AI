// jobs/resumeCustomization/jobDescriptionFetcher.js
const logger = require('../../utils/logger');
const { fetchJobDescription } = require('../../utils/jobScraper');

/**
 * Fetch job description if it's a URL
 * @param {Object} jobData - Job data containing job description
 * @returns {Promise<string>} - Job description text
 */
async function fetchJobDescriptionContent(jobData) {
  const { jobDescription, isJobDescriptionUrl } = jobData;
  
  // Return as is if it's not a URL
  if (!isJobDescriptionUrl || !jobDescription.startsWith('http')) {
    logger.debug('Job description is plain text, skipping fetching');
    return jobDescription;
  }
  
  try {
    logger.info('Fetching job description from URL', { url: jobDescription });
    const result = await fetchJobDescription(jobDescription);
    
    // Log the length of the fetched description for debugging
    logger.debug('Job description fetched successfully', { 
      length: result.length,
      url: jobDescription 
    });
    
    return result;
  } catch (error) {
    logger.error('Job description fetching failed', { 
      error, 
      url: jobDescription,
      errorMessage: error.message
    });
    
    throw new Error(`Failed to fetch job description: ${error.message}`);
  }
}

module.exports = {
  fetchJobDescriptionContent
};
