// tests/unit/utils/resumeParser.test.js
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const { parseResume } = require('../../../utils/resumeParser');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { JSDOM } = require('jsdom');
const logger = require('../../../utils/logger');

describe('resumeParser', () => {
  let loggerStub;
  
  beforeEach(() => {
    // Stub logger to avoid console output during tests
    loggerStub = {
      error: sinon.stub(),
      warn: sinon.stub()
    };
    sinon.stub(logger, 'error').callsFake(loggerStub.error);
    sinon.stub(logger, 'warn').callsFake(loggerStub.warn);
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('parseResume', () => {
    it('should return content directly if it is already plain text', async () => {
      const plainText = 'This is a plain text resume';
      const result = await parseResume(plainText, 'text');
      expect(result).to.equal(plainText);
    });
    
    it('should handle base64 encoded content', async () => {
      // Create a simple base64 encoded string
      const base64Content = 'data:text/plain;base64,VGhpcyBpcyBhIHRlc3QgcmVzdW1l';
      
      // We expect it to be converted to "This is a test resume"
      const expectedText = 'This is a test resume';
      
      const result = await parseResume(base64Content, 'text');
      expect(result).to.equal(expectedText);
    });
    
    it('should handle unsupported formats', async () => {
      const content = 'Some content';
      const format = 'unsupported';
      
      const result = await parseResume(content, format);
      
      expect(result).to.equal(content);
      expect(logger.warn.calledOnce).to.be.true;
      expect(logger.warn.firstCall.args[0]).to.include('Unsupported resume format');
    });
    
    it('should throw error when parsing fails', async () => {
      const invalidBuffer = Buffer.from('invalid content');
      
      // Stub pdf-parse to throw an error
      sinon.stub(pdf, 'default').rejects(new Error('PDF parsing failed'));
      
      try {
        await parseResume(invalidBuffer, 'pdf');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to parse resume');
        expect(logger.error.calledOnce).to.be.true;
      }
    });
  });
  
  describe('PDF parsing', () => {
    it('should parse PDF content correctly', async () => {
      // Stub pdf-parse to return expected result
      sinon.stub(pdf, 'default').resolves({
        text: 'Extracted PDF text'
      });
      
      const buffer = Buffer.from('mock pdf content');
      const result = await parseResume(buffer, 'pdf');
      
      expect(result).to.equal('Extracted PDF text');
      expect(pdf.default.calledOnce).to.be.true;
    });
  });
  
  describe('DOCX parsing', () => {
    it('should parse DOCX content correctly', async () => {
      // Stub mammoth to return expected result
      sinon.stub(mammoth, 'extractRawText').resolves({
        value: 'Extracted DOCX text'
      });
      
      const buffer = Buffer.from('mock docx content');
      const result = await parseResume(buffer, 'docx');
      
      expect(result).to.equal('Extracted DOCX text');
      expect(mammoth.extractRawText.calledOnce).to.be.true;
    });
  });
  
  describe('HTML parsing', () => {
    it('should parse HTML content correctly', async () => {
      // Create a simple HTML document
      const html = '<html><body>Resume content</body></html>';
      
      // Create a stub for JSDOM
      const mockTextContent = 'Resume content';
      const mockDocument = {
        body: {
          textContent: mockTextContent
        }
      };
      const mockWindow = { document: mockDocument };
      sinon.stub(JSDOM.prototype, 'window').get(() => mockWindow);
      
      const result = await parseResume(html, 'html');
      
      expect(result).to.equal(mockTextContent);
    });
  });
  
  describe('JSON parsing', () => {
    it('should parse JSON resume format correctly', async () => {
      // Create a sample JSON resume
      const jsonResume = JSON.stringify({
        basics: {
          name: 'John Doe',
          label: 'Software Engineer',
          email: 'john@example.com',
          phone: '123-456-7890',
          summary: 'Experienced developer'
        },
        work: [
          {
            position: 'Senior Developer',
            company: 'Tech Corp',
            startDate: '2020-01',
            endDate: '2023-01',
            summary: 'Led development team',
            highlights: ['Project A', 'Project B']
          }
        ],
        education: [
          {
            institution: 'University',
            area: 'Computer Science',
            studyType: 'Bachelor',
            startDate: '2015-01',
            endDate: '2019-01'
          }
        ],
        skills: [
          {
            name: 'Programming',
            keywords: ['JavaScript', 'Python']
          }
        ]
      });
      
      const result = await parseResume(jsonResume, 'json');
      
      // Verify all sections are included
      expect(result).to.include('John Doe');
      expect(result).to.include('WORK EXPERIENCE');
      expect(result).to.include('Senior Developer at Tech Corp');
      expect(result).to.include('- Project A');
      expect(result).to.include('EDUCATION');
      expect(result).to.include('Bachelor in Computer Science at University');
      expect(result).to.include('SKILLS');
      expect(result).to.include('Programming: JavaScript, Python');
    });
    
    it('should handle invalid JSON format', async () => {
      const invalidJson = '{invalid:json}';
      
      try {
        await parseResume(invalidJson, 'json');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Invalid JSON resume format');
      }
    });
    
    it('should handle missing fields in JSON resume', async () => {
      // Create a minimal JSON resume
      const minimalResume = JSON.stringify({
        basics: {
          name: 'John Doe'
        }
      });
      
      const result = await parseResume(minimalResume, 'json');
      
      expect(result).to.include('John Doe');
      expect(result).not.to.include('WORK EXPERIENCE');
      expect(result).not.to.include('EDUCATION');
    });
  });
});
