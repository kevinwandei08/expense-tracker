const express = require('express');
const router = express.Router();

const {
    getDashboardSummary
} = require('../controllers/dashboardController');

const authenticateToken = require('../middleware/auth');

// All dashboard routes require authentication.
router.use(authenticateToken);

router.get('/summary', getDashboardSummary);

module.exports = router;