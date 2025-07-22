module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    await queryInterface.bulkInsert('Roles', [
      { name: 'SUPER_ADMIN', createdAt: now, updatedAt: now },
      { name: 'Admin', createdAt: now, updatedAt: now },
      { name: 'User', createdAt: now, updatedAt: now },
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Roles', null, {});
  },
}; 