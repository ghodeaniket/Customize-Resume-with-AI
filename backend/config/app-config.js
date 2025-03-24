// config/app-config.js
/**
 * Application configuration management
 * Centralizes environment variables and app settings
 */

const config = {
  // AI Models configuration
  ai: {
    openrouter: {
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      serviceUrl: process.env.SERVICE_URL || 'https://resume-customizer.example.com',
      defaultModels: {
        profiler: process.env.DEFAULT_PROFILER_MODEL || 'anthropic/claude-3-opus',
        researcher: process.env.DEFAULT_RESEARCHER_MODEL || 'anthropic/claude-3-opus',
        strategist: process.env.DEFAULT_STRATEGIST_MODEL || 'anthropic/claude-3-opus'
      },
      // Request defaults
      defaults: {
        temperature: 0.7,
        profilerMaxTokens: 2000,
        researcherMaxTokens: 2000,
        strategistMaxTokens: 3000
      },
      // Request timeout in milliseconds
      timeout: parseInt(process.env.OPENROUTER_TIMEOUT || '30000')
    }
  },
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || ''
  },
  
  // Queue configuration
  queue: {
    resumeProcessing: 'resume-processing',
    jobTypes: {
      customizeResume: 'customize-resume'
    },
    // Job processing timeouts in milliseconds
    timeouts: {
      customizeResume: parseInt(process.env.JOB_TIMEOUT || '300000') // 5 minutes
    },
    // Job retry settings
    retry: {
      attempts: parseInt(process.env.JOB_RETRY_ATTEMPTS || '3'),
      backoff: {
        type: 'exponential',
        delay: parseInt(process.env.JOB_RETRY_DELAY || '5000') // 5 seconds
      }
    }
  },
  
  // Resume parsing options
  resumeParsing: {
    supportedFormats: ['text', 'pdf', 'docx', 'html', 'json'],
    // Maximum file size in bytes
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  },
  
  // Job scraping configuration
  jobScraping: {
    // Timeout for HTTP requests in milliseconds
    timeout: parseInt(process.env.SCRAPING_TIMEOUT || '10000'),
    // Cache lifetime in seconds
    cacheTTL: parseInt(process.env.SCRAPING_CACHE_TTL || '3600'), // 1 hour
    // User agents to rotate through
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0'
    ]
  }
};

module.exports = config;
