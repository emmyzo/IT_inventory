// Migration to add 'NA' to all relevant ENUM columns in InventoryItems
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('InventoryItems', 'userType', {
      type: Sequelize.ENUM('Single', 'Multiple', 'NA'),
      allowNull: false,
    });
    await queryInterface.changeColumn('InventoryItems', 'deviceType', {
      type: Sequelize.ENUM('Laptop', 'Desktop', 'Monitor', 'Printer', 'NA'),
      allowNull: false,
    });
    await queryInterface.changeColumn('InventoryItems', 'windows', {
      type: Sequelize.ENUM('10', '11', 'NA'),
      allowNull: true,
    });
    await queryInterface.changeColumn('InventoryItems', 'windowsType', {
      type: Sequelize.ENUM('Windows Home', 'Windows Pro', 'Windows Enterprise', 'Windows Education', 'Windows Pro for Workstations', 'Windows Server 2016', 'Windows Server 2019', 'Windows Server 2022', 'NA'),
      allowNull: true,
    });
    await queryInterface.changeColumn('InventoryItems', 'sapUser', {
      type: Sequelize.ENUM('Yes', 'No', 'NA'),
      allowNull: true,
    });
    await queryInterface.changeColumn('InventoryItems', 'microsoftOffice', {
      type: Sequelize.ENUM('Yes', 'No', 'NA'),
      allowNull: true,
    });
    await queryInterface.changeColumn('InventoryItems', 'hardDriveType', {
      type: Sequelize.ENUM('HDD', 'SSD', 'NA'),
      allowNull: true,
    });
    await queryInterface.changeColumn('InventoryItems', 'zscaler', {
      type: Sequelize.ENUM('Yes', 'No', 'NA'),
      allowNull: true,
    });
    await queryInterface.changeColumn('InventoryItems', 'trellix', {
      type: Sequelize.ENUM('Yes', 'No', 'NA'),
      allowNull: true,
    });
    await queryInterface.changeColumn('InventoryItems', 'sccm', {
      type: Sequelize.ENUM('Yes', 'No', 'NA'),
      allowNull: true,
    });
    await queryInterface.changeColumn('InventoryItems', 'ivanti', {
      type: Sequelize.ENUM('Yes', 'No', 'NA'),
      allowNull: true,
    });
    await queryInterface.changeColumn('InventoryItems', 'bitLocker', {
      type: Sequelize.ENUM('Yes', 'No', 'NA'),
      allowNull: true,
    });
    await queryInterface.changeColumn('InventoryItems', 'secureLogin', {
      type: Sequelize.ENUM('Yes', 'No', 'NA'),
      allowNull: true,
    });
    await queryInterface.changeColumn('InventoryItems', 'joinedToOlamDomain', {
      type: Sequelize.ENUM('Yes', 'No', 'NA'),
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    // Down migration would require removing 'NA' from each ENUM, which is destructive and not recommended
  },
}; 