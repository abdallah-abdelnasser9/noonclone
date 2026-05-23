const express = require('express');
const router = express.Router();
const { showLogin, login, showRegister, register, logout } = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/login', showLogin);
router.post('/login', login);
router.get('/register', showRegister);
router.post('/register', register);
router.get('/logout', isAuthenticated, logout);

module.exports = router;