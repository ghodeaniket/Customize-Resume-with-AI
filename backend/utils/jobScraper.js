// utils/jobScraper.js
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const logger = require('./logger');

/**
 * Fetch job description from a URL
 * @param {string} url - URL of the job posting
 * @returns {Promise<string>} - Plain text of the job description
 */
async function fetchJobDescription(url) {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    
    // Add special handling for common job sites
    if (isLinkedInJob(parsedUrl)) {
      return await scrapeLinkedInJob(url);
    } else if (isIndeedJob(parsedUrl)) {
      return await scrapeIndeedJob(url);
    } else if (isGlassdoorJob(parsedUrl)) {
      return await scrapeGlassdoorJob(url);
    }
    
    // Generic scraping for other sites
    return await scrapeGenericJobPage(url);
  } catch (error) {
    logger.error('Job description scraping failed', { error, url });
    throw new Error(`Failed to fetch job description: ${error.message}`);
  }
}

/**
 * Check if URL is a LinkedIn job posting
 */
function isLinkedInJob(parsedUrl) {
  return parsedUrl.hostname.includes('linkedin.com') && 
         (parsedUrl.pathname.includes('/jobs/') || 
          parsedUrl.pathname.includes('/view/'));
}

/**
 * Check if URL is an Indeed job posting
 */
function isIndeedJob(parsedUrl) {
  return parsedUrl.hostname.includes('indeed.com') && 
         parsedUrl.pathname.includes('/viewjob');
}

/**
 * Check if URL is a Glassdoor job posting
 */
function isGlassdoorJob(parsedUrl) {
  return parsedUrl.hostname.includes('glassdoor.com') && 
         parsedUrl.pathname.includes('/job-listing/');
}

/**
 * Scrape LinkedIn job posting
 */
async function scrapeLinkedInJob(url) {
  // LinkedIn requires authentication, use a headless browser or their API
  // This is a simplified version - in production you would need more robust handling
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  const dom = new JSDOM(response.data);
  
  // Try to find job description section
  const jobDescriptionElement = dom.window.document.querySelector('.description__text');
  if (jobDescriptionElement) {
    return jobDescriptionElement.textContent;
  }
  
  // Fallback to generic extraction
  return extractMainContent(dom.window.document);
}

/**
 * Scrape Indeed job posting
 */
async function scrapeIndeedJob(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  const dom = new JSDOM(response.data);
  
  // Try to find job description section
  const jobDescriptionElement = dom.window.document.querySelector('#jobDescriptionText');
  if (jobDescriptionElement) {
    return jobDescriptionElement.textContent;
  }
  
  // Fallback to generic extraction
  return extractMainContent(dom.window.document);
}

/**
 * Scrape Glassdoor job posting
 */
async function scrapeGlassdoorJob(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  const dom = new JSDOM(response.data);
  
  // Try to find job description section
  const jobDescriptionElement = dom.window.document.querySelector('.jobDescriptionContent');
  if (jobDescriptionElement) {
    return jobDescriptionElement.textContent;
  }
  
  // Fallback to generic extraction
  return extractMainContent(dom.window.document);
}

/**
 * Generic job page scraper
 */
async function scrapeGenericJobPage(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  const dom = new JSDOM(response.data);
  return extractMainContent(dom.window.document);
}

/**
 * Extract main content from a web page using Readability
 */
function extractMainContent(document) {
  const reader = new Readability(document);
  const article = reader.parse();
  
  if (article && article.textContent) {
    return article.textContent;
  }
  
  // Last resort fallback
  return document.body.textContent;
}

module.exports = {
  fetchJobDescription
};
