module.exports = {
  up: async (queryInterface, Sequelize) => {
    const bcrypt = require('bcryptjs');
    // Get SUPER_ADMIN role id
    const [results] = await queryInterface.sequelize.query(
      "SELECT id FROM Roles WHERE name = 'SUPER_ADMIN' LIMIT 1;"
    );
    const superAdminRoleId = results[0] ? results[0].id : null;
    if (!superAdminRoleId) throw new Error('SUPER_ADMIN role not found');
    const hashedPassword = await bcrypt.hash('Emmyzo@24!', 10);
    await queryInterface.bulkInsert('Users', [
      {
        username: 'Emmanuel Nwogu',
        email: 'emmanuel.nwogu@olam-agri.com',
        password: hashedPassword,
        location: 'APAPA',
        roleId: superAdminRoleId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', { username: 'Emmanuel Nwogu' }, {});
  },
}; 