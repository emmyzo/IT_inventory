const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { User } = require('../models');

// User management
router.get('/admin/users', requireAuth, requireRole('SUPER_ADMIN'), adminController.getAllUsers);
router.post('/admin/users', requireAuth, requireRole('SUPER_ADMIN'), adminController.createUser);
router.put('/admin/users/:id', requireAuth, requireRole('SUPER_ADMIN'), adminController.updateUser);
router.delete('/admin/users/:id', requireAuth, requireRole('SUPER_ADMIN'), adminController.deleteUser);

// Role management
router.get('/admin/roles', requireAuth, requireRole('SUPER_ADMIN'), adminController.getAllRoles);
router.post('/admin/roles', requireAuth, requireRole('SUPER_ADMIN'), adminController.createRole);
router.put('/admin/roles/:id', requireAuth, requireRole('SUPER_ADMIN'), adminController.updateRole);
router.delete('/admin/roles/:id', requireAuth, requireRole('SUPER_ADMIN'), adminController.deleteRole);

// Inventory status pages for admin
router.get('/admin/active', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), adminController.getAllActiveInventory);
router.get('/admin/spares', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), adminController.getAllSparesInventory);
router.get('/admin/scrap', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), adminController.getAllScrapInventory);
router.get('/admin/deleted-items', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), adminController.getAllDeletedInventory);

// Add route for admin to view any user's dashboard
router.get('/admin/user-dashboard/:userId', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  const user = await User.findByPk(req.params.userId);
  if (!user) return res.status(404).send('User not found');
  // Pass a flag to enable admin rights in the dashboard view
  res.render('user_dashboard', { user, isAdmin: true, activeTab: 'dashboard' });
});

module.exports = router; 