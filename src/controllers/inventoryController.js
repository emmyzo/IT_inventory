const { InventoryItem, User, Role } = require('../models');

// Get all inventory items (SUPER_ADMIN/Admin: all, User: only their own)
exports.getAllInventory = async (req, res) => {
  try {
    let items;
    if (["SUPER_ADMIN", "Admin"].includes(req.user.role)) {
      // Aggregate all inventory items as user dashboards do (real-time, all users)
      items = await InventoryItem.findAll({});
    } else {
      // User: show items where user is owner or in multipleUsers
      items = await InventoryItem.findAll({
        where: {
          $or: [
            { userEmail: req.user.email },
            { multipleUsers: { $like: `%${req.user.email}%` } },
          ],
        },
      });
    }
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get inventory item by id (role/ownership check)
exports.getInventoryById = async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (
      ['SUPER_ADMIN', 'Admin'].includes(req.user.role) ||
      item.userEmail === req.user.email ||
      (item.multipleUsers && JSON.stringify(item.multipleUsers).includes(req.user.email))
    ) {
      return res.json(item);
    }
    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Create inventory item (anyone can create, but user field is set)
exports.createInventory = async (req, res) => {
  try {
    let data = { ...req.body };
    if (data.multipleUsers && typeof data.multipleUsers === 'string') {
      try { data.multipleUsers = JSON.parse(data.multipleUsers); } catch (e) { data.multipleUsers = null; }
    }
    // If user is not admin, set userEmail to their own
    if (!['SUPER_ADMIN', 'Admin'].includes(req.user.role)) {
      data.userEmail = req.user.email;
    }
    // In createInventory and updateInventory, for 'Multiple' userType, only accept the first user in multipleUsers array
    if (data.userType === 'Multiple' && Array.isArray(data.multipleUsers)) {
      if (data.multipleUsers.length > 1) {
        data.multipleUsers = [data.multipleUsers[0]];
      }
    }
    // Sanitize purchaseDate
    if (data.purchaseDate) {
      // Accept only valid YYYY-MM-DD format
      const d = new Date(data.purchaseDate);
      if (isNaN(d.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(data.purchaseDate)) {
        data.purchaseDate = null;
      }
    }
    const item = await InventoryItem.create(data);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update inventory item (role/ownership check)
exports.updateInventory = async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (
      ['SUPER_ADMIN', 'Admin'].includes(req.user.role) ||
      item.userEmail === req.user.email ||
      (item.multipleUsers && JSON.stringify(item.multipleUsers).includes(req.user.email))
    ) {
      let data = { ...req.body };
      if (data.multipleUsers && typeof data.multipleUsers === 'string') {
        try { data.multipleUsers = JSON.parse(data.multipleUsers); } catch (e) { data.multipleUsers = null; }
      }
      // Handle userType switch between Single and Multiple
      if (data.userType === 'Single') {
        // If switching to Single, keep userName/userEmail, clear multipleUsers
        if (typeof data.userName === 'undefined' && item.userName) data.userName = item.userName;
        if (typeof data.userEmail === 'undefined' && item.userEmail) data.userEmail = item.userEmail;
        data.multipleUsers = null;
      } else if (data.userType === 'Multiple') {
        // If switching to Multiple, collect all multiUserName/multiUserEmail fields
        const multiUsers = [];
        Object.keys(data).forEach(key => {
          if (key.startsWith('multiUserName')) {
            const idx = key.replace('multiUserName', '');
            const name = data[key];
            const email = data['multiUserEmail' + idx];
            if (name && email) multiUsers.push({ name, email });
            delete data[key];
            delete data['multiUserEmail' + idx];
          }
        });
        data.multipleUsers = multiUsers.length ? multiUsers : null;
        data.userName = null;
        data.userEmail = null;
      }
      // In updateInventory, for 'Multiple' userType, only accept the first user in multipleUsers array
      if (data.userType === 'Multiple' && Array.isArray(data.multipleUsers)) {
        if (data.multipleUsers.length > 1) {
          data.multipleUsers = [data.multipleUsers[0]];
        }
      }
      // Prevent updates to deviceType, deviceBrand, deviceModel, systemSerial
      delete data.deviceType;
      delete data.deviceBrand;
      delete data.deviceModel;
      delete data.systemSerial;
      // Prevent updates to PO and invoiceNumber for all users
      delete data.po;
      delete data.invoiceNumber;
      // Prevent updates to itSpoc and location
      delete data.itSpoc;
      delete data.location;
      // Sanitize purchaseDate
      if (data.purchaseDate) {
        // Accept only valid YYYY-MM-DD format
        const d = new Date(data.purchaseDate);
        if (isNaN(d.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(data.purchaseDate)) {
          data.purchaseDate = null;
        }
      }
      // Only update description if status is being set to 'spares', 'scrap', or moving from 'deleted' to 'scrap'
      if ((data.status === 'spares' || data.status === 'scrap') && data.description) {
        item.description = data.description;
      }
      // If restoring (status = 'active'), clear description
      if (data.status === 'active') {
        item.description = null;
      }
      await item.update(data);
      return res.json(item);
    }
    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Restore inventory item (change status from spares to active)
exports.restoreInventory = async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (
      ['SUPER_ADMIN', 'Admin'].includes(req.user.role) ||
      item.userEmail === req.user.email ||
      (item.multipleUsers && JSON.stringify(item.multipleUsers).includes(req.user.email))
    ) {
      await item.update({ status: 'active', description: null });
      return res.json(item);
    }
    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Transfer inventory item
exports.transferInventory = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    // Permission check
    if (item.userEmail !== req.user.email && !['SUPER_ADMIN', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const targetUser = await User.findByPk(targetUserId, { include: [Role] });
    if (!targetUser || ['SUPER_ADMIN', 'ADMIN'].includes(targetUser.Role.name)) {
      return res.status(400).json({ error: 'Invalid target user' });
    }

    await item.update({
      userEmail: targetUser.email,
      itSpoc: targetUser.username,
      // Reset user-specific fields
      userName: targetUser.username,
      multipleUsers: null,
      userType: 'Single'
    });

    // Real-time notification
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const targetSocketId = connectedUsers[targetUser.id];
    if (targetSocketId) {
      io.to(targetSocketId).emit('transfer_notification', {
        message: `You have received an inventory item from ${req.user.username}.`,
        item: item
      });
    }

    res.json({ success: true, item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete inventory item (role/ownership check)
exports.deleteInventory = async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (
      ['SUPER_ADMIN', 'Admin'].includes(req.user.role) ||
      item.userEmail === req.user.email ||
      (item.multipleUsers && JSON.stringify(item.multipleUsers).includes(req.user.email))
    ) {
      let updateData = { status: 'deleted' };
      if (req.body && req.body.description) {
        updateData.description = req.body.description;
      }
      await item.update(updateData);
      return res.json({ success: true, deleted: true });
    }
    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all unique IT SPOC names
exports.getUniqueItSpocs = async (req, res) => {
  try {
    const itSpocs = await InventoryItem.findAll({
      attributes: [
        [InventoryItem.sequelize.fn('DISTINCT', InventoryItem.sequelize.col('itSpoc')), 'itSpoc']
      ],
      raw: true
    });
    const names = itSpocs.map(row => row.itSpoc).filter(Boolean);
    res.json(names);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get inventory items filtered by IT SPOC name and status
exports.getInventoryByItSpoc = async (req, res) => {
  try {
    const { itSpoc, status } = req.query;
    if (!itSpoc) return res.status(400).json({ error: 'Missing itSpoc parameter' });
    const where = { itSpoc };
    if (status) where.status = status;
    const items = await InventoryItem.findAll({ where });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}; 