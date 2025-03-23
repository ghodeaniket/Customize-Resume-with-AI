// tests/unit/utils/jobScraper.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const { fetchJobDescription } = require('../../../utils/jobScraper');

describe('Job Scraper', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('fetchJobDescription function', () => {
    it('should handle LinkedIn job URLs correctly', async () => {
      // Mock HTML response
      const mockHtml = `
        <html>
          <body>
            <div class="description__text">
              This is a LinkedIn job description.
              Senior Software Engineer position.
            </div>
          </body>
        </html>
      `;
      
      // Stub axios.get to return the mock response
      sinon.stub(axios, 'get').resolves({ data: mockHtml });
      
      const result = await fetchJobDescription('https://www.linkedin.com/jobs/view/123456');
      
      expect(result).to.include('LinkedIn job description');
      expect(result).to.include('Senior Software Engineer');
    });

    it('should handle Indeed job URLs correctly', async () => {
      // Mock HTML response
      const mockHtml = `
        <html>
          <body>
            <div id="jobDescriptionText">
              This is an Indeed job description.
              Full Stack Developer position.
            </div>
          </body>
        </html>
      `;
      
      // Stub axios.get to return the mock response
      sinon.stub(axios, 'get').resolves({ data: mockHtml });
      
      const result = await fetchJobDescription('https://www.indeed.com/viewjob?jk=123456');
      
      expect(result).to.include('Indeed job description');
      expect(result).to.include('Full Stack Developer');
    });

    it('should handle Glassdoor job URLs correctly', async () => {
      // Mock HTML response
      const mockHtml = `
        <html>
          <body>
            <div class="jobDescriptionContent">
              This is a Glassdoor job description.
              Product Manager position.
            </div>
          </body>
        </html>
      `;
      
      // Stub axios.get to return the mock response
      sinon.stub(axios, 'get').resolves({ data: mockHtml });
      
      const result = await fetchJobDescription('https://www.glassdoor.com/job-listing/123456');
      
      expect(result).to.include('Glassdoor job description');
      expect(result).to.include('Product Manager');
    });

    it('should use Readability for generic job pages', async () => {
      // Mock HTML response
      const mockHtml = `
        <html>
          <body>
            <article>
              <h1>Job Title</h1>
              <p>This is a generic job description.</p>
            </article>
          </body>
        </html>
      `;
      
      // Stub axios.get to return the mock response
      sinon.stub(axios, 'get').resolves({ data: mockHtml });
      
      // Stub Readability
      const mockReadabilityResult = {
        textContent: 'Extracted job content using Readability.'
      };
      
      const readabilityParseStub = sinon.stub(Readability.prototype, 'parse')
        .returns(mockReadabilityResult);
      
      const result = await fetchJobDescription('https://example.com/jobs/123456');
      
      expect(result).to.equal('Extracted job content using Readability.');
      expect(readabilityParseStub.calledOnce).to.be.true;
    });

    it('should fall back to document.body.textContent if Readability returns null', async () => {
      // Mock HTML response
      const mockHtml = `
        <html>
          <body>
            This is the fallback content from body.textContent.
          </body>
        </html>
      `;
      
      // Stub axios.get to return the mock response
      sinon.stub(axios, 'get').resolves({ data: mockHtml });
      
      // Stub Readability to return null
      sinon.stub(Readability.prototype, 'parse').returns(null);
      
      // Create a stub for JSDOM that returns our mock body.textContent
      const mockDom = new JSDOM(mockHtml);
      sinon.stub(JSDOM, 'prototype').returns(mockDom);
      
      const result = await fetchJobDescription('https://example.com/jobs/123456');
      
      expect(result).to.include('fallback content from body.textContent');
    });

    it('should throw an error for invalid URLs', async () => {
      try {
        await fetchJobDescription('invalid-url');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to fetch job description');
      }
    });

    it('should handle network errors gracefully', async () => {
      // Stub axios.get to throw an error
      sinon.stub(axios, 'get').rejects(new Error('Network error'));
      
      try {
        await fetchJobDescription('https://example.com/jobs/123456');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to fetch job description');
      }
    });
  });
});
