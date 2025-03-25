// controllers/resumesController.js
const db = require('../models');
const logger = require('../utils/logger');
const { parseResumeContent } = require('../services/documentService');
const { uploadToStorage } = require('../services/storageService');

/**
 * Upload a new resume
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.uploadResume = async (req, res, next) => {
  try {
    // Get validated data from middleware
    const { title } = req.validatedBody;
    const file = req.file;

    if (!file) {
      return next({
        statusCode: 400,
        message: 'No file uploaded',
      });
    }

    // Get user ID from API key (set by auth middleware)
    const userId = req.user.userId;

    // Upload file to storage
    const fileUrl = await uploadToStorage(file.buffer, file.originalname, userId);

    // Extract text and structure from the resume
    const extractionResult = await parseResumeContent(file.buffer, file.mimetype);
    const { textContent, parsedData } = extractionResult;

    // Create resume in database
    const resume = await db.Resume.create({
      title,
      fileUrl,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      textContent,
      parsedData,
      userId
    });

    logger.info('Resume uploaded', { id: resume.id, userId });

    res.status(201).json({
      status: 'success',
      message: 'Resume uploaded successfully',
      data: {
        id: resume.id,
        title: resume.title,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        createdAt: resume.createdAt
      }
    });
  } catch (error) {
    logger.error('Error uploading resume', { error });
    
    // Database errors require special handling
    if (error.name === 'SequelizeValidationError') {
      return next({
        statusCode: 400,
        message: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    next({
      statusCode: 500,
      message: 'Failed to upload resume',
      details: { error: error.message }
    });
  }
};

/**
 * Get all resumes for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllResumes = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Find all resumes for user with pagination
    const { count, rows: resumes } = await db.Resume.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'title', 'fileName', 'fileType', 'fileSize', 'createdAt', 'updatedAt']
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: 'success',
      data: {
        resumes,
        pagination: {
          total: count,
          page,
          limit,
          totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Error getting resumes', { error, userId: req.user.userId });
    next({
      statusCode: 500,
      message: 'Failed to get resumes',
      details: { error: error.message }
    });
  }
};

/**
 * Get a specific resume
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getResume = async (req, res, next) => {
  try {
    const { id } = req.validatedParams;
    const userId = req.user.userId;

    // Find resume in database
    const resume = await db.Resume.findOne({
      where: {
        id,
        userId
      }
    });

    if (!resume) {
      return next({
        statusCode: 404,
        message: 'Resume not found',
        details: { id }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        id: resume.id,
        title: resume.title,
        fileName: resume.fileName,
        fileType: resume.fileType,
        fileSize: resume.fileSize,
        fileUrl: resume.fileUrl,
        textContent: resume.textContent,
        parsedData: resume.parsedData,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error getting resume', { error, id: req.params.id });
    next({
      statusCode: 500,
      message: 'Failed to get resume',
      details: { error: error.message }
    });
  }
};

/**
 * Delete a resume
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteResume = async (req, res, next) => {
  try {
    const { id } = req.validatedParams;
    const userId = req.user.userId;

    // Find resume in database
    const resume = await db.Resume.findOne({
      where: {
        id,
        userId
      }
    });

    if (!resume) {
      return next({
        statusCode: 404,
        message: 'Resume not found',
        details: { id }
      });
    }

    // TODO: Delete file from storage if needed
    // await deleteFromStorage(resume.fileUrl);

    // Delete resume
    await resume.destroy();

    logger.info('Resume deleted', { id, userId });

    res.status(200).json({
      status: 'success',
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting resume', { error, id: req.params.id });
    next({
      statusCode: 500,
      message: 'Failed to delete resume',
      details: { error: error.message }
    });
  }
};
