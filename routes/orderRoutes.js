const express = require('express');
const router = express.Router();
const { showCheckout, placeOrder, getOrders, getOrder } = require('../controllers/orderController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/checkout', isAuthenticated, showCheckout);
router.post('/place', isAuthenticated, placeOrder);
router.get('/', isAuthenticated, getOrders);
router.get('/:id', isAuthenticated, getOrder);

module.exports = router;