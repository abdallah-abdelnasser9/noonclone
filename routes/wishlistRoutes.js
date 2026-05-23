const express = require('express');
const router = express.Router();
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist
} = require('../controllers/wishlistController');
const { isAuthenticated } = require('../middleware/auth');

// Remove /wishlist prefix since it's already in the mount path
router.get('/', isAuthenticated, getWishlist);
router.post('/add/:productId', isAuthenticated, addToWishlist);
router.delete('/remove/:productId', isAuthenticated, removeFromWishlist);

module.exports = router;