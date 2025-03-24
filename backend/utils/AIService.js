// utils/AIService.js
const logger = require('./logger');
const { loadPromptTemplate, getOptimizationConfig } = require('./promptManager');
const { openrouterClient } = require('./apiUtils');
const errorHandler = require('./errorHandler');
const config = require('../config/config');

/**
 * Service for handling AI-related interactions
 */
class AIService {
  /**
   * Initialize the AI service with an API client
   * @param {Object} aiClient - API client for AI service (optional)
   */
  constructor(aiClient = null) {
    // Use provided client or default to openrouterClient from apiUtils
    this.aiClient = aiClient || openrouterClient;
  }
  
  /**
   * Generate a professional profile from a resume
   * @param {string} resumeContent - The parsed resume content
   * @param {Object} options - Optional parameters
   * @returns {Promise<string>} - Generated profile
   */
  async generateProfileFromResume(resumeContent, options = {}) {
    try {
      // Get configuration based on optimization preset
      const optimizationPreset = options.optimizationPreset || 'default';
      const config = getOptimizationConfig(optimizationPreset);
      
      const promptOptions = {
        useEnhanced: config.useEnhanced,
        promptSuffix: options.promptSuffix || config.promptSuffix,
        useCache: true
      };
      
      const profilerPrompt = await loadPromptTemplate('profiler', promptOptions);
      const model = options.profilerModel || 
                   config.defaultModels?.profiler || 
                   'anthropic/claude-3-opus';
      
      const requestOptions = {
        temperature: options.temperature || config.temperature || 0.7,
        max_tokens: options.max_tokens || config.profilerMaxTokens || 2000
      };
      
      return await this.makeRequest(model, profilerPrompt, resumeContent, requestOptions);
    } catch (error) {
      logger.error('Profile generation failed', { error });
      
      // Throw specific AI error
      throw errorHandler.errors.aiServiceError(
        `Failed to generate profile: ${error.message}`,
        { stage: 'profiler', originalError: error }
      );
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
      // Get configuration based on optimization preset
      const optimizationPreset = options.optimizationPreset || 'default';
      const config = getOptimizationConfig(optimizationPreset);
      
      const promptOptions = {
        useEnhanced: config.useEnhanced,
        promptSuffix: options.promptSuffix || config.promptSuffix,
        useCache: true
      };
      
      const researcherPrompt = await loadPromptTemplate('researcher', promptOptions);
      const model = options.researcherModel || 
                    config.defaultModels?.researcher || 
                    'anthropic/claude-3-opus';
      
      const requestOptions = {
        temperature: options.temperature || config.temperature || 0.7,
        max_tokens: options.max_tokens || config.researcherMaxTokens || 2000
      };
      
      return await this.makeRequest(model, researcherPrompt, jobDescription, requestOptions);
    } catch (error) {
      logger.error('Job description analysis failed', { error });
      
      // Throw specific AI error
      throw errorHandler.errors.aiServiceError(
        `Failed to analyze job description: ${error.message}`,
        { stage: 'researcher', originalError: error }
      );
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
      
      // Get configuration based on optimization preset
      const optimizationPreset = options.optimizationPreset || 'default';
      const config = getOptimizationConfig(optimizationPreset);
      
      const promptOptions = {
        useEnhanced: config.useEnhanced,
        promptSuffix: options.promptSuffix || config.promptSuffix,
        useCache: true
      };
      
      // Load the enhanced strategist prompt
      const strategistPrompt = await loadPromptTemplate('resumeStrategist', promptOptions);
      
      // Use Claude 3 Opus for the strategist model as it has the most comprehensive reasoning capabilities
      const model = options.strategistModel || 
                    config.defaultModels?.strategist || 
                    'anthropic/claude-3-opus';
      
      // Improved context format with factual information for verification
      const content = `
# Professional Profile Analysis
${profileContent}

# Job Requirements Analysis
${researchContent}

# Original Resume
${originalResume}

# Factual Information to Preserve Exactly
${JSON.stringify(factualInfo)}

IMPORTANT: Ensure all factual information (company names, job titles, dates, education details) 
exactly matches the original resume. Do not invent or modify any employment history, education credentials, 
or dates. Only enhance descriptions, achievements, and skills based on the job requirements.

Based on the above information, create a customized resume that highlights relevant skills and experiences for this specific job.
`;
      
      // Generate the customized resume
      const customizedResume = await this.makeRequest(model, strategistPrompt, content, {
        temperature: options.temperature || config.temperature || 0.3,  // Lower temperature for more factual accuracy
        max_tokens: options.max_tokens || config.strategistMaxTokens || 3000
      });
      
      // Verify factual information in the generated resume
      const verifiedResume = await this.verifyFactualInformation(customizedResume, factualInfo);
      
      return verifiedResume;
    } catch (error) {
      logger.error('Resume customization failed', { error });
      
      // Throw specific AI error
      throw errorHandler.errors.aiServiceError(
        `Failed to generate customized resume: ${error.message}`,
        { stage: 'strategist', originalError: error }
      );
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
      
      const model = config.defaultModels?.factChecker || 'anthropic/claude-3-haiku'; // Fast, efficient model for extraction
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
      
      const model = config.defaultModels?.factChecker || 'anthropic/claude-3-sonnet'; // Using a strong model for verification
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
      // Use our enhanced API client with retries and circuit breaking
      const response = await this.aiClient.post('/chat/completions', {
        model,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000
      });
      
      // Extract the content from the response
      return response.choices[0].message.content;
    } catch (error) {
      throw error; // Let error handling happen at the caller level
    }
  }
}

module.exports = AIService;
