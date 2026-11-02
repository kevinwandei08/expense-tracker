
const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Basic API health check
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Expense Tracker API is running'
    });
});

// Database connectivity check
router.get('/db', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT NOW() AS database_time'
        );

        res.status(200).json({
            success: true,
            message: 'Database connection successful',
            databaseTime: result.rows[0].database_time
        });

    } catch (error) {
        console.error('Database health check failed:', error.message);

        res.status(503).json({
            success: false,
            message: 'Database connection failed'
        });
    }
});

module.exports = router;
