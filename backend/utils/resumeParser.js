// utils/resumeParser.js
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const { JSDOM } = require('jsdom');
const logger = require('./logger');

/**
 * Parse resume content from various formats to plain text
 * @param {Buffer|string} content - The resume content (file buffer or base64 string)
 * @param {string} format - Format of the resume (pdf, docx, html, etc.)
 * @returns {Promise<string>} - Plain text representation of the resume
 */
async function parseResume(content, format) {
  try {
    // Convert base64 string to buffer if needed
    let buffer = content;
    if (typeof content === 'string' && content.startsWith('data:')) {
      const base64Data = content.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else if (typeof content === 'string' && !content.startsWith('data:')) {
      // If it's already plain text, just return it
      return content;
    }
    
    // Parse based on format
    switch (format.toLowerCase()) {
      case 'pdf':
        return await parsePdf(buffer);
      
      case 'docx':
        return await parseDocx(buffer);
      
      case 'html':
        return parseHtml(buffer.toString());
      
      case 'json':
        return parseJson(buffer.toString());
      
      default:
        logger.warn(`Unsupported resume format: ${format}, treating as plain text`);
        return buffer.toString();
    }
  } catch (error) {
    logger.error('Resume parsing failed', { error, format });
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
}

/**
 * Parse PDF to text
 */
async function parsePdf(buffer) {
  const data = await pdf(buffer);
  return data.text;
}

/**
 * Parse DOCX to text
 */
async function parseDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Parse HTML to text
 */
function parseHtml(html) {
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent;
}

/**
 * Parse JSON resume to text
 */
function parseJson(json) {
  try {
    const resume = JSON.parse(json);
    
    // Format the JSON resume into a text representation
    let text = '';
    
    // Basic info
    if (resume.basics) {
      text += `${resume.basics.name || ''}\n`;
      text += `${resume.basics.label || ''}\n`;
      text += `${resume.basics.email || ''}\n`;
      text += `${resume.basics.phone || ''}\n`;
      text += `${resume.basics.summary || ''}\n\n`;
    }
    
    // Work experience
    if (resume.work && resume.work.length) {
      text += 'WORK EXPERIENCE\n';
      resume.work.forEach(job => {
        text += `${job.position || ''} at ${job.company || ''}\n`;
        if (job.startDate) text += `${job.startDate} - ${job.endDate || 'Present'}\n`;
        text += `${job.summary || ''}\n`;
        if (job.highlights && job.highlights.length) {
          job.highlights.forEach(highlight => {
            text += `- ${highlight}\n`;
          });
        }
        text += '\n';
      });
    }
    
    // Education
    if (resume.education && resume.education.length) {
      text += 'EDUCATION\n';
      resume.education.forEach(edu => {
        text += `${edu.studyType || ''} in ${edu.area || ''} at ${edu.institution || ''}\n`;
        if (edu.startDate) text += `${edu.startDate} - ${edu.endDate || 'Present'}\n`;
        text += '\n';
      });
    }
    
    // Skills
    if (resume.skills && resume.skills.length) {
      text += 'SKILLS\n';
      resume.skills.forEach(skill => {
        text += `${skill.name || ''}: ${skill.keywords ? skill.keywords.join(', ') : ''}\n`;
      });
    }
    
    return text;
  } catch (error) {
    logger.error('JSON resume parsing failed', { error });
    throw new Error('Invalid JSON resume format');
  }
}

module.exports = {
  parseResume
};
