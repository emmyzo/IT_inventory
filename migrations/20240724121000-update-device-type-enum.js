// Migration to update ENUM for deviceType and existing data (MySQL version)
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Update existing records from 'Screen' to 'Monitor'
    await queryInterface.sequelize.query("UPDATE InventoryItems SET deviceType = 'Monitor' WHERE deviceType = 'Screen'");

    // 2. Change ENUM type: remove 'Screen', add 'Monitor' (MySQL)
    // MySQL requires recreating the ENUM type via MODIFY
    await queryInterface.sequelize.query(`
      ALTER TABLE InventoryItems 
      MODIFY COLUMN deviceType ENUM('Laptop','Desktop','Monitor','UPS','Printer') NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert ENUM type and data if needed
    await queryInterface.sequelize.query("UPDATE InventoryItems SET deviceType = 'Screen' WHERE deviceType = 'Monitor'");
    await queryInterface.sequelize.query(`
      ALTER TABLE InventoryItems 
      MODIFY COLUMN deviceType ENUM('Laptop','Desktop','Screen','UPS','Printer') NOT NULL;
    `);
  }
}; 