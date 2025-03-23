'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('jobs', 'formattedResult', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('jobs', 'resultFormat', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('jobs', 'formattedResult');
    await queryInterface.removeColumn('jobs', 'resultFormat');
  }
};
