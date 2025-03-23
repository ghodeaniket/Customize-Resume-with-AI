// utils/documentReconstructor.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { createWriteStream } = require('fs');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

/**
 * Reconstruct a formatted document from customized content
 * @param {Object} originalDocument - Original document data with structure
 * @param {string} customizedContent - AI-customized text content
 * @returns {Promise<Buffer>} - Buffer containing the reconstructed document (PDF)
 */
async function reconstructDocument(originalDocument, customizedContent) {
  try {
    // For now, we'll create a simple PDF with the customized content
    // In a production implementation, we would use the original structure to guide formatting
    
    // Generate a temporary file path
    const tempFilePath = path.join(os.tmpdir(), `${uuidv4()}.pdf`);
    
    // Create a new PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });
    
    // Pipe output to a file
    const stream = doc.pipe(createWriteStream(tempFilePath));
    
    // Parse the customized content to identify sections
    const sections = parseContentSections(customizedContent);
    
    // Format the document
    formatDocument(doc, sections, originalDocument.format);
    
    // Finalize the document
    doc.end();
    
    // Wait for the file to be written
    return new Promise((resolve, reject) => {
      stream.on('finish', async () => {
        try {
          // Read the file as a buffer
          const buffer = await fs.promises.readFile(tempFilePath);
          
          // Clean up the temporary file
          await fs.promises.unlink(tempFilePath);
          
          resolve(buffer);
        } catch (error) {
          reject(error);
        }
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    logger.error('Document reconstruction failed', { error });
    throw new Error(`Failed to reconstruct document: ${error.message}`);
  }
}

/**
 * Parse content into sections for formatting
 */
function parseContentSections(content) {
  // Split content by double newlines to identify paragraphs
  const paragraphs = content.split(/\n\n+/);
  
  // Identify different section types
  const sections = [];
  let currentSection = null;
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    
    if (!trimmedParagraph) continue;
    
    // Check if it's a heading (all caps, short, or ending with colon)
    if (
      isHeading(trimmedParagraph)
    ) {
      sections.push({
        type: 'heading',
        content: trimmedParagraph
      });
    } 
    // Check if it's a list (starts with - or •)
    else if (trimmedParagraph.match(/^[-•*]\s/m)) {
      // Split into list items
      const items = trimmedParagraph.split(/\n[-•*]\s/).filter(Boolean);
      
      if (items.length === 0 && trimmedParagraph) {
        // If splitting failed but there's content, add the original as a single item
        items.push(trimmedParagraph.replace(/^[-•*]\s/, ''));
      }
      
      sections.push({
        type: 'list',
        items: items
      });
    } 
    // Treat as regular paragraph
    else {
      sections.push({
        type: 'paragraph',
        content: trimmedParagraph
      });
    }
  }
  
  return sections;
}

/**
 * Check if a paragraph is likely a heading
 */
function isHeading(paragraph) {
  // If it's all uppercase, short, or ends with colon, it's likely a heading
  return (
    paragraph === paragraph.toUpperCase() || 
    (paragraph.length < 50 && !paragraph.includes(' - ')) ||
    paragraph.endsWith(':') ||
    // Check for common resume section headings
    /^(EDUCATION|EXPERIENCE|SKILLS|WORK EXPERIENCE|PROFESSIONAL SUMMARY|CERTIFICATIONS|PROJECTS)/i.test(paragraph)
  );
}

/**
 * Format the PDF document with the parsed sections
 */
function formatDocument(doc, sections, originalFormat) {
  // Set default fonts
  doc.font('Helvetica');
  
  // Set document title
  doc.fontSize(18).text('Resume', { align: 'center' });
  doc.moveDown();
  
  // Format each section
  for (const section of sections) {
    switch (section.type) {
      case 'heading':
        doc.font('Helvetica-Bold').fontSize(14).text(section.content, { underline: true });
        doc.moveDown(0.5);
        break;
        
      case 'paragraph':
        doc.font('Helvetica').fontSize(12).text(section.content);
        doc.moveDown();
        break;
        
      case 'list':
        doc.font('Helvetica').fontSize(12);
        for (const item of section.items) {
          doc.list([item], { bulletRadius: 2, textIndent: 20 });
        }
        doc.moveDown();
        break;
    }
  }
}

module.exports = {
  reconstructDocument
};
