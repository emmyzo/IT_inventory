const { User, Role, InventoryItem } = require('../models');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    // Only render the view, JS will fetch users via /api/users-list
    res.render('users', { user: req.session.user, activeTab: 'users' });
  } catch (err) {
    res.status(500).render('users', { user: req.session.user, activeTab: 'users', error: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, email, password, location, roleId } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hash, location, roleId });
    const userObj = user.toJSON();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, location, roleId } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    if (username) user.username = username;
    if (email) user.email = email;
    if (location) user.location = location;
    if (roleId) user.roleId = roleId;
    await user.save();
    const userObj = user.toJSON();
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name } = req.body;
    const role = await Role.create({ name });
    res.status(201).json(role);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const role = await Role.findByPk(id);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    role.name = name;
    await role.save();
    res.json(role);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    await role.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllActiveInventory = async (req, res) => {
  try {
    const items = await InventoryItem.findAll({ where: { status: 'active' } });
    res.render('admin_inventory_status', { user: req.session.user, activeTab: 'active', items });
  } catch (err) {
    res.status(500).render('admin_inventory_status', { user: req.session.user, activeTab: 'active', items: [], error: 'Server error' });
  }
};
exports.getAllSparesInventory = async (req, res) => {
  try {
    const items = await InventoryItem.findAll({ where: { status: 'spares' } });
    res.render('admin_inventory_status', { user: req.session.user, activeTab: 'spares', items });
  } catch (err) {
    res.status(500).render('admin_inventory_status', { user: req.session.user, activeTab: 'spares', items: [], error: 'Server error' });
  }
};
exports.getAllScrapInventory = async (req, res) => {
  try {
    const items = await InventoryItem.findAll({ where: { status: 'scrap' } });
    res.render('admin_inventory_status', { user: req.session.user, activeTab: 'scrap', items });
  } catch (err) {
    res.status(500).render('admin_inventory_status', { user: req.session.user, activeTab: 'scrap', items: [], error: 'Server error' });
  }
};
exports.getAllDeletedInventory = async (req, res) => {
  try {
    const items = await InventoryItem.findAll({ where: { status: 'deleted' } });
    res.render('admin_inventory_status', { user: req.session.user, activeTab: 'deleted-items', items });
  } catch (err) {
    res.status(500).render('admin_inventory_status', { user: req.session.user, activeTab: 'deleted-items', items: [], error: 'Server error' });
  }
}; 