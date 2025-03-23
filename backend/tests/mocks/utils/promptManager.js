// tests/mocks/utils/promptManager.js

/**
 * Mock prompt templates for testing
 */
const mockPrompts = {
  profiler: 'You are a professional profiler. Analyze the provided resume and generate a comprehensive professional profile.',
  
  researcher: 'You are a job market researcher. Analyze the provided job description and identify key requirements and skills.',
  
  'resume-strategist': 'You are a resume strategist. Use the provided profile and job research to customize the resume for the specific job.'
};

/**
 * Mock implementation of loadPromptTemplate
 * @param {string} templateName - Name of the prompt template to load
 * @returns {Promise<string>} - The prompt template content
 */
async function loadPromptTemplate(templateName) {
  if (!mockPrompts[templateName]) {
    throw new Error(`Prompt template "${templateName}" not found`);
  }
  
  return mockPrompts[templateName];
}

module.exports = {
  loadPromptTemplate
};
