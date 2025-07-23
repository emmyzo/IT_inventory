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
    // Find the role name for the given roleId
    const role = roleId ? await Role.findByPk(roleId) : null;
    const roleName = role ? role.name : 'USER';
    if (roleName === 'USER') {
      // Check for existing user with same location and role 'USER'
      const existing = await User.findOne({ where: { location, roleId } });
      if (existing) {
        return res.status(400).json({ error: 'Location already in use by another user.' });
      }
    }
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

exports.transferUserDashboard = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) return res.status(400).json({ error: 'Missing user IDs' });
    if (fromUserId === toUserId) return res.status(400).json({ error: 'Cannot transfer to the same user' });
    if (!req.session.user || !['SUPER_ADMIN', 'ADMIN'].includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const fromUser = await User.findByPk(fromUserId);
    const toUser = await User.findByPk(toUserId);
    if (!fromUser || !toUser) return res.status(404).json({ error: 'User not found' });
    // Swap locations
    const fromLocation = fromUser.location;
    const toLocation = toUser.location;
    fromUser.location = toLocation;
    toUser.location = fromLocation;
    await fromUser.save();
    await toUser.save();
    // Find all items referencing either user in userEmail, userName, itSpoc, location, or multipleUsers
    const { Op } = require('sequelize');
    const allItems = await InventoryItem.findAll({
      where: {
        [Op.or]: [
          { userEmail: fromUser.email },
          { userEmail: toUser.email },
          { userName: fromUser.username },
          { userName: toUser.username },
          { itSpoc: fromUser.username },
          { itSpoc: toUser.username },
          { location: fromLocation },
          { location: toLocation },
          { multipleUsers: { [Op.not]: null } }
        ]
      }
    });
    // Swap all relevant fields for each item
    for (const item of allItems) {
      // Helper: swap value if matches fromUser <-> toUser
      const swapValue = (val, a, b) => val === a ? b : val === b ? a : val;
      // userEmail
      item.userEmail = swapValue(item.userEmail, fromUser.email, toUser.email);
      // Do NOT update userName here; leave as is
      // location: after swap, set to the new owner's location
      if (item.userEmail === fromUser.email) {
        item.location = fromUser.location;
        item.itSpoc = fromUser.username;
      } else if (item.userEmail === toUser.email) {
        item.location = toUser.location;
        item.itSpoc = toUser.username;
      }
      // multipleUsers (array of emails)
      if (item.multipleUsers && Array.isArray(item.multipleUsers)) {
        item.multipleUsers = item.multipleUsers.map(u => swapValue(u, fromUser.email, toUser.email));
      }
      await item.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!userId || !newPassword) return res.status(400).json({ error: 'Missing user ID or new password' });
    const targetUser = await User.findByPk(userId, { include: [Role] });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    const targetRole = targetUser.Role ? targetUser.Role.name : 'USER';
    const currentRole = req.session.user && req.session.user.role;
    // Permission logic
    if (currentRole === 'ADMIN' && targetRole !== 'USER') {
      return res.status(403).json({ error: 'Admins can only change User passwords' });
    }
    if (currentRole === 'SUPER_ADMIN' && targetRole === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Cannot change another Super Admin password' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    targetUser.password = hash;
    await targetUser.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.replaceUser = async (req, res) => {
  /*
    Expects body: {
      oldUserId: ID of user to delete,
      name, email, password, roleId (for new user)
    }
  */
  const { oldUserId, name, email, password, roleId } = req.body;
  if (!oldUserId || !name || !email || !password || !roleId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // 1. Find old user
    const oldUser = await User.findByPk(oldUserId);
    if (!oldUser) return res.status(404).json({ error: 'Old user not found' });
    // 2. Check if email already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'A user with this email already exists' });
    // 3. Create new user with old user's location
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username: name,
      email,
      password: hash,
      location: oldUser.location,
      roleId
    });
    // 4. Transfer all inventory/dashboard/location data
    const { Op } = require('sequelize');
    const allItems = await InventoryItem.findAll({
      where: {
        [Op.or]: [
          { userEmail: oldUser.email },
          { userName: oldUser.username },
          { itSpoc: oldUser.username },
          { location: oldUser.location },
          { multipleUsers: { [Op.like]: `%${oldUser.email}%` } }
        ]
      }
    });
    for (const item of allItems) {
      // Update all references to old user
      if (item.userEmail === oldUser.email) item.userEmail = newUser.email;
      // Do NOT update userName during transfer
      if (item.itSpoc === oldUser.username) item.itSpoc = newUser.username;
      if (item.location === oldUser.location) item.location = newUser.location;
      if (item.multipleUsers && Array.isArray(item.multipleUsers)) {
        item.multipleUsers = item.multipleUsers.map(u => u === oldUser.email ? newUser.email : u);
      }
      await item.save();
    }
    // Ensure all inventory items for the new user have correct itSpoc
    const userItems = await InventoryItem.findAll({ where: { userEmail: newUser.email } });
    for (const item of userItems) {
      item.itSpoc = newUser.username;
      await item.save();
    }
    // 5. Delete old user
    await oldUser.destroy();
    // 6. Return new user info
    const userObj = newUser.toJSON();
    delete userObj.password;
    res.json({ success: true, newUser: userObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 