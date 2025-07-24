const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');
const InventoryItem = require('./inventory-item');

const UserInventory = sequelize.define('UserInventory', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
  inventoryItemId: { type: DataTypes.INTEGER, references: { model: InventoryItem, key: 'id' } },
}, {
  timestamps: true,
  tableName: 'userinventories',
});

UserInventory.belongsTo(User, { foreignKey: 'userId' });
UserInventory.belongsTo(InventoryItem, { foreignKey: 'inventoryItemId' });

module.exports = UserInventory; 