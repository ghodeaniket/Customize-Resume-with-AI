/**
 * AI Service for job description analysis and resume customization
 * 
 * Note: This is a mock implementation for the MVP
 * In production, this would use actual calls to OpenAI or another AI provider
 */

// Mock function to analyze job descriptions
export const analyzeJobDescription = async (
  jobDescription: string,
  title: string
): Promise<any> => {
  // In a real implementation, this would call an AI model
  console.log('Analyzing job description:', title);
  
  // Extract skills (very naive approach for MVP)
  const skills = extractSkills(jobDescription);
  
  // Extract responsibilities (very naive approach for MVP)
  const responsibilities = extractResponsibilities(jobDescription);
  
  // Extract requirements (very naive approach for MVP)
  const requirements = extractRequirements(jobDescription);
  
  // Extract benefits (very naive approach for MVP)
  const benefits = extractBenefits(jobDescription);
  
  // Extract soft skills (very naive approach for MVP)
  const softSkills = extractSoftSkills(jobDescription);
  
  return {
    keySkills: skills,
    keyResponsibilities: responsibilities,
    requiredExperience: extractExperience(jobDescription),
    educationLevel: extractEducation(jobDescription),
    jobType: extractJobType(jobDescription),
    employmentBenefits: benefits,
    softSkills
  };
};

// Mock function to customize resumes based on job descriptions
export const customizeResume = async (
  resumeText: string,
  jobDescriptionText: string,
  jobAnalysis: any,
  customizationSettings: any
): Promise<string> => {
  // In a real implementation, this would call an AI model with these parameters
  console.log('Customizing resume with settings:', customizationSettings);
  
  // For the MVP, return a simple modification
  // In production, this would involve much more sophisticated AI processing
  
  // Example basic customization
  let customizedText = resumeText;
  
  // Add professional summary if it doesn't exist
  if (!customizedText.toLowerCase().includes('summary') && 
      !customizedText.toLowerCase().includes('objective')) {
    const name = customizedText.split('\n')[0] || 'CANDIDATE NAME';
    const title = jobAnalysis.title || 'Professional';
    const skills = jobAnalysis.keySkills.slice(0, 3).join(', ');
    
    const summary = `
${name}
${title}

PROFESSIONAL SUMMARY
Experienced professional with expertise in ${skills}. Proven track record of delivering results and meeting objectives.

`;
    
    customizedText = summary + customizedText.substring(customizedText.indexOf('\n\n') + 2);
  }
  
  // Add key skills highlighted in job description
  if (customizationSettings.highlightKeywords) {
    jobAnalysis.keySkills.forEach((skill: string) => {
      if (!customizedText.toLowerCase().includes(skill.toLowerCase())) {
        // If the skill isn't in the resume, we'd add it
        // This is very naive for MVP purposes
      }
    });
  }
  
  // In a real implementation, we would use AI to create a properly
  // tailored version of the resume based on the job description
  
  return customizedText;
};

// Helper functions for job analysis
// These are extremely naive implementations for the MVP
// In production, these would use NLP/AI techniques

function extractSkills(text: string): string[] {
  const skillsKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Vue', 'Angular',
    'Node.js', 'Express', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD',
    'REST', 'API', 'GraphQL', 'Git', 'Agile', 'Scrum'
  ];
  
  const foundSkills = skillsKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
  
  return foundSkills;
}

function extractResponsibilities(text: string): string[] {
  const responsibilitiesSection = extractSection(text, 'responsibilities', 'requirements');
  
  if (!responsibilitiesSection) return [];
  
  return responsibilitiesSection
    .split('\n')
    .filter(line => line.trim().startsWith('•'))
    .map(line => line.replace('•', '').trim())
    .filter(Boolean);
}

function extractRequirements(text: string): string[] {
  const requirementsSection = extractSection(text, 'requirements', 'benefits');
  
  if (!requirementsSection) return [];
  
  return requirementsSection
    .split('\n')
    .filter(line => line.trim().startsWith('•'))
    .map(line => line.replace('•', '').trim())
    .filter(Boolean);
}

function extractBenefits(text: string): string[] {
  const benefitsSection = extractSection(text, 'benefits', '');
  
  if (!benefitsSection) return [];
  
  return benefitsSection
    .split('\n')
    .filter(line => line.trim().startsWith('•'))
    .map(line => line.replace('•', '').trim())
    .filter(Boolean);
}

function extractSoftSkills(text: string): string[] {
  const softSkillsKeywords = [
    'Communication', 'Teamwork', 'Collaboration', 'Leadership',
    'Problem-solving', 'Critical thinking', 'Attention to detail',
    'Time management', 'Adaptability', 'Flexibility', 'Creativity',
    'Mentoring', 'Organization'
  ];
  
  const foundSkills = softSkillsKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
  
  return foundSkills;
}

function extractExperience(text: string): string {
  const experienceRegex = /(\d+\+?\s*years?)/i;
  const match = text.match(experienceRegex);
  
  return match ? match[0] : '';
}

function extractEducation(text: string): string {
  const educationKeywords = [
    "Bachelor's", "Master's", "PhD", "Degree", "BS", "MS", "BA", "MA"
  ];
  
  for (const keyword of educationKeywords) {
    if (text.includes(keyword)) {
      // Very naive extraction for the MVP
      const index = text.indexOf(keyword);
      const end = text.indexOf('\n', index);
      return text.substring(index, end > 0 ? end : index + 50);
    }
  }
  
  return '';
}

function extractJobType(text: string): string {
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'];
  
  for (const type of jobTypes) {
    if (text.includes(type)) {
      return type;
    }
  }
  
  return 'Full-time'; // Default assumption
}

function extractSection(text: string, sectionStart: string, sectionEnd: string): string | null {
  const lowerText = text.toLowerCase();
  const startIndex = lowerText.indexOf(sectionStart.toLowerCase());
  
  if (startIndex === -1) return null;
  
  let endIndex = lowerText.length;
  if (sectionEnd && lowerText.indexOf(sectionEnd.toLowerCase()) > startIndex) {
    endIndex = lowerText.indexOf(sectionEnd.toLowerCase());
  }
  
  return text.substring(startIndex, endIndex);
}
