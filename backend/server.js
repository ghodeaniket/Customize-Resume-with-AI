// server.js
const app = require('./app');
const logger = require('./utils/logger');

// Set port
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
