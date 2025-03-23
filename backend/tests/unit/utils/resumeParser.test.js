// tests/unit/utils/resumeParser.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const { parseResume } = require('../../../utils/resumeParser');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const { JSDOM } = require('jsdom');

describe('Resume Parser', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('parseResume function', () => {
    it('should handle plain text content directly', async () => {
      const plainText = 'John Doe\nSoftware Engineer\njohn@example.com';
      
      const result = await parseResume(plainText, 'text');
      
      expect(result).to.equal(plainText);
    });

    it('should parse PDF content correctly', async () => {
      // Create a stub for pdf-parse
      const pdfText = 'Extracted PDF text content';
      const pdfStub = sinon.stub(pdf, 'default').resolves({ text: pdfText });
      
      // Create a mock Buffer
      const buffer = Buffer.from('mock pdf content');
      
      const result = await parseResume(buffer, 'pdf');
      
      expect(result).to.equal(pdfText);
      expect(pdfStub.calledOnce).to.be.true;
      expect(pdfStub.firstCall.args[0]).to.equal(buffer);
    });

    it('should parse DOCX content correctly', async () => {
      // Create a stub for mammoth
      const docxText = 'Extracted DOCX text content';
      const mammothStub = sinon.stub(mammoth, 'extractRawText').resolves({ value: docxText });
      
      // Create a mock Buffer
      const buffer = Buffer.from('mock docx content');
      
      const result = await parseResume(buffer, 'docx');
      
      expect(result).to.equal(docxText);
      expect(mammothStub.calledOnce).to.be.true;
      expect(mammothStub.firstCall.args[0].buffer).to.equal(buffer);
    });

    it('should parse HTML content correctly', async () => {
      // Create a stub for JSDOM
      const htmlText = 'Extracted HTML text content';
      const domStub = sinon.stub(JSDOM.prototype, 'window').get(() => {
        return {
          document: {
            body: {
              textContent: htmlText
            }
          }
        };
      });
      
      const htmlContent = '<html><body>Some HTML content</body></html>';
      
      const result = await parseResume(Buffer.from(htmlContent), 'html');
      
      expect(result).to.equal(htmlText);
    });

    it('should parse JSON resume format correctly', async () => {
      const jsonResume = {
        basics: {
          name: 'John Doe',
          label: 'Software Engineer',
          email: 'john@example.com',
          phone: '(123) 456-7890',
          summary: 'Experienced software engineer'
        },
        work: [
          {
            company: 'Tech Company',
            position: 'Senior Developer',
            startDate: '2020-01',
            endDate: 'Present',
            summary: 'Lead developer',
            highlights: ['Project A', 'Project B']
          }
        ],
        education: [
          {
            institution: 'University',
            area: 'Computer Science',
            studyType: 'Bachelor',
            startDate: '2012',
            endDate: '2016'
          }
        ],
        skills: [
          {
            name: 'Programming',
            keywords: ['JavaScript', 'Python', 'Java']
          }
        ]
      };
      
      const result = await parseResume(Buffer.from(JSON.stringify(jsonResume)), 'json');
      
      expect(result).to.include('John Doe');
      expect(result).to.include('Software Engineer');
      expect(result).to.include('WORK EXPERIENCE');
      expect(result).to.include('Senior Developer at Tech Company');
      expect(result).to.include('EDUCATION');
      expect(result).to.include('Bachelor in Computer Science at University');
      expect(result).to.include('SKILLS');
      expect(result).to.include('Programming: JavaScript, Python, Java');
    });

    it('should handle base64 encoded content', async () => {
      // Mock base64 content
      const base64Content = 'data:application/pdf;base64,JVBERi0xLjMKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAErVAhUKFQwNDJUMFJwVTA=';
      
      // Create a stub for pdf-parse
      const pdfText = 'Extracted PDF text from base64';
      const pdfStub = sinon.stub(pdf, 'default').resolves({ text: pdfText });
      
      const result = await parseResume(base64Content, 'pdf');
      
      expect(result).to.equal(pdfText);
      expect(pdfStub.calledOnce).to.be.true;
      // The function should have converted base64 to buffer before passing to pdf-parse
    });

    it('should throw an error for unsupported formats', async () => {
      try {
        await parseResume('some content', 'unsupported_format');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to parse resume');
      }
    });

    it('should handle parsing errors gracefully', async () => {
      // Create a stub that throws an error
      sinon.stub(pdf, 'default').rejects(new Error('PDF parsing failed'));
      
      try {
        await parseResume(Buffer.from('invalid pdf content'), 'pdf');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to parse resume');
      }
    });
  });
});
