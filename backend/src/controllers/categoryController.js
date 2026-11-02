const { z } = require('zod');
const pool = require('../config/db');

// Validation schemas
const categorySchema = z.object({
    name: z.string().trim().min(1).max(100),
    type: z.enum(['income', 'expense'])
});

const updateCategorySchema = z.object({
    name: z.string().trim().min(1).max(100)
});

const idSchema = z.coerce.number().int().positive();

// CREATE CATEGORY
const createCategory = async (req, res, next) => {
    try {
        const validation = categorySchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                errors: validation.error.issues
            });
        }

        const { name, type } = validation.data;
        const userId = req.user.id;

        const result = await pool.query(
            `INSERT INTO categories (user_id, name, type)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [userId, name, type]
        );

        return res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'A category with this name and type already exists'
            });
        }

        next(error);
    }
};

// GET ALL CATEGORIES (OPTIONAL TYPE FILTER)
const getCategories = async (req, res, next) => {
    try {
        const { type } = req.query;

        if (type !== undefined && !['income', 'expense'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be income or expense'
            });
        }

        const values = [req.user.id];

        let query = `
            SELECT *
            FROM categories
            WHERE user_id = $1
        `;

        if (type !== undefined) {
            values.push(type);
            query += ` AND type = $2`;
        }

        query += ` ORDER BY type ASC, name ASC`;

        const result = await pool.query(query, values);

        return res.status(200).json({
            success: true,
            count: result.rowCount,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

// GET SINGLE CATEGORY
const getCategoryById = async (req, res, next) => {
    try {
        const idValidation = idSchema.safeParse(req.params.id);

        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }

        const result = await pool.query(
            `SELECT *
             FROM categories
             WHERE id = $1 AND user_id = $2`,
            [idValidation.data, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
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

// UPDATE CATEGORY NAME
const updateCategory = async (req, res, next) => {
    try {
        const idValidation = idSchema.safeParse(req.params.id);
        const bodyValidation = updateCategorySchema.safeParse(req.body);

        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }

        if (!bodyValidation.success) {
            return res.status(400).json({
                success: false,
                errors: bodyValidation.error.issues
            });
        }

        const result = await pool.query(
            `UPDATE categories
             SET name = $1
             WHERE id = $2 AND user_id = $3
             RETURNING *`,
            [bodyValidation.data.name, idValidation.data, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'A category with this name and type already exists'
            });
        }

        next(error);
    }
};

// DELETE CATEGORY
const deleteCategory = async (req, res, next) => {
    try {
        const idValidation = idSchema.safeParse(req.params.id);

        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }

        const result = await pool.query(
            `DELETE FROM categories
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [idValidation.data, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Category deleted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};