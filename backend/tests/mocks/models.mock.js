// tests/mocks/models.mock.js
/**
 * Mock database models for testing
 */
const models = {
  Job: {
    create: async (data) => {
      return {
        ...data,
        id: 'mock-db-id-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    },
    update: async (data, options) => {
      return [1]; // Number of affected rows
    },
    findOne: async (options) => {
      return {
        jobId: options.where.jobId,
        userId: options.where.userId || 'mock-user-id',
        status: 'completed',
        result: 'Customized resume content',
        createdAt: new Date(),
        completedAt: new Date(),
        updatedAt: new Date()
      };
    },
    findAndCountAll: async (options) => {
      return {
        count: 1,
        rows: [
          {
            jobId: 'mock-job-123',
            userId: options.where.userId,
            status: 'completed',
            result: 'Customized resume content',
            createdAt: new Date(),
            completedAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };
    }
  },
  User: {
    findOne: async (options) => {
      return {
        id: options.where.id || 'mock-user-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }
};

module.exports = models;
