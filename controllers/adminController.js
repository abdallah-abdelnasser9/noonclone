const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Category = require('../models/category');

// Admin Dashboard
const dashboard = async (req, res) => {
  try {
    const stats = {
      totalProducts: await Product.countDocuments(),
      totalUsers: await User.countDocuments(),
      totalOrders: await Order.countDocuments(),
      totalCategories: await Category.countDocuments(),
      recentOrders: await Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
      lowStockProducts: await Product.find({ stock: { $lt: 10 } })
        .populate('category', 'name')
        .limit(5)
    };
    
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const revenue = revenueResult[0]?.total || 0;
    
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.session.user,
      stats,
      revenue,
      ordersByStatus,
      activePage: 'dashboard',
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Dashboard error:', error);
    req.session.error = 'Failed to load dashboard';
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.session.user,
      stats: {
        totalProducts: 0,
        totalUsers: 0,
        totalOrders: 0,
        totalCategories: 0,
        recentOrders: [],
        lowStockProducts: []
      },
      revenue: 0,
      ordersByStatus: [],
      activePage: 'dashboard',
      error: req.session.error
    });
  }
};

// Admin Profile
const adminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.session.user._id).select('-password');
    
    res.render('admin/profile', {
      title: 'Admin Profile',
      user: admin,
      activePage: 'profile',
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Error loading admin profile:', error);
    req.session.error = 'Failed to load profile';
    res.redirect('/admin/dashboard');
  }
};

// Update Admin Profile
const updateAdminProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.session.user._id);
    
    user.name = name || user.name;
    user.email = email || user.email;
    
    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        req.session.error = 'Current password is incorrect';
        return res.redirect('/admin/profile');
      }
      user.password = await User.hashPassword(newPassword);
    }
    
    await user.save();
    
    req.session.user.name = user.name;
    req.session.user.email = user.email;
    
    req.session.success = 'Profile updated successfully';
    res.redirect('/admin/profile');
  } catch (error) {
    console.error('Error updating admin profile:', error);
    req.session.error = 'Failed to update profile';
    res.redirect('/admin/profile');
  }
};

module.exports = { 
  dashboard,
  adminProfile,
  updateAdminProfile
};