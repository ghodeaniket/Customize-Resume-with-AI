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
    
    // Step 1: Initialize the AI Agents
    console.log('Initializing AI Agents...');
    
    // Read the prompt files from the main project
    console.log('Loading prompts from files...');
    
    // Define prompt file paths
    const promptPaths = {
      profiler: '/Users/aniketghode/development/Customize-Resume-with-AI/backend/prompts/profiler-enhanced.txt',
      researcher: '/Users/aniketghode/development/Customize-Resume-with-AI/backend/prompts/researcher-enhanced.txt',
      factExtractor: '/Users/aniketghode/development/Customize-Resume-with-AI/backend/prompts/fact-extractor.txt',
      strategist: '/Users/aniketghode/development/Customize-Resume-with-AI/backend/prompts/resume-strategist-enhanced.txt',
      factVerifier: '/Users/aniketghode/development/Customize-Resume-with-AI/backend/prompts/fact-verifier.txt'
    };
    
    // Read all prompt files
    const prompts = {};
    for (const [agentName, promptPath] of Object.entries(promptPaths)) {
      try {
        prompts[agentName] = fs.readFileSync(promptPath, 'utf8');
        console.log(`Successfully loaded ${agentName} prompt`);
      } catch (error) {
        console.error(`Failed to load ${agentName} prompt: ${error.message}`);
        prompts[agentName] = `You are the ${agentName}. Please analyze the content and provide insights.`;
      }
    }
    
    // Define the AI Agents with their respective prompts and models
    const AIAgents = {
      // The Profiler agent - analyzes the resume
      profiler: {
        prompt: prompts.profiler,
        model: 'anthropic/claude-3-sonnet',
        temperature: 0.7,
        max_tokens: 2000
      },
      
      // The Researcher agent - analyzes the job description
      researcher: {
        prompt: prompts.researcher,
        model: 'anthropic/claude-3-sonnet',
        temperature: 0.7,
        max_tokens: 2000
      },
      
      // The Fact Extractor agent - extracts factual information from the resume
      factExtractor: {
        prompt: prompts.factExtractor,
        model: 'anthropic/claude-3-sonnet',
        temperature: 0.1,
        max_tokens: 2000
      },
      
      // The Strategist agent - creates the customized resume
      strategist: {
        prompt: prompts.strategist,
        model: 'anthropic/claude-3-sonnet',
        temperature: 0.3,
        max_tokens: 3000
      },
      
      // The Fact Verifier agent - verifies and corrects the final resume
      factVerifier: {
        prompt: prompts.factVerifier,
        model: 'anthropic/claude-3-sonnet',
        temperature: 0.2,
        max_tokens: 3000
      }
    };
    
    // The Profiler: Generate professional profile from the resume
    console.log('Step 1: The Profiler is analyzing your resume...');
    const profilerAgent = AIAgents.profiler;
    const profilerResponse = await openrouterClient.post('/chat/completions', {
      model: profilerAgent.model,
      messages: [
        { role: "system", content: profilerAgent.prompt },
        { role: "user", content: resumeContent }
      ],
      temperature: profilerAgent.temperature,
      max_tokens: profilerAgent.max_tokens
    });
    
    const profileContent = profilerResponse.data.choices[0].message.content;
    console.log('Profiler analysis complete!');
    
    // The Researcher: Analyze the job description
    console.log('Step 2: The Researcher is analyzing the job description...');
    const researcherAgent = AIAgents.researcher;
    const researcherResponse = await openrouterClient.post('/chat/completions', {
      model: researcherAgent.model,
      messages: [
        { role: "system", content: researcherAgent.prompt },
        { role: "user", content: jobDescription }
      ],
      temperature: researcherAgent.temperature,
      max_tokens: researcherAgent.max_tokens
    });
    
    const researchContent = researcherResponse.data.choices[0].message.content;
    console.log('Researcher analysis complete!');
    
    // The Fact Extractor: Extract factual information for verification
    console.log('Step 3: The Fact Extractor is identifying factual details...');
    const factExtractorAgent = AIAgents.factExtractor;
    const factExtractorResponse = await openrouterClient.post('/chat/completions', {
      model: factExtractorAgent.model,
      messages: [
        { role: "system", content: factExtractorAgent.prompt },
        { role: "user", content: resumeContent }
      ],
      temperature: factExtractorAgent.temperature,
      max_tokens: factExtractorAgent.max_tokens
    });
    
    let factualInfo = {};
    try {
      factualInfo = JSON.parse(factExtractorResponse.data.choices[0].message.content);
      console.log('Factual information extracted successfully');
    } catch (error) {
      console.warn('Failed to parse factual information, using raw text instead', error);
      factualInfo = { rawFactualData: factExtractorResponse.data.choices[0].message.content };
    }
    
    // The Strategist: Generate the customized resume
    console.log('Step 4: The Strategist is crafting your customized resume...');
    const strategistAgent = AIAgents.strategist;
    const strategistContent = `
# Candidate Profile (from The Profiler)
${profileContent}

# Job Description Analysis (from The Researcher)
${researchContent}

# Original Resume
${resumeContent}

# Factual Information to Preserve Exactly (from The Fact Extractor)
${JSON.stringify(factualInfo, null, 2)}

IMPORTANT: Ensure all factual information (company names, job titles, dates, education details) 
exactly matches the original resume. Do not invent or modify any employment history, education credentials, 
or dates. Only enhance descriptions, achievements, and skills based on the job requirements.

Based on the above information, create a customized resume that highlights relevant skills and experiences for this specific job.
`;
    
    const strategistResponse = await openrouterClient.post('/chat/completions', {
      model: strategistAgent.model,
      messages: [
        { role: "system", content: strategistAgent.prompt },
        { role: "user", content: strategistContent }
      ],
      temperature: strategistAgent.temperature,
      max_tokens: strategistAgent.max_tokens
    });
    
    let customizedResume = strategistResponse.data.choices[0].message.content;
    console.log('Strategist has completed the resume customization!');
    
    // The Fact Verifier: Verify and correct any factual discrepancies
    console.log('Step 5: The Fact Verifier is ensuring factual accuracy...');
    const factVerifierAgent = AIAgents.factVerifier;
    const verifierContent = `
# Original Factual Information (from The Fact Extractor)
${JSON.stringify(factualInfo, null, 2)}

# Generated Resume (from The Strategist)
${customizedResume}

Please verify the factual information in the generated resume against the original facts and make any necessary corrections while preserving the enhancements.
`;

    const verifierResponse = await openrouterClient.post('/chat/completions', {
      model: factVerifierAgent.model,
      messages: [
        { role: "system", content: factVerifierAgent.prompt },
        { role: "user", content: verifierContent }
      ],
      temperature: factVerifierAgent.temperature,
      max_tokens: factVerifierAgent.max_tokens
    });
    
    customizedResume = verifierResponse.data.choices[0].message.content;
    console.log('Fact verification complete! Your resume is ready.');
    
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
