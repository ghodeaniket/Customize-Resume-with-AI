// services/storageService.js
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Upload a file to storage
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} originalName - The original file name
 * @param {string} userId - The user ID
 * @returns {string} The file URL
 */
exports.uploadToStorage = async (fileBuffer, originalName, userId) => {
  try {
    logger.info('Uploading file to storage', { originalName });
    
    // In a real implementation, this would upload to cloud storage like S3 or GCS
    // For now, we'll use local file system as a mock
    
    // Create a unique file name
    const fileExtension = path.extname(originalName);
    const randomId = crypto.randomBytes(16).toString('hex');
    const fileName = `${userId}-${Date.now()}-${randomId}${fileExtension}`;
    
    // Define storage directory and ensure it exists
    const storageDir = path.join(__dirname, '..', 'uploads');
    await fs.mkdir(storageDir, { recursive: true });
    
    // Write file to disk
    const filePath = path.join(storageDir, fileName);
    await fs.writeFile(filePath, fileBuffer);
    
    // In production, this would return a URL to the cloud storage
    // For now, we'll return a mock URL
    const fileUrl = `/api/v1/files/${fileName}`;
    
    logger.info('File uploaded successfully', { fileName, fileUrl });
    return fileUrl;
  } catch (error) {
    logger.error('Error uploading file', { error });
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Delete a file from storage
 * @param {string} fileUrl - The file URL
 * @returns {boolean} Success status
 */
exports.deleteFromStorage = async (fileUrl) => {
  try {
    logger.info('Deleting file from storage', { fileUrl });
    
    // In a real implementation, this would delete from cloud storage
    // For now, we'll use local file system as a mock
    
    // Extract file name from URL
    const fileName = path.basename(fileUrl);
    
    // Define file path
    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      logger.warn('File not found for deletion', { fileUrl });
      return false;
    }
    
    // Delete file
    await fs.unlink(filePath);
    
    logger.info('File deleted successfully', { fileUrl });
    return true;
  } catch (error) {
    logger.error('Error deleting file', { error });
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};
