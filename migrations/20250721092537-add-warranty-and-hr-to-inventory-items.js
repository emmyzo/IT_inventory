'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('InventoryItems', 'warranty', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('InventoryItems', 'hr', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('InventoryItems', 'warranty');
    await queryInterface.removeColumn('InventoryItems', 'hr');
  }
};
