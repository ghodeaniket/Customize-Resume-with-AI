// simplified/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 9000;

// In-memory storage for jobs
const jobs = new Map();

// Configure middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// OpenRouter client for AI requests
const openrouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || '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'}`,
    'HTTP-Referer': process.env.SERVICE_URL || 'http://localhost:3000',
    'Content-Type': 'application/json'
  },
  timeout: 60000 // 60 seconds timeout
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Resume customization endpoint
app.post('/api/v1/resume/customize', upload.single('file'), async (req, res) => {
  try {
    // Generate a unique job ID
    const jobId = uuidv4();
    
    // Create job record
    jobs.set(jobId, {
      jobId,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    // Process in background
    setTimeout(() => processJob(jobId, req), 0);
    
    // Return job ID
    res.status(201).json({
      status: 'success',
      message: 'Resume customization job submitted successfully',
      data: { jobId }
    });
  } catch (error) {
    console.error('Error submitting job:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit resume customization job',
      error: error.message
    });
  }
});

// Job status endpoint
app.get('/api/v1/resume/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  // Get job from storage
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      status: 'error',
      message: 'Job not found'
    });
  }
  
  // Prepare response
  const response = {
    status: 'success',
    data: {
      jobId: job.jobId,
      status: job.status,
      createdAt: job.createdAt
    }
  };
  
  // Add result if job is completed
  if (job.status === 'completed') {
    response.data.result = job.result;
    response.data.completedAt = job.completedAt;
  }
  
  // Add error if job failed
  if (job.status === 'failed') {
    response.data.error = job.error;
  }
  
  res.json(response);
});

// Job history endpoint
app.get('/api/v1/resume/history', (req, res) => {
  // Convert jobs Map to array
  const jobList = Array.from(jobs.values()).map(job => ({
    jobId: job.jobId,
    status: job.status,
    createdAt: job.createdAt,
    completedAt: job.completedAt
  }));
  
  res.json({
    status: 'success',
    data: { jobs: jobList }
  });
});

// Process job in background
async function processJob(jobId, req) {
  try {
    console.log(`Processing job ${jobId}...`);
    
    // Update job status
    const job = jobs.get(jobId);
    job.status = 'processing';
    jobs.set(jobId, job);
    
    // Get data from request
    let resumeContent;
    let resumeFormat;
    
    // Handle file upload
    if (req.file) {
      // Save file to disk
      const filePath = path.join(uploadsDir, req.file.originalname);
      fs.writeFileSync(filePath, req.file.buffer);
      
      // Use file content as resume
      resumeContent = req.file.buffer.toString('utf-8');
      resumeFormat = req.file.originalname.split('.').pop() || 'txt';
    } else if (req.body.resumeContent) {
      // Use provided resume content
      resumeContent = req.body.resumeContent;
      resumeFormat = req.body.resumeFormat || 'text';
    } else {
      throw new Error('No resume content provided');
    }
    
    // Get job description
    const jobDescription = req.body.jobDescription;
    if (!jobDescription) {
      throw new Error('No job description provided');
    }
    
    // Step 1: Generate professional profile
    console.log('Generating professional profile...');
    const profilerPrompt = `
You are a professional resume analyzer. Extract a comprehensive professional profile from this resume 
that highlights the person's skills, experiences, and achievements. Focus on transferable skills and 
qualities that would be valuable for a job search. Be detailed and thorough in your analysis.
`;
    
    const profilerResponse = await openrouterClient.post('/chat/completions', {
      model: 'anthropic/claude-3-sonnet',
      messages: [
        { role: "system", content: profilerPrompt },
        { role: "user", content: resumeContent }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const profileContent = profilerResponse.data.choices[0].message.content;
    
    // Step 2: Analyze job description
    console.log('Analyzing job description...');
    const researcherPrompt = `
You are a job market research specialist. Analyze the following job description and extract:
1. Key skills and qualifications required
2. Main responsibilities and duties
3. Company values and culture indicators
4. Industry-specific keywords and terminology
5. Recommended talking points for applications

Be specific and detailed in your analysis.
`;
    
    const researcherResponse = await openrouterClient.post('/chat/completions', {
      model: 'anthropic/claude-3-sonnet',
      messages: [
        { role: "system", content: researcherPrompt },
        { role: "user", content: jobDescription }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const researchContent = researcherResponse.data.choices[0].message.content;
    
    // Step 3: Generate customized resume
    console.log('Generating customized resume...');
    const strategistPrompt = `
You are a professional resume writer. Your task is to create a tailored resume based on:
1. The candidate's comprehensive profile derived from their original resume
2. Analysis of the job description they are applying for
3. The content of their original resume

Follow these guidelines:
- Keep all factual information (names, dates, education, job titles) EXACTLY as in the original resume
- Enhance descriptions to highlight relevant skills and achievements for this specific job
- Use strong action verbs and quantify achievements where possible
- Maintain the same chronological order of education and experience
- Format the resume in clean Markdown format
- Maintain professionalism and accuracy

Create a resume that maintains the candidate's authentic history while positioning them optimally for this specific job.
`;
    
    const content = `
# Candidate Profile
${profileContent}

# Job Description Analysis
${researchContent}

# Original Resume
${resumeContent}

Based on this information, please create a tailored, customized resume that highlights the candidate's relevant skills and experiences for this job opportunity. Format the resume in clean Markdown.
`;
    
    const strategistResponse = await openrouterClient.post('/chat/completions', {
      model: 'anthropic/claude-3-sonnet',
      messages: [
        { role: "system", content: strategistPrompt },
        { role: "user", content: content }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });
    
    const customizedResume = strategistResponse.data.choices[0].message.content;
    
    // Update job with result
    job.status = 'completed';
    job.result = customizedResume;
    job.completedAt = new Date().toISOString();
    jobs.set(jobId, job);
    
    console.log(`Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    
    // Update job status to failed
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      jobs.set(jobId, job);
    }
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Simplified resume customizer running on port ${PORT}`);
});
