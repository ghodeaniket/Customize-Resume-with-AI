// jobs/resumeCustomization/processor.js
const logger = require('../../utils/logger');
const errorHandler = require('../../utils/errorHandler');
const { parseResumeContent } = require('./resumeParser');
const { fetchJobDescriptionContent } = require('./jobDescriptionFetcher');
const { processAISteps } = require('./aiProcessor');
const { formatOutput } = require('./outputFormatter');
const { updateJobStatus } = require('./jobUpdater');

/**
 * Process a resume customization job
 * @param {Object} job - The job data from the queue
 * @param {Object} services - Service dependencies (AIService, etc.)
 * @returns {Promise<Object>} - Result of the processing
 */
async function processResumeCustomizationJob(job, services) {
  const { jobId, userId } = job.data;
  logger.info('Processing resume customization job', { jobId });
  
  try {
    // Update job status to processing
    await updateJobStatus(jobId, 'processing');
    
    // Step 1: Parse resume content
    const parsedResumeContent = await parseResumeContent(job.data);
    
    // Step 2: Fetch and parse job description
    const actualJobDescription = await fetchJobDescriptionContent(job.data);
    
    // Step 3: Process with AI (profile generation, analysis, customization)
    const { customizedResume } = await processAISteps(
      parsedResumeContent,
      actualJobDescription,
      job.data,
      services.aiService
    );
    
    // Step 4: Format output according to requested format
    const { formattedResult, resultMimeType } = await formatOutput(
      customizedResume,
      job.data,
      services
    );
    
    // Step 5: Update job with result
    const metadata = {
      optimizationPreset: job.data.optimizationFocus || 'default',
      outputFormat: job.data.outputFormat || 'text',
      models: {
        profiler: job.data.profilerModel || process.env.DEFAULT_PROFILER_MODEL,
        researcher: job.data.researcherModel || process.env.DEFAULT_RESEARCHER_MODEL,
        strategist: job.data.strategistModel || process.env.DEFAULT_STRATEGIST_MODEL
      }
    };
    
    await updateJobStatus(jobId, 'completed', { 
      result: formattedResult,
      resultMimeType,
      completedAt: new Date(),
      metadata: JSON.stringify(metadata)
    });
    
    logger.info('Resume customization completed successfully', { 
      jobId, 
      outputFormat: job.data.outputFormat || 'text' 
    });
    
    return { status: 'success', jobId };
    
  } catch (error) {
    errorHandler.captureError(error, { jobId, userId });
    await updateJobStatus(jobId, 'failed', { error: error.message });
    throw error;
  }
}

module.exports = processResumeCustomizationJob;
