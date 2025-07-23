const express = require('express');
const bodyParser = require('body-parser');
const apiInventoryRoutes = require('./routes/api-inventory');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const apiUsersRoutes = require('./routes/api-users');
const { User, Role, InventoryItem } = require('./models');
const bcrypt = require('bcryptjs');
const winston = require('winston');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { Op } = require('sequelize');

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Serve static files from the public directory
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL session store options
const sessionStoreOptions = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Emmyzo@24!',
  database: 'it_inventory',
};
const sessionStore = new MySQLStore(sessionStoreOptions);

// Configure express-session
app.use(session({
  secret: 'your-session-secret', // Change this to a strong secret in production
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
}));

// Middleware to inject user from session into all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Auth routes
app.use('/api', authRoutes);
// Admin routes
app.use('/', adminRoutes);
// User info routes
app.use('/api', apiUsersRoutes);
// API routes
app.use('/api', apiInventoryRoutes);

// Configure winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(__dirname, '../logs/app.log'), maxsize: 1048576, maxFiles: 5 })
  ],
});

// Update the root route to render the login page
app.get('/', (req, res) => {
  res.render('login');
});

// Web login POST handler
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role }],
    });
    if (!user) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).render('login', { error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).render('login', { error: 'Invalid credentials' });
    }
    // Log successful login
    logger.info(`User logged in: ${user.username} (${user.email}) [Role: ${user.Role ? user.Role.name : 'Unknown'}]`);
    // Store user info in session (exclude password)
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.Role ? user.Role.name : null,
      location: user.location,
    };
    // Redirect based on role
    if (user.Role && (user.Role.name === 'SUPER_ADMIN' || user.Role.name === 'Admin')) {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/user/dashboard');
    }
  } catch (err) {
    logger.error(`Login error for email ${email}: ${err.stack || err}`);
    return res.status(500).render('login', { error: 'Server error' });
  }
});

// Admin dashboard and sidebar pages rendering
app.get('/admin/dashboard', (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'SUPER_ADMIN' && req.session.user.role !== 'Admin')) {
    return res.redirect('/');
  }
  res.render('admin_dashboard', { user: req.session.user, activeTab: 'dashboard' });
});

app.get('/admin/users', (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'SUPER_ADMIN' && req.session.user.role !== 'Admin')) {
    return res.redirect('/');
  }
  res.render('users', { user: req.session.user, activeTab: 'users' });
});

app.get('/admin/inventory', (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'SUPER_ADMIN' && req.session.user.role !== 'Admin')) {
    return res.redirect('/');
  }
  res.render('inventory', { user: req.session.user, activeTab: 'inventory' });
});

app.get('/admin/settings', (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'SUPER_ADMIN' && req.session.user.role !== 'Admin')) {
    return res.redirect('/');
  }
  res.render('settings', { user: req.session.user, activeTab: 'settings' });
});

app.get('/admin/deleted-items', (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'SUPER_ADMIN' && req.session.user.role !== 'Admin')) {
    return res.redirect('/');
  }
  res.render('deleted_items', { user: req.session.user, activeTab: 'deleted-items' });
});

// User dashboard route
app.get('/user/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('user_dashboard', { user: req.session.user, activeTab: 'dashboard' });
});

// User spares inventory route
app.get('/user/spares', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('user_dashboard', { user: req.session.user, activeTab: 'spares' });
});

// User deleted items route
app.get('/user/deleted', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('deleted_items', { user: req.session.user, activeTab: 'deleted' });
});

// User scrap inventory route
app.get('/user/scrap', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('user_dashboard', { user: req.session.user, activeTab: 'scrap' });
});

// Recent users endpoint for admin dashboard
app.get('/admin/dashboard/recent-users', async (req, res) => {
  try {
    const users = await User.findAll({
      include: [Role],
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: { exclude: ['password'] },
    });
    const formatted = users.map(u => ({
      id: u.id,
      name: u.username,
      email: u.email,
      role: u.Role ? u.Role.name : '',
      status: 'Active', // You can update this if you have a real status field
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Inventory API for admin inventory sheet
app.get('/admin/inventory/api', async (req, res) => {
  try {
    const items = await InventoryItem.findAll({ order: [['createdAt', 'DESC']] });
    // Map to frontend format
    const formatted = items.map(item => ({
      id: item.id,
      sn: item.id, // or item.systemSerial if you want
      itSpoc: item.itSpoc,
      primaryUserName: item.userName,
      primaryUserEmail: item.userEmail,
      deviceType: item.deviceType,
      windowsVersion: item.windows,
      windowsType: item.windowsType,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout route for both user and admin dashboards
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Global 404 handler (must be last)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app; 