const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role }],
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.Role ? user.Role.name : null,
      location: user.location,
    }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.Role ? user.Role.name : null,
      location: user.location,
    }});
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}; 