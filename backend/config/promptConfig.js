// config/promptConfig.js

/**
 * Configuration for prompt templates
 */
const promptConfig = {
  // Default prompt template names
  defaults: {
    profiler: 'profiler',
    researcher: 'researcher',
    resumeStrategist: 'resume-strategist'
  },
  
  // Enhanced prompt template names
  enhanced: {
    profiler: 'profiler-enhanced',
    researcher: 'researcher-enhanced',
    resumeStrategist: 'resume-strategist-enhanced'
  },
  
  // Optimization presets configuration - all presets must use enhanced prompts
  optimizationPresets: {
    default: {
      useEnhancedPrompts: true, // Always true, this is now enforced
      temperature: 0.7,
      profilerMaxTokens: 2000,
      researcherMaxTokens: 2000,
      strategistMaxTokens: 3000
    },
    ats_optimization: {
      useEnhancedPrompts: true, // Enhanced prompts required
      temperature: 0.5,
      strategistMaxTokens: 3000,
      promptSuffix: `
        Additionally, focus heavily on ATS optimization:
        - Include all critical keywords from the job description
        - Match section headers to what ATS systems typically scan for
        - Use industry-standard terminology
        - Ensure skills and technologies are explicitly mentioned
      `
    },
    human_recruiter: {
      useEnhancedPrompts: true,
      temperature: 0.7,
      strategistMaxTokens: 3000,
      promptSuffix: `
        Additionally, focus on making the resume impressive to human recruiters:
        - Use powerful action verbs and compelling language
        - Emphasize quantifiable achievements and results
        - Create a visually scannable format with clear sections
        - Highlight leadership and soft skills where appropriate
      `
    },
    technical_skills: {
      useEnhancedPrompts: true,
      temperature: 0.6,
      strategistMaxTokens: 3000,
      promptSuffix: `
        Additionally, focus on highlighting technical expertise:
        - Emphasize technical skills, tools, and technologies
        - Detail technical challenges overcome and solutions implemented
        - Highlight technical leadership and mentoring
        - Include relevant technical certifications and training
      `
    },
    leadership_focus: {
      useEnhancedPrompts: true,
      temperature: 0.7,
      strategistMaxTokens: 3000,
      promptSuffix: `
        Additionally, focus on highlighting leadership capabilities:
        - Emphasize team management and mentorship
        - Detail cross-functional collaboration
        - Highlight strategic decision-making
        - Include examples of driving organizational change
        - Focus on business impact of technical decisions
      `
    }
  },
  
  /**
   * Get configuration for a specific optimization preset
   * @param {string} preset - The optimization preset name
   * @returns {Object} - Configuration for the specified preset
   */
  getConfig(preset = 'default') {
    return this.optimizationPresets[preset] || this.optimizationPresets.default;
  },
  
  /**
   * Get prompt template name based on optimization preset
   * @param {string} promptType - Type of prompt (profiler, researcher, resumeStrategist)
   * @param {boolean} useEnhanced - Whether to use enhanced prompts (ignored - always uses enhanced)
   * @returns {string} - Prompt template name
   */
  getPromptName(promptType, useEnhanced = true) {
    // Always use enhanced prompts regardless of the useEnhanced parameter
    if (!this.enhanced[promptType]) {
      throw new Error(`Enhanced prompt not found for type: ${promptType}`);
    }
    return this.enhanced[promptType];
  }
};

module.exports = promptConfig;