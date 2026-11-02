
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const pool = require('../config/db');

// Registration validation
const registerSchema = z.object({
    full_name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(72)
});

// Login validation
const loginSchema = z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(1).max(72)
});

// Generate JWT
const generateToken = (userId) => {
    return jwt.sign(
        { sub: String(userId) },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
};

// REGISTER
const register = async (req, res) => {
    try {
        const validation = registerSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid registration data',
                errors: validation.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        const { full_name, password } = validation.data;
        const email = validation.data.email.toLowerCase();

        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (full_name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, full_name, email, created_at`,
            [full_name, email, passwordHash]
        );

        const user = result.rows[0];
        const token = generateToken(user.id);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            user
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        console.error('Registration error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
};

// LOGIN
const login = async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid login data'
            });
        }

        const email = validation.data.email.toLowerCase();
        const { password } = validation.data;

        const result = await pool.query(
            `SELECT id, full_name, email, password_hash
             FROM users
             WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = generateToken(user.id);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

// GET CURRENT USER
const getMe = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, full_name, email, created_at
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Profile error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve profile'
        });
    }
};

module.exports = {
    register,
    login,
    getMe
};
