const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('it_inventory', 'root', 'Emmyzo@24!', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize; 