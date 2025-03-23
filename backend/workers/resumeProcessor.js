// workers/resumeProcessor.js
const Queue = require('bull');
const axios = require('axios');
const db = require('../models');
const logger = require('../utils/logger');
const { loadPromptTemplate } = require('../utils/promptManager');
const { parseResume } = require('../utils/resumeParser');
const { fetchJobDescription } = require('../utils/jobScraper');

// Initialize OpenRouter client
const openrouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': process.env.SERVICE_URL, // Your service URL for tracking
    'Content-Type': 'application/json'
  }
});

// Initialize queue
const resumeQueue = new Queue('resume-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Process resume customization jobs
resumeQueue.process('customize-resume', async (job) => {
  const { jobId, userId, resumeContent, jobDescription } = job.data;
  logger.info('Processing resume customization job', { jobId });
  
  try {
    // Update job status
    await db.Job.update({
      status: 'processing'
    }, {
      where: { jobId }
    });
    
    // Parse resume if it's not plain text (could be PDF, DOCX, etc.)
    let parsedResumeContent = resumeContent;
    if (job.data.resumeFormat && job.data.resumeFormat !== 'text') {
      parsedResumeContent = await parseResume(resumeContent, job.data.resumeFormat);
    }
    
    // Fetch job description if URL is provided
    let actualJobDescription = jobDescription;
    if (job.data.isJobDescriptionUrl && jobDescription.startsWith('http')) {
      actualJobDescription = await fetchJobDescription(jobDescription);
    }
    
    // Get model selection from job data or use default
    const profilerModel = job.data.profilerModel || process.env.DEFAULT_PROFILER_MODEL || 'anthropic/claude-3-opus';
    const researcherModel = job.data.researcherModel || process.env.DEFAULT_RESEARCHER_MODEL || 'anthropic/claude-3-opus';
    const strategistModel = job.data.strategistModel || process.env.DEFAULT_STRATEGIST_MODEL || 'anthropic/claude-3-opus';
    
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
    
    const customizedResume = strategistResponse.data.choices[0].message.content;
    
    // Update job with result
    await db.Job.update({
      status: 'completed',
      result: customizedResume,
      completedAt: new Date()
    }, {
      where: { jobId }
    });
    
    logger.info('Resume customization completed successfully', { jobId });
    return { status: 'success', jobId };
    
  } catch (error) {
    logger.error('Resume customization failed', { error, jobId });
    
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
resumeQueue.on('failed', (job, error) => {
  logger.error('Job failed', { 
    jobId: job.data.jobId,
    error: error.message,
    stack: error.stack
  });
});

logger.info('Resume processor worker started');

module.exports = resumeQueue;
