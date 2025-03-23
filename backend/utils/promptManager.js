// utils/promptManager.js
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

// In-memory cache for prompt templates
const promptCache = new Map();

/**
 * Load prompt template from file with caching
 * @param {string} promptName - Name of the prompt template
 * @param {boolean} useCache - Whether to use cached template if available (default: true)
 * @returns {Promise<string>} - Content of the prompt template
 */
async function loadPromptTemplate(promptName, useCache = true) {
  try {
    // Check cache first if enabled
    if (useCache && promptCache.has(promptName)) {
      return promptCache.get(promptName);
    }
    
    const promptPath = path.join(__dirname, '../prompts', `${promptName}.txt`);
    const promptContent = await fs.readFile(promptPath, 'utf8');
    
    // Cache the template
    promptCache.set(promptName, promptContent);
    
    return promptContent;
  } catch (error) {
    logger.error(`Failed to load prompt template: ${promptName}`, { error });
    throw new Error(`Failed to load prompt template: ${promptName}`);
  }
}

/**
 * Reload prompt template from disk, bypassing cache
 * @param {string} promptName - Name of the prompt template
 * @returns {Promise<string>} - Content of the prompt template
 */
async function reloadPromptTemplate(promptName) {
  return await loadPromptTemplate(promptName, false);
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
  reloadPromptTemplate,
  clearPromptCache
};
