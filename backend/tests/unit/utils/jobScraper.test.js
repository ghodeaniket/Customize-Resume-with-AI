// tests/unit/utils/jobScraper.test.js
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const { fetchJobDescription } = require('../../../utils/jobScraper');
const logger = require('../../../utils/logger');

describe('jobScraper', () => {
  let axiosStub;
  let loggerStub;
  let readabilityParseStub;
  let mockDocument;
  
  beforeEach(() => {
    // Stub axios
    axiosStub = sinon.stub(axios, 'get');
    
    // Stub logger
    loggerStub = sinon.stub(logger, 'error');
    
    // Create mock document for JSDOM
    mockDocument = {
      querySelector: sinon.stub(),
      body: {
        textContent: 'Generic body content'
      }
    };
    
    // Stub JSDOM
    sinon.stub(JSDOM.prototype, 'window').get(() => ({
      document: mockDocument
    }));
    
    // Stub Readability
    readabilityParseStub = sinon.stub().returns({
      textContent: 'Parsed article content'
    });
    sinon.stub(Readability.prototype, 'parse').callsFake(readabilityParseStub);
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('fetchJobDescription', () => {
    it('should throw error for invalid URLs', async () => {
      try {
        await fetchJobDescription('invalid-url');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to fetch job description');
        expect(loggerStub.calledOnce).to.be.true;
      }
    });
    
    it('should use LinkedIn scraper for LinkedIn job URLs', async () => {
      const linkedInUrl = 'https://www.linkedin.com/jobs/view/123456';
      
      // Set up mock response
      axiosStub.resolves({
        data: '<html><body><div class="description__text">LinkedIn job description</div></body></html>'
      });
      
      // Set up mock querySelector to return an element
      mockDocument.querySelector.withArgs('.description__text').returns({
        textContent: 'LinkedIn job description'
      });
      
      const result = await fetchJobDescription(linkedInUrl);
      
      expect(result).to.equal('LinkedIn job description');
      expect(axiosStub.calledOnce).to.be.true;
      expect(axiosStub.firstCall.args[0]).to.equal(linkedInUrl);
    });
    
    it('should use Indeed scraper for Indeed job URLs', async () => {
      const indeedUrl = 'https://www.indeed.com/viewjob?jk=123456';
      
      // Set up mock response
      axiosStub.resolves({
        data: '<html><body><div id="jobDescriptionText">Indeed job description</div></body></html>'
      });
      
      // Set up mock querySelector to return an element
      mockDocument.querySelector.withArgs('#jobDescriptionText').returns({
        textContent: 'Indeed job description'
      });
      
      const result = await fetchJobDescription(indeedUrl);
      
      expect(result).to.equal('Indeed job description');
      expect(axiosStub.calledOnce).to.be.true;
      expect(axiosStub.firstCall.args[0]).to.equal(indeedUrl);
    });
    
    it('should use Glassdoor scraper for Glassdoor job URLs', async () => {
      const glassdoorUrl = 'https://www.glassdoor.com/job-listing/123456';
      
      // Set up mock response
      axiosStub.resolves({
        data: '<html><body><div class="jobDescriptionContent">Glassdoor job description</div></body></html>'
      });
      
      // Set up mock querySelector to return an element
      mockDocument.querySelector.withArgs('.jobDescriptionContent').returns({
        textContent: 'Glassdoor job description'
      });
      
      const result = await fetchJobDescription(glassdoorUrl);
      
      expect(result).to.equal('Glassdoor job description');
      expect(axiosStub.calledOnce).to.be.true;
      expect(axiosStub.firstCall.args[0]).to.equal(glassdoorUrl);
    });
    
    it('should use generic scraper for unknown job sites', async () => {
      const genericUrl = 'https://www.example.com/jobs/123456';
      
      // Set up mock response
      axiosStub.resolves({
        data: '<html><body>Generic job page content</body></html>'
      });
      
      const result = await fetchJobDescription(genericUrl);
      
      expect(result).to.equal('Parsed article content');
      expect(axiosStub.calledOnce).to.be.true;
      expect(axiosStub.firstCall.args[0]).to.equal(genericUrl);
      expect(readabilityParseStub.calledOnce).to.be.true;
    });
    
    it('should handle network errors', async () => {
      const url = 'https://www.example.com/jobs/123456';
      
      // Simulate network error
      axiosStub.rejects(new Error('Network error'));
      
      try {
        await fetchJobDescription(url);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to fetch job description');
        expect(error.message).to.include('Network error');
        expect(loggerStub.calledOnce).to.be.true;
      }
    });
    
    it('should fall back to Readability when specific selectors are not found', async () => {
      const linkedInUrl = 'https://www.linkedin.com/jobs/view/123456';
      
      // Set up mock response
      axiosStub.resolves({
        data: '<html><body>LinkedIn page without job description div</body></html>'
      });
      
      // Set up mock querySelector to return null (element not found)
      mockDocument.querySelector.returns(null);
      
      const result = await fetchJobDescription(linkedInUrl);
      
      expect(result).to.equal('Parsed article content');
      expect(readabilityParseStub.calledOnce).to.be.true;
    });
    
    it('should fall back to body text when Readability fails', async () => {
      const genericUrl = 'https://www.example.com/jobs/123456';
      
      // Set up mock response
      axiosStub.resolves({
        data: '<html><body>Generic job page content</body></html>'
      });
      
      // Make Readability return null (parsing failed)
      readabilityParseStub.returns(null);
      
      const result = await fetchJobDescription(genericUrl);
      
      expect(result).to.equal('Generic body content');
    });
  });
});
