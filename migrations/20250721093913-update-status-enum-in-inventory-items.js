'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, update existing 'inactive' values to 'spares'
    await queryInterface.sequelize.query("UPDATE `InventoryItems` SET `status` = 'spares' WHERE `status` = 'inactive'");
    // Then, alter the column to change the ENUM definition
    await queryInterface.changeColumn('InventoryItems', 'status', {
      type: Sequelize.ENUM('active', 'spares', 'deleted'),
      allowNull: false,
      defaultValue: 'active',
    });
  },
  async down(queryInterface, Sequelize) {
    // Revert 'spares' back to 'inactive'
    await queryInterface.sequelize.query("UPDATE `InventoryItems` SET `status` = 'inactive' WHERE `status` = 'spares'");
    // Change the ENUM definition back
    await queryInterface.changeColumn('InventoryItems', 'status', {
      type: Sequelize.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    });
  }
};
