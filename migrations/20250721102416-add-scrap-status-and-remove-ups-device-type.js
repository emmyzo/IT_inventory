'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove 'UPS' from deviceType and add 'scrap' to status
    await queryInterface.changeColumn('InventoryItems', 'deviceType', {
      type: Sequelize.ENUM('Laptop', 'Desktop', 'Monitor', 'Printer'),
      allowNull: false,
    });
    await queryInterface.changeColumn('InventoryItems', 'status', {
      type: Sequelize.ENUM('active', 'spares', 'deleted', 'scrap'),
      allowNull: false,
      defaultValue: 'active',
    });
  },
  async down(queryInterface, Sequelize) {
    // Revert deviceType and status enums
    await queryInterface.changeColumn('InventoryItems', 'deviceType', {
      type: Sequelize.ENUM('Laptop', 'Desktop', 'Monitor', 'UPS', 'Printer'),
      allowNull: false,
    });
    await queryInterface.changeColumn('InventoryItems', 'status', {
      type: Sequelize.ENUM('active', 'spares', 'deleted'),
      allowNull: false,
      defaultValue: 'active',
    });
  }
};
