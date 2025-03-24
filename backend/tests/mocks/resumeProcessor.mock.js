// tests/mocks/resumeProcessor.mock.js
const sinon = require('sinon');

/**
 * Mock of the ResumeProcessor for testing
 */
class MockResumeProcessor {
  constructor() {
    this.queue = {
      process: sinon.stub(),
      on: sinon.stub()
    };
    
    this.aiService = {
      generateProfileFromResume: sinon.stub().resolves('Profile content'),
      analyzeJobDescription: sinon.stub().resolves('Analysis content'),
      generateCustomizedResume: sinon.stub().resolves('Customized resume content')
    };
    
    this.updateJobStatus = sinon.stub().resolves();
    this.handleProcessingError = sinon.stub().resolves();
  }
  
  /**
   * Mock implementation of processCustomization method
   */
  async processCustomization(job) {
    const { jobId, userId } = job.data;
    try {
      // Update job status to processing
      await this.updateJobStatus(jobId, 'processing');
      
      // Mock parsing and processing
      const parsedContent = job.data.resumeContent;
      const jobDescContent = job.data.jobDescription;
      
      // Generate profile
      const profileContent = await this.aiService.generateProfileFromResume(parsedContent);
      
      // Analyze job
      const researchContent = await this.aiService.analyzeJobDescription(jobDescContent);
      
      // Customize resume
      const customizedResume = await this.aiService.generateCustomizedResume(
        profileContent,
        researchContent,
        parsedContent
      );
      
      // Update job status to completed
      await this.updateJobStatus(jobId, 'completed', {
        result: customizedResume,
        completedAt: new Date()
      });
      
      return { status: 'success', jobId };
      
    } catch (error) {
      await this.handleProcessingError(jobId, error);
      throw error;
    }
  }
}

module.exports = MockResumeProcessor;
