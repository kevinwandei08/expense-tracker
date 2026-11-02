const express = require('express');
const router = express.Router();

const {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
} = require('../controllers/transactionController');

const authenticateToken = require('../middleware/auth');

// All transaction routes require authentication.
router.use(authenticateToken);

// Create a transaction.
router.post('/', createTransaction);

// Retrieve all transactions.
router.get('/', getTransactions);

// Retrieve one transaction.
router.get('/:id', getTransactionById);

// Update a transaction.
router.put('/:id', updateTransaction);

// Delete a transaction.
router.delete('/:id', deleteTransaction);

module.exports = router;
