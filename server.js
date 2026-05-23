const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
// Clear model cache
delete require.cache[require.resolve('./models/category')];
delete require.cache[require.resolve('./models/Product')];
delete require.cache[require.resolve('./models/Order')];
delete require.cache[require.resolve('./models/User')];

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/noon_clone';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global variables middleware
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.cartCount = req.session.cart ? req.session.cart.length : 0;
  res.locals.currentPath = req.path;
  next();
});

// Auto-set activePage for admin routes
app.use('/admin', (req, res, next) => {
  const path = req.path;
  if (path.includes('products')) res.locals.activePage = 'products';
  else if (path.includes('categories')) res.locals.activePage = 'categories';
  else if (path.includes('orders')) res.locals.activePage = 'orders';
  else if (path.includes('users')) res.locals.activePage = 'users';
  else res.locals.activePage = 'dashboard';
  next();
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');const wishlistRoutes = require('./routes/wishlistRoutes'); // ADD THIS

// Use routes
app.use('/', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/wishlist', wishlistRoutes); // ADD THIS - mounts at /wishlist

// Home route
// Home route
app.get('/', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const featuredProducts = await Product.find({ isActive: true }).limit(8);
    const recentProducts = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(8);
    
    res.render('customer/home', { 
      title: 'Home - Noon Clone',
      user: req.session.user,
      featuredProducts,
      recentProducts
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.render('customer/home', { 
      title: 'Home - Noon Clone',
      user: req.session.user,
      featuredProducts: [],
      recentProducts: []
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error',
    message: 'Something went wrong!' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    title: '404 Not Found',
    message: 'Page not found' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});