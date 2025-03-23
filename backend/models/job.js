// models/job.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Job extends Model {
    static associate(models) {
      // define association here
      Job.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  Job.init({
    jobId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending',
      allowNull: false
    },
    resumeFormat: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'text'
    },
    isJobDescriptionUrl: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    profilerModel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    researcherModel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    strategistModel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    result: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Job',
    tableName: 'jobs'
  });
  return Job;
};
