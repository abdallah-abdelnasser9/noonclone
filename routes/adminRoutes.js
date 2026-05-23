const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const categoryController = require('../controllers/categoryController');
const userController = require('../controllers/userController');

// Apply admin middleware to all routes
router.use(isAuthenticated, isAdmin);

// Dashboard
router.get('/dashboard', adminController.dashboard);

// Admin Profile
router.get('/profile', adminController.adminProfile);
router.post('/profile/update', adminController.updateAdminProfile);

// Product Management
router.get('/products', productController.adminProducts);
router.get('/products/create', productController.createProductForm);
router.post('/products/create', productController.createProduct);
router.get('/products/edit/:id', productController.editProductForm);
router.post('/products/edit/:id', productController.updateProduct);
router.post('/products/delete/:id', productController.deleteProduct);
router.get('/products/:id', productController.viewProduct);

// Order Management
router.get('/orders', orderController.adminOrders);
router.get('/orders/:id', orderController.viewOrder);
router.post('/orders/update-status/:id', orderController.updateOrderStatus);

// Category Management
router.get('/categories', categoryController.adminCategories);
router.get('/categories/create', categoryController.createCategoryForm);
router.post('/categories/create', categoryController.createCategory);
router.get('/categories/edit/:id', categoryController.editCategoryForm);
router.post('/categories/edit/:id', categoryController.updateCategory);
router.post('/categories/delete/:id', categoryController.deleteCategory);

// User Management
router.get('/users', userController.adminUsers);
router.get('/users/create', userController.createUserForm);
router.post('/users/create', userController.createUser);
router.get('/users/edit/:id', userController.editUserForm);
router.post('/users/edit/:id', userController.updateUser);
router.post('/users/delete/:id', userController.deleteUser);

module.exports = router;