// services/documentService.js
const logger = require('../utils/logger');
const { PDFParser } = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

/**
 * Parse resume content from different file formats
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} mimeType - The file MIME type
 * @returns {Object} Object containing extracted text and structured data
 */
exports.parseResumeContent = async (fileBuffer, mimeType) => {
  try {
    logger.info('Parsing resume content', { mimeType });
    
    let textContent = '';
    
    // Extract text based on file type
    if (mimeType === 'application/pdf') {
      textContent = await extractTextFromPDF(fileBuffer);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      textContent = await extractTextFromDOCX(fileBuffer);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
    
    // In a real implementation, this would use NLP or AI to extract structured data
    // For now, we'll use a simplified approach
    const parsedData = parseResumeText(textContent);
    
    return {
      textContent,
      parsedData
    };
  } catch (error) {
    logger.error('Error parsing resume content', { error });
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
};

/**
 * Extract text from PDF file
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @returns {string} Extracted text content
 */
async function extractTextFromPDF(pdfBuffer) {
  try {
    const data = await PDFParser(pdfBuffer);
    return data.text;
  } catch (error) {
    logger.error('Error extracting text from PDF', { error });
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from DOCX file
 * @param {Buffer} docxBuffer - The DOCX file buffer
 * @returns {string} Extracted text content
 */
async function extractTextFromDOCX(docxBuffer) {
  try {
    const result = await mammoth.extractRawText({ buffer: docxBuffer });
    return result.value;
  } catch (error) {
    logger.error('Error extracting text from DOCX', { error });
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}

/**
 * Parse resume text to extract structured data
 * @param {string} text - The resume text content
 * @returns {Object} Structured resume data
 */
function parseResumeText(text) {
  // This is a very simplified version
  // In a real implementation, this would use NLP techniques or an AI model
  
  const sections = {};
  
  // Try to identify common resume sections
  const lines = text.split('\n');
  let currentSection = 'header';
  
  sections[currentSection] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') continue;
    
    // Check for section headers (very simplified approach)
    if (
      trimmedLine.toUpperCase() === 'EXPERIENCE' || 
      trimmedLine.toUpperCase() === 'WORK EXPERIENCE' ||
      trimmedLine.toUpperCase() === 'EMPLOYMENT HISTORY'
    ) {
      currentSection = 'experience';
      sections[currentSection] = [];
      continue;
    }
    
    if (
      trimmedLine.toUpperCase() === 'EDUCATION' || 
      trimmedLine.toUpperCase() === 'ACADEMIC BACKGROUND'
    ) {
      currentSection = 'education';
      sections[currentSection] = [];
      continue;
    }
    
    if (
      trimmedLine.toUpperCase() === 'SKILLS' || 
      trimmedLine.toUpperCase() === 'TECHNICAL SKILLS'
    ) {
      currentSection = 'skills';
      sections[currentSection] = [];
      continue;
    }
    
    // Add line to current section
    sections[currentSection].push(trimmedLine);
  }
  
  // Extract contact information (simplified)
  const contactInfo = extractContactInfo(sections.header);
  
  // Extract skills (simplified)
  const skills = sections.skills ? extractSkills(sections.skills) : [];
  
  return {
    contactInfo,
    skills,
    sections
  };
}

/**
 * Extract contact information from resume header
 * @param {Array} headerLines - Lines from the resume header
 * @returns {Object} Contact information
 */
function extractContactInfo(headerLines) {
  const contactInfo = {
    name: '',
    email: '',
    phone: '',
    location: ''
  };
  
  if (!headerLines || headerLines.length === 0) {
    return contactInfo;
  }
  
  // Assume first line is name
  contactInfo.name = headerLines[0];
  
  // Look for email and phone in other lines
  for (const line of headerLines) {
    // Email pattern
    const emailMatch = line.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      contactInfo.email = emailMatch[0];
    }
    
    // Phone pattern (simplified)
    const phoneMatch = line.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      contactInfo.phone = phoneMatch[0];
    }
  }
  
  return contactInfo;
}

/**
 * Extract skills from skills section
 * @param {Array} skillsLines - Lines from the skills section
 * @returns {Array} List of skills
 */
function extractSkills(skillsLines) {
  const skills = [];
  
  if (!skillsLines || skillsLines.length === 0) {
    return skills;
  }
  
  for (const line of skillsLines) {
    // Split by commas or bullet points
    const skillsList = line.split(/[,•]/);
    
    for (const skill of skillsList) {
      const trimmedSkill = skill.trim();
      if (trimmedSkill) {
        skills.push(trimmedSkill);
      }
    }
  }
  
  return skills;
}
