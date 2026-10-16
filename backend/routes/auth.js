/**
 * Salon Perimeter Shimoga — Admin Authentication API
 * Endpoints: POST /api/auth/login, GET /api/auth/verify
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { authLimiter } = require('../middleware/rateLimiter');
const { requireAuth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'salon-perimeter-dev-secret-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * POST /api/auth/login
 * Authenticates salon owner / staff and issues JWT token
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Username and password are required.'
      });
    }

    // Query admin user by username
    const result = await db.query(
      'SELECT id, username, password_hash, role, email FROM admin_users WHERE username = $1 LIMIT 1',
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password.'
      });
    }

    const admin = result.rows[0];

    // Verify password hash
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password.'
      });
    }

    // Update last login timestamp
    await db.query(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [admin.id]
    );

    // Sign JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Authentication service encountered an error. Please try again.'
    });
  }
});

/**
 * GET /api/auth/verify
 * Validates active JWT session
 */
router.get('/verify', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * POST /api/auth/change-password
 * Changes password for authenticated admin user
 */
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'PASSWORD_TOO_SHORT',
        message: 'New password must be at least 6 characters long.'
      });
    }

    const result = await db.query(
      'SELECT id, username, password_hash FROM admin_users WHERE id = $1 LIMIT 1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'INCORRECT_PASSWORD',
        message: 'Current password is incorrect.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE admin_users SET password_hash = $1 WHERE id = $2',
      [newHash, admin.id]
    );

    return res.json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    console.error('[AUTH] Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password. Please try again.'
    });
  }
});

module.exports = router;
