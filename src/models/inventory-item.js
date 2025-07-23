const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InventoryItem = sequelize.define('InventoryItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  itSpoc: { type: DataTypes.STRING, allowNull: false },
  userType: { type: DataTypes.ENUM('Single', 'Multiple'), allowNull: false },
  userName: { type: DataTypes.STRING, allowNull: true },
  userEmail: { type: DataTypes.STRING, allowNull: true },
  multipleUsers: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
  deviceType: { type: DataTypes.ENUM('Laptop','Desktop','Monitor','Printer'), allowNull: false },
  deviceBrand: { type: DataTypes.STRING, allowNull: true },
  deviceModel: { type: DataTypes.STRING, allowNull: true },
  hostname: { type: DataTypes.STRING, allowNull: true },
  windows: { type: DataTypes.ENUM('10','11'), allowNull: true },
  windowsType: { type: DataTypes.ENUM('Windows Home','Windows Pro','Windows Enterprise','Windows Education','Windows Pro for Workstations','Windows Server 2016','Windows Server 2019','Windows Server 2022'), allowNull: true },
  sapUser: { type: DataTypes.ENUM('Yes','No'), allowNull: true },
  microsoftOffice: { type: DataTypes.ENUM('Yes','No'), allowNull: true },
  serialNumber: { type: DataTypes.STRING, allowNull: true },
  emailId: { type: DataTypes.STRING, allowNull: true },
  ram: { type: DataTypes.STRING, allowNull: true },
  rom: { type: DataTypes.STRING, allowNull: true },
  hardDriveType: { type: DataTypes.ENUM('HDD','SSD'), allowNull: true },
  department: { type: DataTypes.STRING, allowNull: true },
  location: { type: DataTypes.STRING, allowNull: true },
  zscaler: { type: DataTypes.ENUM('Yes','No'), allowNull: true },
  trellix: { type: DataTypes.ENUM('Yes','No'), allowNull: true },
  sccm: { type: DataTypes.ENUM('Yes','No'), allowNull: true },
  ivanti: { type: DataTypes.ENUM('Yes','No'), allowNull: true },
  bitLocker: { type: DataTypes.ENUM('Yes','No'), allowNull: true },
  secureLogin: { type: DataTypes.ENUM('Yes','No'), allowNull: true },
  joinedToOlamDomain: { type: DataTypes.ENUM('Yes','No'), allowNull: true },
  po: { type: DataTypes.STRING, allowNull: true },
  purchaseDate: { type: DataTypes.DATEONLY, allowNull: true },
  invoiceNumber: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  warranty: { type: DataTypes.STRING, allowNull: true },
  hr: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'spares', 'deleted', 'scrap'), allowNull: false, defaultValue: 'active' },
}, {
  timestamps: true,
  tableName: 'InventoryItems',
  hooks: {
    beforeCreate: (instance) => {
      // Convert empty strings to null for ENUM fields
      const enumFields = ['sapUser', 'microsoftOffice', 'zscaler', 'trellix', 'sccm', 'ivanti', 'bitLocker', 'secureLogin', 'joinedToOlamDomain'];
      enumFields.forEach(field => {
        if (instance[field] === '' || instance[field] === null || instance[field] === undefined) {
          instance[field] = null;
        }
      });
      // Trim whitespace from itSpoc
      if (typeof instance.itSpoc === 'string') {
        instance.itSpoc = instance.itSpoc.trim();
      }
    },
    beforeUpdate: (instance) => {
      // Convert empty strings to null for ENUM fields
      const enumFields = ['sapUser', 'microsoftOffice', 'zscaler', 'trellix', 'sccm', 'ivanti', 'bitLocker', 'secureLogin', 'joinedToOlamDomain'];
      enumFields.forEach(field => {
        if (instance[field] === '' || instance[field] === null || instance[field] === undefined) {
          instance[field] = null;
        }
      });
      // Trim whitespace from itSpoc
      if (typeof instance.itSpoc === 'string') {
        instance.itSpoc = instance.itSpoc.trim();
      }
    }
  }
});

module.exports = InventoryItem; 