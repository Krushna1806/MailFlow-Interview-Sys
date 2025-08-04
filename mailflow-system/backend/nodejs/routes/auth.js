const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Mock database for development
let users = [
    {
        id: 'dev-user',
        email: 'dev@mailflow.com',
        name: 'Development User',
        password: '$2a$10$hashedpassword', // hashed 'password'
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists with this email'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = {
            id: Date.now().toString(),
            email,
            name,
            password: hashedPassword,
            role: 'user',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        users.push(user);

        // Generate JWT token
        const payload = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'mailflow-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                token
            }
        });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register user'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user
        const user = users.find(u => u.email === email && u.isActive);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const payload = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'mailflow-secret-key',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                token
            }
        });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to login'
        });
    }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, (req, res) => {
    try {
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile'
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
    authMiddleware,
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const userIndex = users.findIndex(u => u.id === req.user.id);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const { name, email } = req.body;

        // Check if email is being changed and if it's already taken
        if (email && email !== users[userIndex].email) {
            const emailExists = users.find(u => u.email === email && u.id !== req.user.id);
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    error: 'Email already in use'
                });
            }
        }

        // Update user
        const updatedUser = {
            ...users[userIndex],
            ...req.body,
            updatedAt: new Date()
        };

        users[userIndex] = updatedUser;

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                role: updatedUser.role,
                updatedAt: updatedUser.updatedAt
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile'
        });
    }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
    authMiddleware,
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        
        const userIndex = users.findIndex(u => u.id === req.user.id);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = users[userIndex];

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        users[userIndex] = {
            ...user,
            password: hashedPassword,
            updatedAt: new Date()
        };

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password'
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authMiddleware, (req, res) => {
    try {
        // In a real application, you might want to blacklist the token
        // For now, we just send a success response
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to logout'
        });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email } = req.body;

        const user = users.find(u => u.email === email && u.isActive);
        
        // Always return success for security (don't reveal if email exists)
        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent'
        });

        // In a real application, you would send an email with a reset token
        if (user) {
            console.log(`Password reset requested for ${email}`);
            // Generate reset token and send email
        }

    } catch (error) {
        console.error('Error processing forgot password:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process password reset request'
        });
    }
});

// @route   GET /api/auth/verify-token
// @desc    Verify if token is valid
// @access  Private
router.get('/verify-token', authMiddleware, (req, res) => {
    try {
        // If middleware passes, token is valid
        res.status(200).json({
            success: true,
            message: 'Token is valid',
            data: {
                user: req.user
            }
        });

    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify token'
        });
    }
});

// @route   GET /api/auth/users
// @desc    Get all users (admin only)
// @access  Private
router.get('/users', authMiddleware, (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin role required.'
            });
        }

        const userList = users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));

        res.status(200).json({
            success: true,
            data: userList
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});

module.exports = router;