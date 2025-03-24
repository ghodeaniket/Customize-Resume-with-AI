// utils/FormatService.js
const { jsPDF } = require('jspdf');
const { convert } = require('html-to-text');
const showdown = require('showdown');
const logger = require('./logger');
const AIService = require('./AIService');

/**
 * Service for handling different resume output formats
 */
class FormatService {
  /**
   * Convert plain text resume to the requested output format
   * @param {string} resumeContent - Plain text resume content
   * @param {string} outputFormat - Desired output format (text, markdown, html, pdf)
   * @param {Object} [options] - Additional format options
   * @returns {Promise<Buffer|string>} - Formatted resume content
   */
  async convertToFormat(resumeContent, outputFormat = 'text', options = {}) {
    try {
      logger.info(`Converting resume to ${outputFormat} format`);
      
      switch (outputFormat.toLowerCase()) {
        case 'text':
          return resumeContent;
          
        case 'markdown':
          return await this.convertToMarkdown(resumeContent, options);
          
        case 'html':
          return await this.convertToHtml(resumeContent, options);
          
        case 'pdf':
          return await this.convertToPdf(resumeContent, options);
          
        default:
          logger.warn(`Unsupported output format: ${outputFormat}, using text format`);
          return resumeContent;
      }
    } catch (error) {
      logger.error('Resume format conversion failed', { error, outputFormat });
      throw new Error(`Failed to convert resume to ${outputFormat}: ${error.message}`);
    }
  }
  
  /**
   * Convert plain text resume to Markdown
   * @param {string} resumeContent - Plain text resume content
   * @param {Object} options - Markdown options
   * @returns {Promise<string>} - Markdown formatted resume
   */
  async convertToMarkdown(resumeContent, options = {}) {
    try {
      // If we have an AI service, use it for intelligent markdown conversion
      if (options.aiService && options.aiService instanceof AIService) {
        const markdownPrompt = await options.promptManager.loadPromptTemplate('markdown-formatter');
        
        return await options.aiService.makeRequest(
          options.markdownModel || 'anthropic/claude-3-haiku',
          markdownPrompt,
          resumeContent,
          { temperature: 0.2 }
        );
      }
      
      // Simple formatting if no AI service is available
      // Split by sections and apply basic markdown formatting
      const lines = resumeContent.split('\n');
      let markdown = '';
      let inList = false;
      
      lines.forEach(line => {
        // Detect section headers
        if (line.toUpperCase() === line && line.trim().length > 0) {
          markdown += `\n## ${line}\n\n`;
          inList = false;
        } 
        // Detect list items
        else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
          markdown += `${line}\n`;
          inList = true;
        }
        // Detect potential job titles or education entries (assumption)
        else if (line.includes(',') && !inList) {
          const parts = line.split(',');
          markdown += `### ${parts[0].trim()}\n`;
          markdown += `${parts.slice(1).join(',').trim()}\n\n`;
          inList = false;
        }
        // Normal text
        else {
          markdown += `${line}\n`;
          inList = false;
        }
      });
      
      return markdown;
    } catch (error) {
      logger.error('Markdown conversion failed', { error });
      // Return plain text if conversion fails
      return resumeContent;
    }
  }
  
  /**
   * Convert plain text or markdown resume to HTML
   * @param {string} resumeContent - Plain text or markdown resume content
   * @param {Object} options - HTML options
   * @returns {Promise<string>} - HTML formatted resume
   */
  async convertToHtml(resumeContent, options = {}) {
    try {
      // If we have an AI service, use it for intelligent HTML conversion
      if (options.aiService && options.aiService instanceof AIService) {
        const htmlPrompt = await options.promptManager.loadPromptTemplate('html-formatter');
        
        return await options.aiService.makeRequest(
          options.htmlModel || 'anthropic/claude-3-haiku',
          htmlPrompt,
          resumeContent,
          { temperature: 0.2 }
        );
      }
      
      // Simple conversion using Showdown if no AI service
      // First convert to markdown if it's plain text
      let markdown = resumeContent;
      if (!resumeContent.includes('#') && !resumeContent.includes('**')) {
        markdown = await this.convertToMarkdown(resumeContent, options);
      }
      
      // Convert markdown to HTML
      const converter = new showdown.Converter({
        tables: true,
        tasklists: true,
        strikethrough: true
      });
      
      let html = converter.makeHtml(markdown);
      
      // Add basic styling
      html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3, h4 {
      margin-top: 20px;
      margin-bottom: 10px;
      color: #2c3e50;
    }
    h1 {
      font-size: 24px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    h2 {
      font-size: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }
    h3 {
      font-size: 18px;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 5px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="container">
    ${html}
  </div>
</body>
</html>
      `;
      
      return html;
    } catch (error) {
      logger.error('HTML conversion failed', { error });
      
      // Return a basic HTML wrapper if conversion fails
      return `
<!DOCTYPE html>
<html>
<head><title>Resume</title></head>
<body><pre>${resumeContent}</pre></body>
</html>
      `;
    }
  }
  
  /**
   * Convert resume content to PDF
   * @param {string} resumeContent - Plain text or HTML resume content
   * @param {Object} options - PDF options
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async convertToPdf(resumeContent, options = {}) {
    try {
      // Determine if input is HTML or plain text
      const isHtml = resumeContent.trim().startsWith('<!DOCTYPE html>') ||
                    resumeContent.trim().startsWith('<html');
      
      // Convert to HTML first if not already HTML
      const htmlContent = isHtml ? 
        resumeContent : 
        await this.convertToHtml(resumeContent, options);
      
      // Create PDF from HTML
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      
      // If input is HTML, we could use html2canvas or similar
      // For simplicity in this example, we'll extract text from HTML
      // and format it as a basic PDF
      const textContent = isHtml ? 
        convert(htmlContent, { wordwrap: 130 }) : 
        resumeContent;
      
      const textLines = doc.splitTextToSize(textContent, pageWidth - (margin * 2));
      
      let y = margin;
      doc.setFont('helvetica');
      doc.setFontSize(11);
      
      textLines.forEach(line => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        
        doc.text(line, margin, y);
        y += 5;
      });
      
      return Buffer.from(doc.output('arraybuffer'));
    } catch (error) {
      logger.error('PDF conversion failed', { error });
      throw new Error(`Failed to convert resume to PDF: ${error.message}`);
    }
  }
  
  /**
   * Analyze a PDF resume to detect its format structure
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Promise<Object>} - Format structure information
   */
  async analyzePdfFormat(pdfBuffer) {
    try {
      // This is a placeholder for future implementation
      // In Phase 2 and 3, this would analyze the PDF structure
      // to enable better format preservation
      return {
        formatDetected: 'basic',
        sections: [],
        fonts: [],
        layout: 'single-column'
      };
    } catch (error) {
      logger.error('PDF format analysis failed', { error });
      return { formatDetected: 'unknown' };
    }
  }
}

module.exports = FormatService;
