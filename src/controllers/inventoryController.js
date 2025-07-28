const { InventoryItem, User, Role } = require('../models');
const { Op } = require('sequelize');

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
    
    // Add detailed logging
    console.log('=== CREATE INVENTORY DEBUG ===');
    console.log('Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('Processed data:', JSON.stringify(data, null, 2));
    console.log('Windows value:', data.windows);
    console.log('Device type value:', data.deviceType);
    console.log('User type value:', data.userType);
    console.log('=============================');
    
    // Backend validation for emailId
    if (data.emailId && !/^.+@olam-agri\.com$/.test(data.emailId.trim())) {
      return res.status(400).json({ error: 'Email ID must end with @olam-agri.com' });
    }
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
    
    console.log('Final data before create:', JSON.stringify(data, null, 2));
    
    const item = await InventoryItem.create(data);
    res.status(201).json(item);
  } catch (err) {
    console.log('CREATE ERROR:', err.message);
    console.log('CREATE ERROR STACK:', err.stack);
    res.status(400).json({ error: err.message });
  }
};

// Temporary in-memory debug log for update attempts
const updateDebugLog = [];

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
      
      // Add detailed logging
      console.log('=== UPDATE INVENTORY DEBUG ===');
      console.log('Raw request body:', JSON.stringify(req.body, null, 2));
      console.log('Processed data:', JSON.stringify(data, null, 2));
      console.log('Windows value:', data.windows);
      console.log('Device type value:', data.deviceType);
      console.log('User type value:', data.userType);
      console.log('=============================');
      
      // Detailed logging
      const debugEntry = {
        timestamp: new Date().toISOString(),
        params: req.params,
        body: req.body,
        itemBefore: item.toJSON(),
        result: null,
        error: null
      };
      // Backend validation for emailId
      if (data.emailId && !/^.+@olam-agri\.com$/.test(data.emailId.trim())) {
        debugEntry.error = 'Invalid emailId';
        updateDebugLog.push(debugEntry);
        if (updateDebugLog.length > 10) updateDebugLog.shift();
        return res.status(400).json({ error: 'Email ID must end with @olam-agri.com' });
      }
      if (data.multipleUsers && typeof data.multipleUsers === 'string') {
        try { data.multipleUsers = JSON.parse(data.multipleUsers); } catch (e) { data.multipleUsers = null; }
      }
      try {
        await item.update(data);
        debugEntry.result = item.toJSON();
      } catch (err) {
        console.log('UPDATE ERROR:', err.message);
        console.log('UPDATE ERROR STACK:', err.stack);
        debugEntry.error = err.message;
      }
      updateDebugLog.push(debugEntry);
      if (updateDebugLog.length > 10) updateDebugLog.shift();
      if (debugEntry.error) {
        return res.status(400).json({ error: debugEntry.error });
      }
      return res.json(item);
    }
    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    updateDebugLog.push({ timestamp: new Date().toISOString(), params: req.params, body: req.body, error: err.message });
    if (updateDebugLog.length > 10) updateDebugLog.shift();
    res.status(400).json({ error: err.message });
  }
};

// Temporary debug endpoint
exports.getUpdateDebugLog = (req, res) => {
  res.json(updateDebugLog);
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
      location: targetUser.location,
      // Do NOT update userName during transfer
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
  let { itSpoc, status } = req.query;
  console.log('Received filter request:', { itSpoc, status });
  if (!itSpoc) return res.status(400).json({ error: 'Missing itSpoc parameter' });
  try {
    itSpoc = itSpoc.trim().toLowerCase();
    const where = {};
    // Database-agnostic case-insensitive match for itSpoc
    where[InventoryItem.sequelize.where(
      InventoryItem.sequelize.fn('LOWER', InventoryItem.sequelize.col('itSpoc')),
      itSpoc
    )] = true;
    if (status) where.status = status;
    console.log('Sequelize where clause:', where);
    const items = await InventoryItem.findAll({ where });
    res.status(200).json(Array.isArray(items) ? items : []);
  } catch (err) {
    console.error('Error in getInventoryByItSpoc:', err);
    // Always return an array, even on error
    res.status(200).json([]);
  }
};

// Get all unique IT SPOC names and statuses
exports.getUniqueItSpocsAndStatuses = async (req, res) => {
  try {
    const itSpocs = await InventoryItem.findAll({
      attributes: [
        [InventoryItem.sequelize.fn('DISTINCT', InventoryItem.sequelize.col('itSpoc')), 'itSpoc']
      ],
      raw: true
    });
    const statuses = await InventoryItem.findAll({
      attributes: [
        [InventoryItem.sequelize.fn('DISTINCT', InventoryItem.sequelize.col('status')), 'status']
      ],
      raw: true
    });
    res.json({
      itSpocs: itSpocs.map(row => row.itSpoc).filter(Boolean),
      statuses: statuses.map(row => row.status).filter(Boolean)
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}; 