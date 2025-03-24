// tests/mocks/promptManager.mock.js
/**
 * Mock implementation of the prompt manager
 */
const loadPromptTemplate = async (templateName) => {
  // Return different prompts based on template name
  switch(templateName) {
    case 'profiler':
      return 'You are a professional profile generator. Analyze the resume and create a comprehensive professional profile.';
    case 'researcher':
      return 'You are a job description analyzer. Extract key requirements, responsibilities, and qualifications from the job posting.';
    case 'resume-strategist':
      return 'You are a resume customization expert. Use the profile and job analysis to customize the resume for the specific job.';
    default:
      return `You are a ${templateName} prompt.`;
  }
};

module.exports = {
  loadPromptTemplate
};
