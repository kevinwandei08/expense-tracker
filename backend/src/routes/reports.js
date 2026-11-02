const express = require('express');
const router = express.Router();

const {
    getReportsSummary
} = require('../controllers/reportsController');

const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/summary', getReportsSummary);

module.exports = router;
