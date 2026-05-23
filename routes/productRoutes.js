const express = require('express');
const router = express.Router();
const { getAllProducts, getProduct, addReview } = require('../controllers/productController');
const { isAuthenticated } = require('../middleware/auth');

// Make sure the shop route is correctly defined
router.get('/shop', getAllProducts);
router.get('/', getAllProducts);
router.get('/:id', getProduct);
router.post('/:id/review', isAuthenticated, addReview);

module.exports = router;