'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('InventoryItems', 'deviceBrand', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('InventoryItems', 'deviceModel', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('InventoryItems', 'hostname', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('InventoryItems', 'deviceBrand');
    await queryInterface.removeColumn('InventoryItems', 'deviceModel');
    await queryInterface.removeColumn('InventoryItems', 'hostname');
  }
}; 