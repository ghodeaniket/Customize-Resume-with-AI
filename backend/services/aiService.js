// services/aiService.js
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Analyze a job description using AI to extract key information
 * @param {string} content - The job description text
 * @param {string} title - The job title
 * @returns {Object} Analyzed data including key skills, requirements, etc.
 */
exports.analyzeJobDescription = async (content, title) => {
  try {
    logger.info('Analyzing job description', { title });
    
    // In a real implementation, this would use an AI model to analyze the job description
    // For now, we'll use a simplified mock implementation
    
    // Extract potential skills from the content (simplified approach)
    const skills = extractSkills(content);
    
    // Extract potential requirements (simplified approach)
    const requirements = extractRequirements(content);
    
    // Extract potential nice-to-have skills (simplified approach)
    const niceToHave = extractNiceToHave(content);
    
    return {
      keySkills: skills,
      requirements,
      niceToHave,
      originalContent: content,
      jobTitle: title,
      analysisTimestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error analyzing job description', { error });
    throw new Error(`Failed to analyze job description: ${error.message}`);
  }
};

/**
 * Customize a resume based on a job description using AI
 * @param {string} resumeContent - The resume text content
 * @param {string} jobDescriptionContent - The job description text
 * @param {Object} jobAnalysis - The analyzed job description data
 * @param {Object} settings - Customization settings
 * @returns {string} Customized resume content
 */
exports.customizeResume = async (resumeContent, jobDescriptionContent, jobAnalysis, settings) => {
  try {
    logger.info('Customizing resume');
    
    // In a real implementation, this would use an AI model to customize the resume
    // For now, we'll use a simplified mock implementation that highlights matching skills
    
    // Mock customized content - in reality this would be AI-generated
    let customizedContent = resumeContent;
    
    // Simple example of customization: Ensure job-relevant skills are prominent
    if (jobAnalysis && jobAnalysis.keySkills) {
      jobAnalysis.keySkills.forEach(skill => {
        // Check if skill exists in resume
        if (resumeContent.toLowerCase().includes(skill.toLowerCase())) {
          // In a real implementation, this would be more sophisticated
          // For now, we're just doing a simple replacement to highlight the skill
          const regex = new RegExp(`\\b${skill}\\b`, 'gi');
          customizedContent = customizedContent.replace(regex, skill);
        }
      });
    }
    
    return customizedContent;
  } catch (error) {
    logger.error('Error customizing resume', { error });
    throw new Error(`Failed to customize resume: ${error.message}`);
  }
};

/**
 * Helper function to extract skills from job description
 * @param {string} content - Job description content
 * @returns {Array} List of extracted skills
 */
function extractSkills(content) {
  // This is a very simplified version
  // In a real implementation, this would use NLP techniques or an AI model
  
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'React', 'Angular', 'Vue',
    'Node.js', 'Express', 'Django', 'Flask', 'Ruby', 'Rails', 'PHP', 'Laravel',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'NoSQL', 'AWS', 'Azure', 'GCP',
    'Docker', 'Kubernetes', 'CI/CD', 'Git', 'DevOps', 'Agile', 'Scrum'
  ];
  
  return commonSkills.filter(skill => 
    content.toLowerCase().includes(skill.toLowerCase())
  );
}

/**
 * Helper function to extract requirements from job description
 * @param {string} content - Job description content
 * @returns {Array} List of extracted requirements
 */
function extractRequirements(content) {
  // This is a very simplified version
  // In a real implementation, this would use NLP techniques or an AI model
  
  const lines = content.split('\n');
  const requirementsList = [];
  
  let inRequirementsSection = false;
  
  for (const line of lines) {
    if (line.toLowerCase().includes('requirement') && !line.toLowerCase().includes('nice to have')) {
      inRequirementsSection = true;
      continue;
    }
    
    if (inRequirementsSection && line.trim() === '') {
      inRequirementsSection = false;
      continue;
    }
    
    if (inRequirementsSection && line.trim().startsWith('•')) {
      requirementsList.push(line.trim().substring(1).trim());
    }
  }
  
  return requirementsList;
}

/**
 * Helper function to extract nice-to-have skills from job description
 * @param {string} content - Job description content
 * @returns {Array} List of extracted nice-to-have skills
 */
function extractNiceToHave(content) {
  // This is a very simplified version
  // In a real implementation, this would use NLP techniques or an AI model
  
  const lines = content.split('\n');
  const niceToHaveList = [];
  
  let inNiceToHaveSection = false;
  
  for (const line of lines) {
    if (line.toLowerCase().includes('nice to have') || line.toLowerCase().includes('preferred')) {
      inNiceToHaveSection = true;
      continue;
    }
    
    if (inNiceToHaveSection && line.trim() === '') {
      inNiceToHaveSection = false;
      continue;
    }
    
    if (inNiceToHaveSection && line.trim().startsWith('•')) {
      niceToHaveList.push(line.trim().substring(1).trim());
    }
  }
  
  return niceToHaveList;
}
