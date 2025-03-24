// utils/promptManager.js
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const promptConfig = require('../config/promptConfig');

// In-memory cache for prompt templates
const promptCache = new Map();

/**
 * Load prompt template from file with caching and configuration options
 * @param {string} promptType - Type of the prompt template (profiler, researcher, resumeStrategist)
 * @param {Object} options - Options for prompt loading
 * @returns {Promise<string>} - Content of the prompt template
 */
async function loadPromptTemplate(promptType, options = {}) {
  try {
    // Determine whether to use the cache
    const useCache = options.useCache !== undefined ? options.useCache : true;
    
    // Always use enhanced prompts
    const useEnhanced = true;
    
    // Get the prompt name from the configuration (always enhanced)
    const promptName = promptConfig.getPromptName(promptType, useEnhanced);
    
    // Check cache first if enabled
    if (useCache && promptCache.has(promptName)) {
      let cachedContent = promptCache.get(promptName);
      
      // Add suffix if provided
      if (options.promptSuffix) {
        cachedContent = cachedContent + options.promptSuffix;
      }
      
      return cachedContent;
    }
    
    // Load from file if not in cache or cache is disabled
    const promptPath = path.join(__dirname, '../prompts', `${promptName}.txt`);
    let promptContent = await fs.readFile(promptPath, 'utf8');
    
    // Cache the original content (without suffix)
    promptCache.set(promptName, promptContent);
    
    // Add suffix if provided
    if (options.promptSuffix) {
      promptContent += options.promptSuffix;
    }
    
    return promptContent;
  } catch (error) {
    logger.error(`Failed to load prompt template: ${promptType}`, { error });
    throw new Error(`Failed to load prompt template: ${promptType}`);
  }
}

/**
 * Load configuration for a specific optimization preset
 * @param {string} preset - Optimization preset name
 * @returns {Object} - Configuration for the preset
 */
function getOptimizationConfig(preset = 'default') {
  return promptConfig.getConfig(preset);
}

/**
 * Reload prompt template from disk, bypassing cache
 * @param {string} promptType - Type of the prompt template
 * @param {Object} options - Options for prompt loading
 * @returns {Promise<string>} - Content of the prompt template
 */
async function reloadPromptTemplate(promptType, options = {}) {
  const newOptions = { ...options, useCache: false };
  return await loadPromptTemplate(promptType, newOptions);
}

/**
 * Clear all cached prompt templates
 */
function clearPromptCache() {
  promptCache.clear();
  logger.info('Prompt template cache cleared');
}

module.exports = {
  loadPromptTemplate,
  getOptimizationConfig,
  reloadPromptTemplate,
  clearPromptCache
};
