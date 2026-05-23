const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCart, removeFromCart } = require('../controllers/cartController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, getCart);
router.post('/add/:id', isAuthenticated, addToCart);
router.put('/update', isAuthenticated, updateCart);
router.delete('/remove/:id', isAuthenticated, removeFromCart);

module.exports = router;