const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Role = require('./role');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.STRING, allowNull: true },
  roleId: { type: DataTypes.INTEGER, references: { model: Role, key: 'id' } },
}, {
  timestamps: true,
  tableName: 'Users',
});

User.belongsTo(Role, { foreignKey: 'roleId' });

module.exports = User; 