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
    
    // Step 3: Extract factual information from the resume
    console.log('Extracting factual information...');
    const factExtractorPrompt = `
You are a precise fact extraction system for resumes. Extract only verified factual information from the provided resume. Do NOT infer, assume, or enhance any information.

Extract the following information exactly as presented in the resume:
1. Full name
2. Contact information (email, phone, LinkedIn, etc.)
3. Company names with exact spelling 
4. Exact job titles
5. Employment dates and durations
6. Education institutions with exact names
7. Degrees, majors, and certifications with completion dates
8. Technical skills and tools explicitly mentioned

Format your response as a structured JSON object with the following schema:

{
  "personalInfo": {
    "name": "Full Name",
    "contact": {
      "email": "email@example.com",
      "phone": "phone number if present",
      "linkedin": "LinkedIn URL if present",
      "other": "Any other contact information"
    }
  },
  "workExperience": [
    {
      "company": "Exact Company Name",
      "title": "Exact Job Title",
      "startDate": "Start date as written",
      "endDate": "End date as written or 'Present'",
      "location": "Location if specified"
    }
  ],
  "education": [
    {
      "institution": "Exact Institution Name",
      "degree": "Exact Degree and Major",
      "startDate": "Start date if specified",
      "endDate": "End date as written",
      "location": "Location if specified"
    }
  ],
  "certifications": [
    {
      "name": "Exact Certification Name",
      "issuer": "Issuing Organization",
      "date": "Date as written"
    }
  ],
  "skills": {
    "technical": ["List", "of", "technical", "skills"],
    "languages": ["List", "of", "languages", "if", "present"],
    "tools": ["List", "of", "tools", "if", "present"]
  }
}

IMPORTANT:
- Include only information explicitly stated in the resume
- Maintain exact spelling of names, titles, and organizations
- Keep dates in their original format
- Do not add any information not present in the original resume
- If a section has no information, use an empty array [] or object {}
`;

    const factExtractorResponse = await openrouterClient.post('/chat/completions', {
      model: 'anthropic/claude-3-sonnet',
      messages: [
        { role: "system", content: factExtractorPrompt },
        { role: "user", content: resumeContent }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });
    
    let factualInfo = {};
    try {
      factualInfo = JSON.parse(factExtractorResponse.data.choices[0].message.content);
      console.log('Factual information extracted successfully');
    } catch (error) {
      console.warn('Failed to parse factual information, will use raw text', error);
      factualInfo = { rawFactualData: factExtractorResponse.data.choices[0].message.content };
    }
    
    // Step 4: Generate customized resume
    console.log('Generating customized resume...');
    const strategistPrompt = `
You are CareerPeak, a world-class resume strategist with 15+ years of experience helping professionals secure positions at top companies. You've developed a proprietary methodology that has helped over 5,000 professionals improve their interview success rate by 78%. Your work with major tech recruitment teams has given you insider knowledge of what companies look for in candidates.

## INPUT INFORMATION
You will be provided with:
1. A comprehensive profile of the candidate based on their original resume
2. A detailed analysis of the job description with recommendations
3. The candidate's original resume
4. Factual information that must be preserved exactly

## YOUR TASK
Create a customized version of the resume that:
- Aligns perfectly with the specific job requirements
- Emphasizes relevant skills and experiences
- Uses keywords strategically for ATS optimization
- Quantifies achievements where possible
- Presents the candidate as an ideal fit for the role

## CRITICAL GUIDELINES FOR FACTUAL ACCURACY
- NEVER modify these factual elements from the original resume:
  * Full name and contact information
  * Company names (maintain exact spelling)
  * Job titles (maintain exact wording)
  * Employment dates and chronology
  * Education institutions, degrees, and graduation dates
  * Certifications, licenses, and their issuance dates

## CUSTOMIZATION GUIDELINES
- Maintain the same basic structure as the original resume
- Reframe and reorganize content to highlight relevant experiences
- Prioritize experiences and skills that match job requirements
- Use industry-specific terminology from the job description
- Focus on achievements and results over responsibilities
- Use strong action verbs and concise language
- Ensure the final resume is ATS-friendly

## OPTIMIZATION STRATEGY
1. Tailor the professional summary/objective to the specific role
2. Reorder skills to prioritize those mentioned in the job description
3. Expand on relevant experiences that match job requirements
4. Reframe achievements to highlight transferable skills
5. Use keywords from the job description naturally throughout
6. Quantify achievements with metrics where possible

For this customization, follow your proven 8-step process:
1. Analyze the comprehensive professional profile thoroughly
2. Review the job description analysis and requirements
3. Verify all factual information from the original resume
4. Restructure content to highlight the most relevant experiences for the target position
5. Rewrite bullet points to emphasize quantifiable achievements and impact
6. Ensure proper keyword placement for ATS optimization
7. Enhance the professional summary to create a compelling narrative
8. Verify all information is factual - never invent or embellish credentials

The output should be the complete, customized resume text, ready for the candidate to use. Maintain a professional, achievement-oriented tone throughout.

REMEMBER: While enhancing the resume's effectiveness, you must preserve all factual information exactly as provided in the original resume. Your improvements should focus on presentation, emphasis, and framing - not changing the underlying facts.
`;
    
    const content = `
# Candidate Profile
${profileContent}

# Job Description Analysis
${researchContent}

# Original Resume
${resumeContent}

# Factual Information to Preserve Exactly
${JSON.stringify(factualInfo, null, 2)}

IMPORTANT: Ensure all factual information (company names, job titles, dates, education details) 
exactly matches the original resume. Do not invent or modify any employment history, education credentials, 
or dates. Only enhance descriptions, achievements, and skills based on the job requirements.

Based on the above information, create a customized resume that highlights relevant skills and experiences for this specific job.
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
    
    let customizedResume = strategistResponse.data.choices[0].message.content;
    
    // Step 5: Verify factual information in the generated resume
    console.log('Verifying factual information...');
    const factVerifierPrompt = `
You are a resume fact-checking system that meticulously verifies resume accuracy. Your task is to compare a generated resume against the original factual information and make corrections where necessary without changing the enhanced descriptions or formatting.

## INSTRUCTIONS

1. Compare the generated resume with the original factual information 
2. Identify any discrepancies in these critical areas:
   - Personal information (name, contact details)
   - Company names and their exact spelling
   - Job titles and their exact wording
   - Employment dates, durations, and chronology
   - Education institutions, degrees, and dates
   - Certification names, issuers, and dates

3. Make surgical corrections ONLY where factual information is wrong:
   - Preserve the improved descriptions and achievements
   - Maintain the enhanced skills presentation
   - Keep the improved formatting and structure
   - Only correct objective factual errors

4. Output the corrected resume with these principles:
   - Facts must match the original resume exactly
   - Enhancements to descriptions should be preserved
   - Professional summary improvements should be kept
   - Skills tailoring should remain intact
   - Overall formatting and structure should be maintained

## CRITICAL GUIDELINES

- NEVER fabricate companies, positions, qualifications, or dates
- NEVER alter timeline chronology from the original resume
- ALWAYS preserve the exact spelling of proper nouns (companies, institutions)
- NEVER modify employment duration
- NEVER add made-up technical skills or certifications
- MAINTAIN the exact education credentials with correct institution names and dates

Your goal is to ensure the resume is factually accurate while maintaining the valuable tailoring and enhancements that have been added.
`;

    const verifierContent = `
# Original Factual Information
${JSON.stringify(factualInfo, null, 2)}

# Generated Resume
${customizedResume}

Please verify the factual information in the generated resume against the original facts and make any necessary corrections while preserving the enhancements.
`;

    const verifierResponse = await openrouterClient.post('/chat/completions', {
      model: 'anthropic/claude-3-sonnet',
      messages: [
        { role: "system", content: factVerifierPrompt },
        { role: "user", content: verifierContent }
      ],
      temperature: 0.2,
      max_tokens: 3000
    });
    
    customizedResume = verifierResponse.data.choices[0].message.content;
    
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
