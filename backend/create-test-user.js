// create-test-user.js
require('dotenv').config();
const { sequelize, User } = require('./models');

async function createTestUser() {
  try {
    // Create test user
    const [user, created] = await User.findOrCreate({
      where: { email: 'test@example.com' },
      defaults: {
        name: 'Test User',
        apiKey: 'test-api-key',
        role: 'user'
      }
    });
    
    if (created) {
      console.log('Test user created successfully with API key: test-api-key');
    } else {
      // Update API key for existing user
      user.apiKey = 'test-api-key';
      await user.save();
      console.log('Test user updated with API key: test-api-key');
    }
    
    // Close database connection
    await sequelize.close();
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
