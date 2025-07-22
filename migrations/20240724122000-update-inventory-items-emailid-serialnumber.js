// Migration to add emailId and rename systemSerial to serialNumber
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('InventoryItems', 'emailId', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.renameColumn('InventoryItems', 'systemSerial', 'serialNumber');
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('InventoryItems', 'serialNumber', 'systemSerial');
    await queryInterface.removeColumn('InventoryItems', 'emailId');
  }
}; 