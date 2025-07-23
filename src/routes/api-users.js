const express = require('express');
const router = express.Router();
const apiUsersController = require('../controllers/apiUsersController');
const userDashboardInventoryController = require('../controllers/userDashboardInventoryController');
const { requireAuth } = require('../middleware/auth');
const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');

router.get('/me', requireAuth, apiUsersController.getCurrentUser);

// Add endpoint to get all users for admin users page
router.get('/users-list', async (req, res) => {
  try {
    const users = await User.findAll({ include: [Role], attributes: { exclude: ['password'] } });
    const InventoryItem = require('../models/inventory-item');
    // For each user, get their active inventory item(s) and use the location from the inventory
    const formatted = await Promise.all(users.map(async u => {
      // Find active inventory item(s) assigned to this user
      const inv = await InventoryItem.findOne({ where: { userEmail: u.email, status: 'active' } });
      return {
        id: u.id,
        name: u.username,
        email: u.email,
        role: u.Role ? u.Role.name : '',
        location: inv ? inv.location : (u.location || ''),
        sheet: '', // Placeholder, update if you have sheet info
      };
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add user (for admin dashboard)
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, location, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    // Check if user already exists (by email)
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }
    // Find roleId
    const roleObj = await Role.findOne({ where: { name: role.toUpperCase() } });
    if (!roleObj) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: name,
      email,
      password: hash,
      location,
      roleId: roleObj.id,
    });
    const userObj = user.toJSON();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete user (for admin dashboard)
router.delete('/users/:id', async (req, res) => {
  try {
    // Only allow SUPER_ADMIN or ADMIN
    if (!req.session || !req.session.user || !['SUPER_ADMIN', 'Admin'].includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// User dashboard inventory list (user-specific)
router.get('/user-dashboard/inventory', requireAuth, userDashboardInventoryController.getUserInventory);
router.get('/user-dashboard/deleted-items', requireAuth, userDashboardInventoryController.getDeletedItems);

// User list for transfer (excluding admins and current user)
router.get('/users/transfer-list', requireAuth, apiUsersController.getTransferableUsers);

module.exports = router; 