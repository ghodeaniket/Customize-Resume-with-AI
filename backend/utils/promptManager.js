// utils/promptManager.js
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * Load prompt template from file
 * @param {string} promptName - Name of the prompt template
 * @returns {Promise<string>} - Content of the prompt template
 */
async function loadPromptTemplate(promptName) {
  try {
    const promptPath = path.join(__dirname, '../prompts', `${promptName}.txt`);
    const promptContent = await fs.readFile(promptPath, 'utf8');
    return promptContent;
  } catch (error) {
    logger.error(`Failed to load prompt template: ${promptName}`, { error });
    throw new Error(`Failed to load prompt template: ${promptName}`);
  }
}

module.exports = {
  loadPromptTemplate
};
