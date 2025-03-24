// utils/AIService.js
const logger = require('./logger');
const { loadPromptTemplate, getOptimizationConfig } = require('./promptManager');
const errorHandler = require('./errorHandler');
const config = require('../config/config');
const axios = require('axios');

/**
 * Service for handling AI-related interactions
 */
class AIService {
  /**
   * Initialize the AI service with an API client
   * @param {Object} aiClient - API client for AI service (optional)
   */
  constructor(aiClient = null) {
    // Use provided client or create a new one
    this.aiClient = aiClient || this.createDefaultClient();
    logger.info('AI Service initialized');
  }
  
  /**
   * Create a default API client for OpenRouter
   * @returns {Object} - Axios instance for OpenRouter
   */
  createDefaultClient() {
    logger.info('Creating default OpenRouter client');
    return axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.SERVICE_URL || 'http://localhost:3000',
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 seconds timeout
    });
  }
  
  /**
   * Generate a professional profile from a resume
   * @param {string} resumeContent - The parsed resume content
   * @param {Object} options - Optional parameters
   * @returns {Promise<string>} - Generated profile
   */
  async generateProfileFromResume(resumeContent, options = {}) {
    try {
      logger.info('Generating professional profile from resume');
      
      // Get configuration based on optimization preset
      const optimizationPreset = options.optimizationPreset || 'default';
      const optimizationConfig = getOptimizationConfig(optimizationPreset);
      
      const promptOptions = {
        useEnhanced: optimizationConfig.useEnhancedPrompts,
        promptSuffix: options.promptSuffix || optimizationConfig.promptSuffix,
        useCache: true
      };
      
      logger.debug('Loading profiler prompt template', promptOptions);
      const profilerPrompt = await loadPromptTemplate('profiler', promptOptions);
      
      const model = options.profilerModel || 
                   config.openrouter.defaultModels.profiler || 
                   'anthropic/claude-3-opus';
      
      const requestOptions = {
        temperature: options.temperature || optimizationConfig.temperature || 0.7,
        max_tokens: options.max_tokens || optimizationConfig.profilerMaxTokens || 2000
      };
      
      logger.debug('Making profiler request', { model, options: requestOptions });
      return await this.makeRequest(model, profilerPrompt, resumeContent, requestOptions);
    } catch (error) {
      logger.error('Profile generation failed', { 
        error: error.message,
        stack: error.stack,
        details: error.response?.data
      });
      
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
      logger.info('Analyzing job description');
      
      // Get configuration based on optimization preset
      const optimizationPreset = options.optimizationPreset || 'default';
      const optimizationConfig = getOptimizationConfig(optimizationPreset);
      
      const promptOptions = {
        useEnhanced: optimizationConfig.useEnhancedPrompts,
        promptSuffix: options.promptSuffix || optimizationConfig.promptSuffix,
        useCache: true
      };
      
      logger.debug('Loading researcher prompt template', promptOptions);
      const researcherPrompt = await loadPromptTemplate('researcher', promptOptions);
      
      const model = options.researcherModel || 
                    config.openrouter.defaultModels.researcher || 
                    'anthropic/claude-3-opus';
      
      const requestOptions = {
        temperature: options.temperature || optimizationConfig.temperature || 0.7,
        max_tokens: options.max_tokens || optimizationConfig.researcherMaxTokens || 2000
      };
      
      logger.debug('Making researcher request', { model, options: requestOptions });
      return await this.makeRequest(model, researcherPrompt, jobDescription, requestOptions);
    } catch (error) {
      logger.error('Job description analysis failed', { 
        error: error.message,
        stack: error.stack,
        details: error.response?.data
      });
      
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
      logger.info('Generating customized resume');
      
      // Extract key factual information from the original resume for verification
      const factualInfo = await this.extractFactualInformation(originalResume);
      
      // Get configuration based on optimization preset
      const optimizationPreset = options.optimizationPreset || 'default';
      const optimizationConfig = getOptimizationConfig(optimizationPreset);
      
      const promptOptions = {
        useEnhanced: optimizationConfig.useEnhancedPrompts,
        promptSuffix: options.promptSuffix || optimizationConfig.promptSuffix,
        useCache: true
      };
      
      // Load the enhanced strategist prompt
      logger.debug('Loading strategist prompt template', promptOptions);
      const strategistPrompt = await loadPromptTemplate('resumeStrategist', promptOptions);
      
      // Use Claude 3 Opus for the strategist model as it has the most comprehensive reasoning capabilities
      const model = options.strategistModel || 
                    config.openrouter.defaultModels.strategist || 
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
      const requestOptions = {
        temperature: options.temperature || optimizationConfig.temperature || 0.3,
        max_tokens: options.max_tokens || optimizationConfig.strategistMaxTokens || 3000
      };
      
      logger.debug('Making strategist request', { model, options: requestOptions });
      const customizedResume = await this.makeRequest(model, strategistPrompt, content, requestOptions);
      
      // Verify factual information in the generated resume
      logger.debug('Verifying factual information in customized resume');
      const verifiedResume = await this.verifyFactualInformation(customizedResume, factualInfo);
      
      return verifiedResume;
    } catch (error) {
      logger.error('Resume customization failed', { 
        error: error.message,
        stack: error.stack,
        details: error.response?.data
      });
      
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
      logger.debug('Extracting factual information from resume');
      
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
      
      const model = config.openrouter.defaultModels.factChecker || 'anthropic/claude-3-haiku';
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
      logger.error('Fact extraction failed', { 
        error: error.message, 
        stack: error.stack 
      });
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
        logger.debug('No factual information to verify, skipping verification');
        return generatedResume;
      }
      
      logger.debug('Verifying factual information in generated resume');
      
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
      
      const model = config.openrouter.defaultModels.factChecker || 'anthropic/claude-3-sonnet';
      const verificationResponse = await this.makeRequest(model, verificationPrompt, "", {
        temperature: 0.2 // Low temperature for accuracy
      });
      
      return verificationResponse;
    } catch (error) {
      logger.error('Resume verification failed', { 
        error: error.message, 
        stack: error.stack 
      });
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
      // For local testing, simulate a response
      if (process.env.NODE_ENV === 'test' || process.env.MOCK_AI === 'true') {
        logger.info('Using mock AI response for testing');
        return `This is a mock response for model: ${model}`;
      }
      
      // Log request parameters
      logger.debug('Making AI request', { 
        model, 
        contentLength: content ? content.length : 0,
        options
      });
      
      // Make the actual request
      const requestData = {
        model,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: content || '' }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000
      };
      
      // If we're running in development without an OpenRouter API key, just return mock data
      if (!process.env.OPENROUTER_API_KEY) {
        logger.warn('No OpenRouter API key set, using mock response');
        return `This is a mock response for model: ${model} (no API key provided)`;
      }
      
      // Log request data for debugging
      logger.debug('Request payload', { 
        model, 
        temperature: requestData.temperature,
        max_tokens: requestData.max_tokens,
        system_prompt_length: prompt.length,
        user_content_length: content ? content.length : 0
      });
      
      const response = await this.aiClient.post('/chat/completions', requestData);
      
      // Log response for debugging
      logger.debug('Response received', { 
        status: response.status,
        hasData: !!response.data,
        hasChoices: response.data && !!response.data.choices,
        choicesLength: response.data && response.data.choices ? response.data.choices.length : 0
      });
      
      // Extract content from the response
      if (response && response.data && response.data.choices && 
          response.data.choices.length > 0 && 
          response.data.choices[0].message) {
        return response.data.choices[0].message.content;
      } else {
        logger.warn('Unexpected API response structure', { 
          response: typeof response === 'object' ? JSON.stringify(response.data) : response 
        });
        throw new Error('Unexpected API response structure');
      }
    } catch (error) {
      // Handle Axios errors with detailed logging
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        logger.error('AI service error response', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // The request was made but no response was received
        logger.error('AI service no response', {
          request: error.request
        });
      } else {
        // Something happened in setting up the request
        logger.error('AI service request error', {
          message: error.message,
          stack: error.stack
        });
      }
      
      throw error;
    }
  }
}

module.exports = AIService;
