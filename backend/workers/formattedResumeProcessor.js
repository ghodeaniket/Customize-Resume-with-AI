// workers/formattedResumeProcessor.js
const Queue = require('bull');
const axios = require('axios');
const config = require('../config/config');
const db = require('../models');
const logger = require('../utils/logger');
const { loadPromptTemplate } = require('../utils/promptManager');
const { parseResumeWithFormatting } = require('../utils/enhancedResumeParser');
const { fetchJobDescription } = require('../utils/jobScraper');
const { reconstructDocument } = require('../utils/documentReconstructor');

// Initialize OpenRouter client
const openrouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${config.openrouter.apiKey}`,
    'HTTP-Referer': config.openrouter.serviceUrl,
    'Content-Type': 'application/json'
  }
});

// Initialize queue
const formattedResumeQueue = new Queue('formatted-resume-processing', {
  redis: {
    host: config.redis.host,
    port: config.redis.port
  }
});

// Process resume customization jobs with formatting preservation
formattedResumeQueue.process('customize-formatted-resume', async (job) => {
  const { jobId, userId, resumeContent, jobDescription } = job.data;
  logger.info('Processing formatted resume customization job', { jobId });
  
  try {
    // Update job status
    await db.Job.update({
      status: 'processing'
    }, {
      where: { jobId }
    });
    
    // Parse resume with formatting preserved
    let parsedResumeData = null;
    if (job.data.resumeFormat && job.data.resumeFormat !== 'text') {
      parsedResumeData = await parseResumeWithFormatting(resumeContent, job.data.resumeFormat);
      logger.info('Resume parsed with formatting preserved', { 
        jobId, 
        format: parsedResumeData.format 
      });
    } else {
      // For plain text, create a simple structure
      parsedResumeData = {
        text: resumeContent,
        format: 'text',
        structure: {
          type: 'text',
          content: resumeContent
        },
        originalBuffer: null
      };
    }
    
    // Extract plain text for AI processing
    const parsedResumeContent = parsedResumeData.text;
    
    // Fetch job description if URL is provided
    let actualJobDescription = jobDescription;
    if (job.data.isJobDescriptionUrl && jobDescription.startsWith('http')) {
      actualJobDescription = await fetchJobDescription(jobDescription);
    }
    
    // Get model selection from job data or use default
    const profilerModel = job.data.profilerModel || config.openrouter.defaultModels.profiler;
    const researcherModel = job.data.researcherModel || config.openrouter.defaultModels.researcher;
    const strategistModel = job.data.strategistModel || config.openrouter.defaultModels.strategist;
    
    // Step 1: Generate professional profile
    const profilerPrompt = await loadPromptTemplate('profiler');
    const profilerResponse = await openrouterClient.post('/chat/completions', {
      model: profilerModel,
      messages: [
        { role: "system", content: profilerPrompt },
        { role: "user", content: parsedResumeContent }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const profileContent = profilerResponse.data.choices[0].message.content;
    
    // Step 2: Analyze job description
    const researcherPrompt = await loadPromptTemplate('researcher');
    const researcherResponse = await openrouterClient.post('/chat/completions', {
      model: researcherModel,
      messages: [
        { role: "system", content: researcherPrompt },
        { role: "user", content: actualJobDescription }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const researchContent = researcherResponse.data.choices[0].message.content;
    
    // Step 3: Generate customized resume
    const strategistPrompt = await loadPromptTemplate('resume-strategist');
    const strategistResponse = await openrouterClient.post('/chat/completions', {
      model: strategistModel,
      messages: [
        { role: "system", content: strategistPrompt },
        { role: "user", content: `comprehensive profile - ${profileContent}, recommendations - ${researchContent} and original resume - ${parsedResumeContent}` }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const customizedTextContent = strategistResponse.data.choices[0].message.content;
    
    // Step 4: Create a formatted PDF with the customized content
    const pdfBuffer = await reconstructDocument(parsedResumeData, customizedTextContent);
    
    // Convert the PDF buffer to base64 for storage
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Update job with result
    await db.Job.update({
      status: 'completed',
      result: customizedTextContent, // Store text for backward compatibility
      formattedResult: pdfBase64, // Store PDF as base64
      resultFormat: 'pdf',
      completedAt: new Date()
    }, {
      where: { jobId }
    });
    
    logger.info('Formatted resume customization completed successfully', { jobId });
    return { status: 'success', jobId };
    
  } catch (error) {
    logger.error('Formatted resume customization failed', { error, jobId });
    
    // Update job status to failed
    await db.Job.update({
      status: 'failed',
      error: error.message
    }, {
      where: { jobId }
    });
    
    throw error;
  }
});

// Handle errors
formattedResumeQueue.on('failed', (job, error) => {
  logger.error('Formatted job failed', { 
    jobId: job.data.jobId,
    error: error.message,
    stack: error.stack
  });
});

logger.info('Formatted resume processor worker started');

module.exports = formattedResumeQueue;
