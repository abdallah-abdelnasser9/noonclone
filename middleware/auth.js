const User = require('../models/User');

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.session.error = 'Please login first';
  res.redirect('/login');
};

const isAdmin = async (req, res, next) => {
  if (!req.session.user) {
    req.session.error = 'Please login first';
    return res.redirect('/login');
  }
  
  try {
    const user = await User.findById(req.session.user._id);
    if (user && user.role === 'admin') {
      return next();
    }
    req.session.error = 'Access denied. Admin only.';
    res.redirect('/');
  } catch (error) {
    req.session.error = 'Authentication error';
    res.redirect('/login');
  }
};

const isCustomer = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'customer') {
    return next();
  }
  req.session.error = 'Customer access required';
  res.redirect('/login');
};

module.exports = { isAuthenticated, isAdmin, isCustomer };