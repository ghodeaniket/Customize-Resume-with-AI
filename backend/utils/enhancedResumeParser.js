// utils/enhancedResumeParser.js
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const logger = require('./logger');

/**
 * Enhanced resume parser that preserves formatting
 * @param {Buffer|string} content - The resume content (file buffer or base64 string)
 * @param {string} format - Format of the resume (pdf, docx, html, etc.)
 * @returns {Promise<Object>} - Resume data with structure preserved
 */
async function parseResumeWithFormatting(content, format) {
  try {
    // Convert base64 string to buffer if needed
    let buffer = content;
    if (typeof content === 'string' && content.startsWith('data:')) {
      const base64Data = content.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else if (typeof content === 'string' && !content.startsWith('data:')) {
      // If it's already plain text, just return it as is
      return {
        text: content,
        format: 'text',
        structure: {
          type: 'text',
          content: content
        },
        originalBuffer: null
      };
    }
    
    // Parse based on format
    switch (format.toLowerCase()) {
      case 'pdf':
        return await parsePdfWithStructure(buffer);
      
      case 'docx':
        return await parseDocxWithStructure(buffer);
      
      case 'html':
        return parseHtmlWithStructure(buffer.toString());
      
      default:
        logger.warn(`Unsupported resume format: ${format}, treating as plain text`);
        return {
          text: buffer.toString(),
          format: 'text',
          structure: {
            type: 'text',
            content: buffer.toString()
          },
          originalBuffer: buffer
        };
    }
  } catch (error) {
    logger.error('Enhanced resume parsing failed', { error, format });
    throw new Error(`Failed to parse resume with formatting: ${error.message}`);
  }
}

/**
 * Parse PDF with structure preservation
 */
async function parsePdfWithStructure(buffer) {
  // Basic PDF parsing for text
  const data = await pdf(buffer);
  
  // Note: In a production implementation, we would use a more sophisticated
  // PDF parsing library that can extract structure, formatting, and layout.
  // For now, we'll return a simplified structure with the text content.
  
  return {
    text: data.text,
    format: 'pdf',
    structure: {
      type: 'pdf',
      pageCount: data.numpages,
      info: data.info,
      metadata: data.metadata
    },
    originalBuffer: buffer
  };
}

/**
 * Parse DOCX with structure preservation
 */
async function parseDocxWithStructure(buffer) {
  // Extract text with styles using mammoth
  const result = await mammoth.extractRawText({ buffer });
  const textContent = result.value;
  
  // For more detailed structure, we'd use a different approach with docx library
  // or Office Open XML parsing. For this example, we're keeping it simple.
  
  return {
    text: textContent,
    format: 'docx',
    structure: {
      type: 'docx',
      // In a real implementation, we'd have section info, styles, etc.
      content: textContent
    },
    originalBuffer: buffer
  };
}

/**
 * Parse HTML with structure preservation
 */
function parseHtmlWithStructure(html) {
  const dom = new JSDOM(html);
  const textContent = dom.window.document.body.textContent;
  
  return {
    text: textContent,
    format: 'html',
    structure: {
      type: 'html',
      document: html
    },
    originalBuffer: Buffer.from(html)
  };
}

module.exports = {
  parseResumeWithFormatting
};
