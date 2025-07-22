const InventoryItem = require('../models/inventory-item');
const { Op } = require('sequelize');

// Get all inventory rows for user dashboard
exports.getUserInventory = async (req, res) => {
  try {
    // Only return items for the logged-in user, unless admin
    const email = req.user && req.user.email;
    if (!email) return res.status(401).json({ error: 'Not authenticated' });
    // Build where clause
    const whereClause = {
      [Op.or]: [
        { userEmail: email },
        { multipleUsers: { [Op.like]: `%${email}%` } },
      ],
    };
    // Add status filter if provided
    if (req.query.status) {
      whereClause.status = req.query.status;
    } else {
      whereClause.status = 'active'; // Default to active
    }
    const items = await InventoryItem.findAll({
      where: whereClause,
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all deleted items for user dashboard
exports.getDeletedItems = async (req, res) => {
  try {
    const email = req.user && req.user.email;
    if (!email) return res.status(401).json({ error: 'Not authenticated' });
    const items = await InventoryItem.findAll({
      where: {
        status: 'deleted',
        [Op.or]: [
          { userEmail: email },
          { multipleUsers: { [Op.like]: `%${email}%` } },
        ],
      },
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 