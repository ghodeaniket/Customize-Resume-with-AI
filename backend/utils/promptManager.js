// utils/promptManager.js
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const promptConfig = require('../config/promptConfig');

/**
 * Load prompt template from file
 * @param {string} promptType - Type of the prompt template (profiler, researcher, resumeStrategist)
 * @param {Object} options - Options for prompt loading
 * @returns {Promise<string>} - Content of the prompt template
 */
async function loadPromptTemplate(promptType, options = {}) {
  try {
    const useEnhanced = options.useEnhanced !== undefined ? options.useEnhanced : true;
    const promptName = promptConfig.getPromptName(promptType, useEnhanced);
    
    const promptPath = path.join(__dirname, '../prompts', `${promptName}.txt`);
    let promptContent = await fs.readFile(promptPath, 'utf8');
    
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

module.exports = {
  loadPromptTemplate,
  getOptimizationConfig
};
