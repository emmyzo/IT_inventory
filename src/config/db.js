const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('it_inventory', 'root', 'Emmyzo@24!', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize; 