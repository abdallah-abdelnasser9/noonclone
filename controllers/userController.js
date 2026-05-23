const User = require('../models/User');
const Product = require('../models/Product');

// ========== CUSTOMER FUNCTIONS (ADD THESE) ==========

// Show user profile
const showProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).select('-password');
    
    if (!user) {
      req.session.error = 'User not found';
      return res.redirect('/');
    }
    
    res.render('user/profile', {
      title: 'My Profile',
      user,
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    req.session.error = 'Failed to load profile';
    res.redirect('/');
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, address } = req.body;
    
    const updateData = {
      name,
      email,
      address: {
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        zipCode: address?.zipCode || '',
        country: address?.country || ''
      }
    };
    
    // Update user in database
    const user = await User.findByIdAndUpdate(
      req.session.user._id,
      updateData,
      { new: true }
    ).select('-password');
    
    // Update session data
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image
    };
    
    req.session.success = 'Profile updated successfully';
    res.redirect('/user/profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    req.session.error = 'Failed to update profile';
    res.redirect('/user/profile');
  }
};

// Get user's wishlist
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id)
      .populate('wishlist');
    
    res.render('user/wishlist', {
      title: 'My Wishlist',
      wishlist: user?.wishlist || [],
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    req.session.error = 'Failed to load wishlist';
    res.redirect('/');
  }
};

// Add to wishlist
const addToWishlist = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user._id;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/products');
    }
    
    // Add to wishlist if not already there
    const user = await User.findById(userId);
    
    if (!user.wishlist) {
      user.wishlist = [];
    }
    
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
      req.session.success = 'Product added to wishlist';
    } else {
      req.session.success = 'Product already in wishlist';
    }
    
    // Redirect back to previous page or product page
    const redirectUrl = req.get('Referrer') || `/products/${productId}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    req.session.error = 'Failed to add to wishlist';
    res.redirect('/products');
  }
};

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user._id;
    
    await User.findByIdAndUpdate(userId, {
      $pull: { wishlist: productId }
    });
    
    req.session.success = 'Product removed from wishlist';
    res.redirect('/user/wishlist');
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    req.session.error = 'Failed to remove from wishlist';
    res.redirect('/user/wishlist');
  }
};
// Show edit profile form
const editProfileForm = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).select('-password');
    
    if (!user) {
      req.session.error = 'User not found';
      return res.redirect('/user/profile');
    }
    
    res.render('user/edit-profile', {
      title: 'Edit Profile',
      user,
      error: req.session.error
    });
    
    req.session.error = null;
  } catch (error) {
    console.error('Error loading edit profile:', error);
    req.session.error = 'Failed to load profile';
    res.redirect('/user/profile');
  }
};

// Change password form
const changePasswordForm = (req, res) => {
  res.render('user/change-password', {
    title: 'Change Password',
    error: req.session.error,
    success: req.session.success
  });
  req.session.error = null;
  req.session.success = null;
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      req.session.error = 'New passwords do not match';
      return res.redirect('/user/profile/edit');
    }
    
    if (newPassword.length < 6) {
      req.session.error = 'Password must be at least 6 characters';
      return res.redirect('/user/profile/edit');
    }
    
    const user = await User.findById(req.session.user._id);
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      req.session.error = 'Current password is incorrect';
      return res.redirect('/user/profile/edit');
    }
    
    // Hash new password manually
    user.password = await User.hashPassword(newPassword);
    await user.save();
    
    req.session.success = 'Password changed successfully!';
    res.redirect('/user/profile');
  } catch (error) {
    console.error('Error changing password:', error);
    req.session.error = 'Failed to change password';
    res.redirect('/user/profile/edit');
  }
};

// ========== ADMIN FUNCTIONS (YOUR EXISTING CODE) ==========

// Admin: List all users
const adminUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';
    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    res.render('admin/users/list', {
      title: 'Manage Users',
      users,
      currentPage: page,
      totalPages,
      search,
      role,
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Error fetching users:', error);
    req.session.error = 'Failed to load users';
    res.redirect('/admin/dashboard');
  }
};

// Admin: Show create user form
const createUserForm = (req, res) => {
  res.render('admin/users/create', {
    title: 'Create User',
    error: req.session.error,
    formData: req.session.formData
  });
  req.session.error = null;
  req.session.formData = null;
};

// Admin: Create user
// Admin: Create user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      req.session.error = 'All fields are required';
      req.session.formData = req.body;
      return res.redirect('/admin/users/create');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.session.error = 'Please enter a valid email address';
      req.session.formData = req.body;
      return res.redirect('/admin/users/create');
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      req.session.error = 'Email already registered';
      req.session.formData = req.body;
      return res.redirect('/admin/users/create');
    }
    
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'customer'
    });
    
    await user.save();
    console.log('User created successfully:', user._id);
    
    req.session.success = 'User created successfully';
    res.redirect('/admin/users');
    
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle specific errors - FIXED: use req.body instead of undefined variables
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      req.session.error = 'Validation error: ' + messages.join(', ');
    } else if (error.code === 11000) {
      req.session.error = 'Email already registered';
    } else {
      req.session.error = 'Failed to create user: ' + error.message;
    }
    
    // FIXED: Use req.body instead of destructured variables (which are undefined in catch)
    req.session.formData = {
      name: req.body.name || '',
      email: req.body.email || '',
      role: req.body.role || 'customer'
    };
    res.redirect('/admin/users/create');
  }
};
// Admin: Show edit user form
const editUserForm = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      req.session.error = 'User not found';
      return res.redirect('/admin/users');
    }
    
    res.render('admin/users/edit', {
      title: 'Edit User',
      user,
      error: req.session.error,
      formData: req.session.formData || user
    });
    req.session.error = null;
    req.session.formData = null;
  } catch (error) {
    console.error('Error loading user:', error);
    req.session.error = 'Failed to load user';
    res.redirect('/admin/users');
  }
};

// Admin: Update user
const adminUpdateUser = async (req, res) => {
  try {
    const { name, email, role, address } = req.body;
    
    const updateData = {
      name,
      email,
      role,
      address: {
        street: address?.street,
        city: address?.city,
        state: address?.state,
        zipCode: address?.zipCode,
        country: address?.country
      }
    };
    
    // If password is provided
    if (req.body.password) {
      const user = await User.findById(req.params.id);
      if (user) {
        user.password = req.body.password;
        await user.save();
      }
    }
    
    await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    req.session.success = 'User updated successfully';
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error updating user:', error);
    req.session.error = 'Failed to update user';
    res.redirect(`/admin/users/edit/${req.params.id}`);
  }
};

// Admin: Delete user
const deleteUser = async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.session.user._id.toString()) {
      req.session.error = 'You cannot delete your own account';
      return res.redirect('/admin/users');
    }
    
    await User.findByIdAndDelete(req.params.id);
    req.session.success = 'User deleted successfully';
  } catch (error) {
    console.error('Error deleting user:', error);
    req.session.error = 'Failed to delete user';
  }
  res.redirect('/admin/users');
};

// ========== EXPORT ALL FUNCTIONS ==========
// ========== EXPORT ALL FUNCTIONS ==========
module.exports = {
  // Customer functions
  showProfile,
  updateProfile,
  editProfileForm,
  changePasswordForm,
  changePassword,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  
  // Admin functions
  adminUsers,
  createUserForm,
  createUser,
  editUserForm,
  updateUser: adminUpdateUser,
  deleteUser
};