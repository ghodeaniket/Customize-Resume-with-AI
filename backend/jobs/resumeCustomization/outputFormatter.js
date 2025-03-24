// jobs/resumeCustomization/outputFormatter.js
const logger = require('../../utils/logger');

/**
 * Format the customized resume according to the requested output format
 * @param {string} customizedResume - The customized resume content
 * @param {Object} jobData - The job configuration data
 * @param {Object} services - Service dependencies
 * @returns {Promise<Object>} - Formatted result and MIME type
 */
async function formatOutput(customizedResume, jobData, services) {
  // Default to plain text if no format specified
  if (!jobData.outputFormat || jobData.outputFormat === 'text') {
    logger.debug('Output format is text, no conversion needed');
    return { 
      formattedResult: customizedResume,
      resultMimeType: 'text/plain'
    };
  }
  
  logger.info('Converting to requested output format', { 
    format: jobData.outputFormat 
  });
  
  try {
    // Lazy-load the FormatService only when needed
    const FormatService = require('../../utils/FormatService');
    const formatService = new FormatService();
    
    // Format conversion options
    const formatOptions = {
      aiService: services.aiService,
      promptManager: require('../../utils/promptManager'),
      markdownModel: jobData.markdownModel,
      htmlModel: jobData.htmlModel
    };
    
    // Get original format information if input was a PDF
    if (jobData.resumeFormat === 'pdf' && jobData.preserveOriginalFormat) {
      logger.debug('Analyzing original PDF format');
      const originalFormatInfo = await formatService.analyzePdfFormat(jobData.resumeContent);
      formatOptions.formatInfo = originalFormatInfo;
    }
    
    // Convert to requested format
    const formattedResult = await formatService.convertToFormat(
      customizedResume, 
      jobData.outputFormat,
      formatOptions
    );
    
    // Set appropriate MIME type for the result
    let resultMimeType = 'text/plain';
    switch (jobData.outputFormat.toLowerCase()) {
      case 'markdown':
        resultMimeType = 'text/markdown';
        break;
      case 'html':
        resultMimeType = 'text/html';
        break;
      case 'pdf':
        resultMimeType = 'application/pdf';
        break;
      default:
        resultMimeType = 'text/plain';
    }
    
    return { formattedResult, resultMimeType };
  } catch (error) {
    logger.error('Output formatting failed', { 
      error, 
      format: jobData.outputFormat,
      errorMessage: error.message
    });
    
    // Fall back to plain text on error
    logger.warn('Falling back to plain text output due to formatting error');
    return { 
      formattedResult: customizedResume,
      resultMimeType: 'text/plain'
    };
  }
}

module.exports = {
  formatOutput
};
