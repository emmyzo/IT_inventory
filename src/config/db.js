const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('railway', 'root', 'mRUhIeUuCLjxUauTUSFyguyRNEZhokwE', {
  host: 'yamabiko.proxy.rlwy.net',
  port: 57048,
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize; 