const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {
  showProfile,
  updateProfile,
  editProfileForm,
  changePasswordForm,
  changePassword,
  getWishlist,
  addToWishlist,
  removeFromWishlist
} = require('../controllers/userController');

// Profile routes
router.get('/profile', isAuthenticated, showProfile);
router.get('/profile/edit', isAuthenticated, editProfileForm);
router.post('/profile/update', isAuthenticated, updateProfile);

// Password routes
router.get('/change-password', isAuthenticated, changePasswordForm);
router.post('/change-password', isAuthenticated, changePassword);

// Wishlist routes
router.get('/wishlist', isAuthenticated, getWishlist);
router.post('/wishlist/add/:id', isAuthenticated, addToWishlist);
router.post('/wishlist/remove/:id', isAuthenticated, removeFromWishlist);

module.exports = router;