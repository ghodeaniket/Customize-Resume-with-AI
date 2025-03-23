// utils/AIService.js
const logger = require('./logger');
const { loadPromptTemplate } = require('./promptManager');

/**
 * Service for handling AI-related interactions
 */
class AIService {
  /**
   * Initialize the AI service with an API client
   * @param {Object} aiClient - Axios instance configured for the AI API
   */
  constructor(aiClient) {
    this.aiClient = aiClient;
  }
  
  /**
   * Generate a professional profile from a resume
   * @param {string} resumeContent - The parsed resume content
   * @param {Object} options - Optional parameters
   * @returns {Promise<string>} - Generated profile
   */
  async generateProfileFromResume(resumeContent, options = {}) {
    try {
      const profilerPrompt = await loadPromptTemplate('profiler');
      const model = options.profilerModel || process.env.DEFAULT_PROFILER_MODEL || 'anthropic/claude-3-7-sonnet';
      
      return await this.makeRequest(model, profilerPrompt, resumeContent, options);
    } catch (error) {
      logger.error('Profile generation failed', { error });
      throw new Error(`Failed to generate profile: ${error.message}`);
    }
  }
  
  /**
   * Analyze a job description
   * @param {string} jobDescription - The job description text
   * @param {Object} options - Optional parameters
   * @returns {Promise<string>} - Analysis results
   */
  async analyzeJobDescription(jobDescription, options = {}) {
    try {
      const researcherPrompt = await loadPromptTemplate('researcher');
      const model = options.researcherModel || process.env.DEFAULT_RESEARCHER_MODEL || 'anthropic/claude-3-7-sonnet';
      
      return await this.makeRequest(model, researcherPrompt, jobDescription, options);
    } catch (error) {
      logger.error('Job description analysis failed', { error });
      throw new Error(`Failed to analyze job description: ${error.message}`);
    }
  }
  
  /**
   * Generate a customized resume
   * @param {string} profileContent - Professional profile content
   * @param {string} researchContent - Job description analysis content
   * @param {string} originalResume - Original resume content
   * @param {Object} options - Optional parameters
   * @returns {Promise<string>} - Customized resume
   */
  async generateCustomizedResume(profileContent, researchContent, originalResume, options = {}) {
    try {
      // Extract key factual information from the original resume for verification
      const factualInfo = await this.extractFactualInformation(originalResume);
      
      // Load the enhanced strategist prompt
      const strategistPrompt = await loadPromptTemplate('resume-strategist');
      
      // Use Claude 3 Opus for the strategist model as it has the most comprehensive reasoning capabilities
      const model = options.strategistModel || process.env.DEFAULT_STRATEGIST_MODEL || 'anthropic/claude-3-opus';
      
      // Include factual information in the prompt for verification
      const content = `
comprehensive profile - ${profileContent}, 
recommendations - ${researchContent}, 
original resume - ${originalResume},
factual information to preserve - ${JSON.stringify(factualInfo)}

IMPORTANT: Ensure all factual information (company names, job titles, dates, education details) 
exactly matches the original resume. Do not invent or modify any employment history, education credentials, 
or dates. Only enhance descriptions, achievements, and skills based on the job requirements.
`;
      
      // Generate the customized resume
      const customizedResume = await this.makeRequest(model, strategistPrompt, content, {
        ...options,
        temperature: 0.3  // Lower temperature for more factual accuracy
      });
      
      // Verify factual information in the generated resume
      const verifiedResume = await this.verifyFactualInformation(customizedResume, factualInfo);
      
      return verifiedResume;
    } catch (error) {
      logger.error('Resume customization failed', { error });
      throw new Error(`Failed to generate customized resume: ${error.message}`);
    }
  }
  
  /**
   * Extract key factual information from the original resume
   * @param {string} resumeContent - Original resume content
   * @returns {Promise<Object>} - Factual information extracted from the resume
   */
  async extractFactualInformation(resumeContent) {
    try {
      const extractionPrompt = await loadPromptTemplate('fact-extractor') || `
Extract only factual information from this resume. Include:
1. Full name
2. Contact information (email, phone)
3. Company names with exact spellings
4. Job titles
5. Employment dates
6. Education institutions
7. Degrees and certifications with completion dates
8. Technical skills and tools (only confirmed ones, not aspirational)

Format as a JSON object with clear categorization.
`;
      
      const model = 'anthropic/claude-3-haiku'; // Fast, efficient model for extraction
      const extractionResponse = await this.makeRequest(model, extractionPrompt, resumeContent, {
        temperature: 0.1 // Very low temperature for factual extraction
      });
      
      // Try to parse as JSON, but handle text response if JSON parsing fails
      try {
        return JSON.parse(extractionResponse);
      } catch (e) {
        logger.warn('Fact extraction returned non-JSON response', { error: e });
        // Return as a string if JSON parsing fails
        return { rawFactualData: extractionResponse };
      }
    } catch (error) {
      logger.error('Fact extraction failed', { error });
      // Return empty object but don't fail the overall process
      return {};
    }
  }
  
  /**
   * Verify factual information in the generated resume
   * @param {string} generatedResume - Generated resume content
   * @param {Object} factualInfo - Original factual information
   * @returns {Promise<string>} - Verified and corrected resume
   */
  async verifyFactualInformation(generatedResume, factualInfo) {
    try {
      // If fact extraction failed or returned empty, just return the generated resume
      if (!factualInfo || Object.keys(factualInfo).length === 0) {
        return generatedResume;
      }
      
      const verificationPrompt = await loadPromptTemplate('fact-verifier') || `
You are a fact-checking system for resumes. Compare the generated resume with the original factual information.
Correct any discrepancies in:
1. Names, dates, and contact information
2. Company names and their spelling
3. Job titles
4. Employment dates and durations
5. Education credentials and dates
6. Certification names and dates

Make surgical corrections only where facts are wrong. Do not change the improved descriptions or formatting.

Original factual information:
###
${JSON.stringify(factualInfo)}
###

Generated resume:
###
${generatedResume}
###
`;
      
      const model = 'anthropic/claude-3-7-sonnet'; // Using a strong model for verification
      const verificationResponse = await this.makeRequest(model, verificationPrompt, "", {
        temperature: 0.2 // Low temperature for accuracy
      });
      
      return verificationResponse;
    } catch (error) {
      logger.error('Resume verification failed', { error });
      // In case of failure, return the original generated resume
      return generatedResume;
    }
  }
  
  /**
   * Make a request to the AI API
   * @param {string} model - Model identifier to use
   * @param {string} prompt - System prompt
   * @param {string} content - User content
   * @param {Object} options - Optional parameters
   * @returns {Promise<string>} - Response content
   */
  async makeRequest(model, prompt, content, options = {}) {
    try {
      const response = await this.aiClient.post('/chat/completions', {
        model,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000
      });
      
      return response.data.choices[0].message.content;
    } catch (error) {
      const statusCode = error.response?.status;
      const responseData = error.response?.data;
      
      logger.error('AI request failed', { 
        model, 
        statusCode,
        error: error.message,
        response: responseData 
      });
      
      if (statusCode === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (statusCode === 401 || statusCode === 403) {
        throw new Error('Authentication failed. Please check your API key.');
      }
      
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }
}

module.exports = AIService;
