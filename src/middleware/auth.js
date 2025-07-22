const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

exports.requireAuth = (req, res, next) => {
  // Allow session-based authentication
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  // Fallback to JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

exports.requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (Array.isArray(roles)) {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else {
    if (req.user.role !== roles) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  next();
}; 