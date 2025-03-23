'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [{
      userId: uuidv4(),
      email: 'demo@example.com',
      name: 'Demo User',
      apiKey: 'demo-api-key-' + uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: 'demo@example.com' }, {});
  }
};
