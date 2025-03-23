'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jobs', {
      jobId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'userId'
        }
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending',
        allowNull: false
      },
      resumeFormat: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'text'
      },
      isJobDescriptionUrl: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      profilerModel: {
        type: Sequelize.STRING,
        allowNull: true
      },
      researcherModel: {
        type: Sequelize.STRING,
        allowNull: true
      },
      strategistModel: {
        type: Sequelize.STRING,
        allowNull: true
      },
      result: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('jobs');
  }
};
