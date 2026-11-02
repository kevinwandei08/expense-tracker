const { z } = require('zod');
const pool = require('../config/db');

// Validate YYYY-MM-DD and reject impossible calendar dates.
const dateSchema = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
    .refine(value => {
        const date = new Date(`${value}T00:00:00.000Z`);
        return !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value;
    }, 'Invalid calendar date');

const transactionSchema = z.object({
    type: z.enum(['income', 'expense']),
    amount: z.number().positive().max(9999999999.99),
    category_id: z.number().int().positive().nullable().optional(),
    description: z.string().max(500).nullable().optional(),
    transaction_date: dateSchema
});

const updateSchema = transactionSchema.partial().refine(
    data => Object.keys(data).length > 0,
    { message: 'At least one field must be provided' }
);

const idSchema = z.coerce.number().int().positive();

// CREATE TRANSACTION
const createTransaction = async (req, res, next) => {
    try {
        const validation = transactionSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                errors: validation.error.issues
            });
        }

        const data = validation.data;
        const userId = req.user.id;

        if (data.category_id != null) {
            const category = await pool.query(
                `SELECT id FROM categories
                 WHERE id = $1 AND user_id = $2 AND type = $3`,
                [data.category_id, userId, data.type]
            );

            if (category.rowCount === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category or category type'
                });
            }
        }

        const result = await pool.query(
            `INSERT INTO transactions
                (user_id, category_id, type, amount, description, transaction_date)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                userId,
                data.category_id ?? null,
                data.type,
                data.amount,
                data.description ?? null,
                data.transaction_date
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

// GET ALL TRANSACTIONS (WITH OPTIONAL FILTERS)
const getTransactions = async (req, res, next) => {
    try {
        const { type, category_id, start_date, end_date } = req.query;

        const conditions = ['t.user_id = $1'];
        const values = [req.user.id];

        const addCondition = (condition, value) => {
            values.push(value);
            conditions.push(condition.replace('?', `$${values.length}`));
        };

        if (type !== undefined) {
            if (!['income', 'expense'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Type must be income or expense'
                });
            }
            addCondition('t.type = ?', type);
        }

        if (category_id !== undefined) {
            const parsedCategoryId = idSchema.safeParse(category_id);

            if (!parsedCategoryId.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category_id'
                });
            }

            addCondition('t.category_id = ?', parsedCategoryId.data);
        }

        if (start_date !== undefined) {
            const parsedDate = dateSchema.safeParse(start_date);

            if (!parsedDate.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid start_date'
                });
            }

            addCondition('t.transaction_date >= ?', parsedDate.data);
        }

        if (end_date !== undefined) {
            const parsedDate = dateSchema.safeParse(end_date);

            if (!parsedDate.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid end_date'
                });
            }

            addCondition('t.transaction_date <= ?', parsedDate.data);
        }

        if (start_date && end_date && start_date > end_date) {
            return res.status(400).json({
                success: false,
                message: 'start_date cannot be later than end_date'
            });
        }

        const result = await pool.query(
            `SELECT
                t.*,
                c.name AS category_name
             FROM transactions t
             LEFT JOIN categories c ON c.id = t.category_id
             WHERE ${conditions.join(' AND ')}
             ORDER BY t.transaction_date DESC, t.id DESC`,
            values
        );

        return res.status(200).json({
            success: true,
            count: result.rowCount,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

// GET ONE TRANSACTION
const getTransactionById = async (req, res, next) => {
    try {
        const parsedId = idSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction ID'
            });
        }

        const result = await pool.query(
            `SELECT
                t.*,
                c.name AS category_name
             FROM transactions t
             LEFT JOIN categories c ON c.id = t.category_id
             WHERE t.id = $1 AND t.user_id = $2`,
            [parsedId.data, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

// UPDATE TRANSACTION
const updateTransaction = async (req, res, next) => {
    try {
        const parsedId = idSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction ID'
            });
        }

        const validation = updateSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                errors: validation.error.issues
            });
        }

        const existing = await pool.query(
            `SELECT * FROM transactions
             WHERE id = $1 AND user_id = $2`,
            [parsedId.data, req.user.id]
        );

        if (existing.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        const current = existing.rows[0];

        const merged = {
            type: current.type,
            amount: Number(current.amount),
            category_id: current.category_id === null
                ? null
                : Number(current.category_id),
            description: current.description,
            transaction_date: current.transaction_date instanceof Date
                ? current.transaction_date.toISOString().slice(0, 10)
                : String(current.transaction_date).slice(0, 10),
            ...validation.data
        };

        const fullValidation = transactionSchema.safeParse(merged);

        if (!fullValidation.success) {
            return res.status(400).json({
                success: false,
                errors: fullValidation.error.issues
            });
        }

        const data = fullValidation.data;

        if (data.category_id != null) {
            const category = await pool.query(
                `SELECT id FROM categories
                 WHERE id = $1 AND user_id = $2 AND type = $3`,
                [data.category_id, req.user.id, data.type]
            );

            if (category.rowCount === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category or category type'
                });
            }
        }

        const result = await pool.query(
            `UPDATE transactions
             SET category_id = $1,
                 type = $2,
                 amount = $3,
                 description = $4,
                 transaction_date = $5,
                 updated_at = NOW()
             WHERE id = $6 AND user_id = $7
             RETURNING *`,
            [
                data.category_id ?? null,
                data.type,
                data.amount,
                data.description ?? null,
                data.transaction_date,
                parsedId.data,
                req.user.id
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

// DELETE TRANSACTION
const deleteTransaction = async (req, res, next) => {
    try {
        const parsedId = idSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction ID'
            });
        }

        const result = await pool.query(
            `DELETE FROM transactions
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [parsedId.data, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
};
