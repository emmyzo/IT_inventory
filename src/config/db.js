const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('railway', 'root', 'mRUhTeUuCLjxUauTUSFyguRNEZhokwE', {
  host: 'mysql.railway.internal',
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize; 