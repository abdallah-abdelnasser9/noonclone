const User = require('../models/User');

// Show login page
const showLogin = (req, res) => {
  res.render('customer/login', { 
    title: 'Login',
    error: req.session.error,
    success: req.session.success
  });
  req.session.error = null;
  req.session.success = null;
};

// Process login
const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      req.session.error = 'Invalid email or password';
      return res.redirect('/login');
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      req.session.error = 'Invalid email or password';
      return res.redirect('/login');
    }
    
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image
    };
    
    req.session.success = `Welcome back, ${user.name}!`;
    
    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/');
    }
  } catch (error) {
    req.session.error = 'Login failed. Please try again.';
    res.redirect('/login');
  }
};

// Show register page
const showRegister = (req, res) => {
  res.render('customer/register', { 
    title: 'Register',
    error: req.session.error
  });
  req.session.error = null;
};

// Process registration
const register = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  
  if (password !== confirmPassword) {
    req.session.error = 'Passwords do not match';
    return res.redirect('/register');
  }
  
  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      req.session.error = 'Email already registered';
      return res.redirect('/register');
    }
    
    // Hash password manually
    const hashedPassword = await User.hashPassword(password);
    
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,  // Use hashed password
      role: 'customer'
    });
    
    await user.save();
    
    req.session.success = 'Registration successful! Please login.';
    res.redirect('/login');
  } catch (error) {
    console.error('Registration error:', error);
    req.session.error = 'Registration failed. Please try again.';
    res.redirect('/register');
  }
};

// Logout
const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/login');
};

module.exports = { showLogin, login, showRegister, register, logout };