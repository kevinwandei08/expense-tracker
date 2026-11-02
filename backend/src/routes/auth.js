
const express = require('express');
const rateLimit = require('express-rate-limit');

const {
    register,
    login,
    getMe
} = require('../controllers/authController');

const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Authentication-specific rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false
});

router.post('/register', authLimiter, register);

router.post('/login', authLimiter, login);

router.get('/me', authenticateToken, getMe);

module.exports = router;
