// tests/unit/utils/BaseWorker.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const Queue = require('bull');
const axios = require('axios');
const BaseWorker = require('../../../utils/BaseWorker');
const db = require('../../../models');
const logger = require('../../../utils/logger');

describe('BaseWorker', () => {
  let queueStub;
  let axiosCreateStub;
  let dbUpdateStub;
  let loggerStub;
  let worker;
  
  beforeEach(() => {
    // Stub Queue
    queueStub = {
      process: sinon.stub(),
      on: sinon.stub()
    };
    sinon.stub(Queue.prototype, 'constructor').returns(queueStub);
    
    // Stub axios.create
    axiosCreateStub = sinon.stub(axios, 'create').returns({
      post: sinon.stub().resolves({ data: { choices: [{ message: { content: 'response' } }] } })
    });
    
    // Stub database
    dbUpdateStub = sinon.stub(db.Job, 'update').resolves([1]);
    
    // Stub logger
    loggerStub = {
      info: sinon.stub(),
      error: sinon.stub()
    };
    sinon.stub(logger, 'info').callsFake(loggerStub.info);
    sinon.stub(logger, 'error').callsFake(loggerStub.error);
    
    // Create test processor function
    const testProcessor = async (job) => {
      return { success: true, data: job.data };
    };
    
    // Create instance
    worker = new BaseWorker('test-queue', {
      'test-process': testProcessor
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('constructor', () => {
    it('should initialize with the given queue name', () => {
      expect(worker.queue).to.exist;
      expect(queueStub.on.calledTwice).to.be.true;
      expect(loggerStub.info.calledOnce).to.be.true;
      expect(loggerStub.info.firstCall.args[0]).to.include('Worker initialized');
    });
    
    it('should register processor functions', () => {
      expect(queueStub.process.calledOnce).to.be.true;
      expect(queueStub.process.firstCall.args[0]).to.equal('test-process');
    });
    
    it('should set up error handlers', () => {
      expect(queueStub.on.calledWith('failed')).to.be.true;
      expect(queueStub.on.calledWith('error')).to.be.true;
    });
  });
  
  describe('updateJobStatus', () => {
    it('should update job status in the database', async () => {
      await worker.updateJobStatus('job-123', 'processing');
      
      expect(dbUpdateStub.calledOnce).to.be.true;
      expect(dbUpdateStub.firstCall.args[0]).to.deep.equal({ status: 'processing' });
      expect(dbUpdateStub.firstCall.args[1].where).to.deep.equal({ jobId: 'job-123' });
    });
    
    it('should include additional data in the update', async () => {
      const additionalData = {
        result: 'Test result',
        completedAt: new Date()
      };
      
      await worker.updateJobStatus('job-123', 'completed', additionalData);
      
      expect(dbUpdateStub.calledOnce).to.be.true;
      expect(dbUpdateStub.firstCall.args[0].status).to.equal('completed');
      expect(dbUpdateStub.firstCall.args[0].result).to.equal('Test result');
      expect(dbUpdateStub.firstCall.args[0].completedAt).to.exist;
    });
    
    it('should throw an error if the database update fails', async () => {
      // Make database update fail
      dbUpdateStub.rejects(new Error('Database error'));
      
      try {
        await worker.updateJobStatus('job-123', 'processing');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Database update failed');
        expect(loggerStub.error.calledOnce).to.be.true;
      }
    });
  });
  
  describe('handleProcessingError', () => {
    it('should update job status to failed', async () => {
      const error = new Error('Processing error');
      await worker.handleProcessingError('job-123', error);
      
      expect(loggerStub.error.calledOnce).to.be.true;
      expect(dbUpdateStub.calledOnce).to.be.true;
      expect(dbUpdateStub.firstCall.args[0].status).to.equal('failed');
      expect(dbUpdateStub.firstCall.args[0].error).to.equal('Processing error');
    });
    
    it('should handle errors during status update', async () => {
      // Make database update fail
      dbUpdateStub.rejects(new Error('Database error'));
      
      const error = new Error('Processing error');
      await worker.handleProcessingError('job-123', error);
      
      // Should log both errors
      expect(loggerStub.error.calledTwice).to.be.true;
      expect(loggerStub.error.secondCall.args[0]).to.include('Failed to update job status after error');
    });
  });
  
  describe('handleFailedJob', () => {
    it('should log job failure details', () => {
      const mockJob = {
        data: {
          jobId: 'job-123'
        }
      };
      const mockError = new Error('Test error');
      mockError.stack = 'Error stack trace';
      
      worker.handleFailedJob(mockJob, mockError);
      
      expect(loggerStub.error.calledOnce).to.be.true;
      expect(loggerStub.error.firstCall.args[0]).to.equal('Job failed');
      expect(loggerStub.error.firstCall.args[1].jobId).to.equal('job-123');
      expect(loggerStub.error.firstCall.args[1].error).to.equal('Test error');
      expect(loggerStub.error.firstCall.args[1].stack).to.equal('Error stack trace');
    });
  });
  
  describe('handleQueueError', () => {
    it('should log queue errors', () => {
      const mockError = new Error('Queue error');
      
      worker.handleQueueError(mockError);
      
      expect(loggerStub.error.calledOnce).to.be.true;
      expect(loggerStub.error.firstCall.args[0]).to.equal('Queue error');
      expect(loggerStub.error.firstCall.args[1].error).to.equal('Queue error');
    });
  });
});
