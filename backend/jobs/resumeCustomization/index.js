// jobs/resumeCustomization/index.js
const processResumeCustomizationJob = require('./processor');
const { parseResumeContent } = require('./resumeParser');
const { fetchJobDescriptionContent } = require('./jobDescriptionFetcher');
const { processAISteps } = require('./aiProcessor');
const { formatOutput } = require('./outputFormatter');
const { updateJobStatus, getJobStatus } = require('./jobUpdater');

module.exports = {
  processResumeCustomizationJob,
  parseResumeContent,
  fetchJobDescriptionContent,
  processAISteps,
  formatOutput,
  updateJobStatus,
  getJobStatus
};
