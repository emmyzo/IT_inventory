const { User, Role } = require('../models');
const { Op } = require('sequelize');

exports.getCurrentUser = (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
    location: req.user.location,
  });
};

// Get user list for transfer (excluding admins and self)
exports.getTransferableUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{
        model: Role,
        where: {
          name: { [Op.notIn]: ['SUPER_ADMIN', 'ADMIN'] }
        }
      }],
      where: {
        id: { [Op.ne]: req.user.id }
      },
      attributes: ['id', 'username']
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}; 