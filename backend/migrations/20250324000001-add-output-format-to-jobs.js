'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('jobs', 'outputFormat', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'text'
    });
    
    await queryInterface.addColumn('jobs', 'resultMimeType', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'text/plain'
    });
    
    await queryInterface.addColumn('jobs', 'preserveOriginalFormat', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('jobs', 'outputFormat');
    await queryInterface.removeColumn('jobs', 'resultMimeType');
    await queryInterface.removeColumn('jobs', 'preserveOriginalFormat');
  }
};
