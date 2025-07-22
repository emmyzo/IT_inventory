module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('InventoryItems', 'status', {
      type: Sequelize.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    });
    await queryInterface.addColumn('InventoryItems', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('InventoryItems', 'status');
    await queryInterface.removeColumn('InventoryItems', 'description');
  }
}; 