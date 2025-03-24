// utils/AIService.js
const logger = require('./logger');
const { loadPromptTemplate, getOptimizationConfig } = require('./promptManager');

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
      // Get configuration based on optimization preset
      const optimizationPreset = options.optimizationPreset || 'default';
      const config = getOptimizationConfig(optimizationPreset);
      
      const promptOptions = {
        useEnhanced: config.useEnhanced,
        promptSuffix: options.promptSuffix || config.promptSuffix
      };
      
      const profilerPrompt = await loadPromptTemplate('profiler', promptOptions);
      const model = options.profilerModel || process.env.DEFAULT_PROFILER_MODEL || 'anthropic/claude-3-opus';
      
      const requestOptions = {
        temperature: options.temperature || config.temperature || 0.7,
        max_tokens: options.max_tokens || config.profilerMaxTokens || 2000
      };
      
      return await this.makeRequest(model, profilerPrompt, resumeContent, requestOptions);
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
      // Get configuration based on optimization preset
      const optimizationPreset = options.optimizationPreset || 'default';
      const config = getOptimizationConfig(optimizationPreset);
      
      const promptOptions = {
        useEnhanced: config.useEnhanced,
        promptSuffix: options.promptSuffix || config.promptSuffix
      };
      
      const researcherPrompt = await loadPromptTemplate('researcher', promptOptions);
      const model = options.researcherModel || process.env.DEFAULT_RESEARCHER_MODEL || 'anthropic/claude-3-opus';
      
      const requestOptions = {
        temperature: options.temperature || config.temperature || 0.7,
        max_tokens: options.max_tokens || config.researcherMaxTokens || 2000
      };
      
      return await this.makeRequest(model, researcherPrompt, jobDescription, requestOptions);
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
      // Get configuration based on optimization preset
      const optimizationPreset = options.optimizationPreset || 'default';
      const config = getOptimizationConfig(optimizationPreset);
      
      const promptOptions = {
        useEnhanced: config.useEnhanced,
        promptSuffix: options.promptSuffix || config.promptSuffix
      };
      
      const strategistPrompt = await loadPromptTemplate('resumeStrategist', promptOptions);
      const model = options.strategistModel || process.env.DEFAULT_STRATEGIST_MODEL || 'anthropic/claude-3-opus';
      
      // Improved context format
      const content = `
# Professional Profile Analysis
${profileContent}

# Job Requirements Analysis
${researchContent}

# Original Resume
${originalResume}

Based on the above information, create a customized resume that highlights relevant skills and experiences for this specific job.
      `;
      
      const requestOptions = {
        temperature: options.temperature || config.temperature || 0.7,
        max_tokens: options.max_tokens || config.strategistMaxTokens || 3000
      };
      
      return await this.makeRequest(model, strategistPrompt, content, requestOptions);
    } catch (error) {
      logger.error('Resume customization failed', { error });
      throw new Error(`Failed to generate customized resume: ${error.message}`);
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