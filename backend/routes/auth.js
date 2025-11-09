const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool, sequelize } = require('../config/database');
const { generateTokens, verifyRefreshToken, authenticateToken } = require('../middleware/auth');
const { Sequelize, Op } = require('sequelize');

const router = express.Router();

// Dynamic User model loading
const getUserModel = () => {
  try {
    // Try to get from models index first
    const modelsIndex = require('../models/index');
    
    if (modelsIndex.User) {
      console.log('✅ Using Sequelize User model');
      return { model: modelsIndex.User, isSequelize: true };
    }
    
    // Try direct access to Sequelize model
    const { User } = require('../models/BloodReservation');
    if (User) {
      console.log('✅ Using direct Sequelize User model');
      return { model: User, isSequelize: true };
    }
  } catch (error) {
    console.log('⚠️  Sequelize User model not available, using raw SQL');
  }
  
  // Fallback to raw SQL
  return { model: null, isSequelize: false };
};

// Register endpoint
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstname, lastname } = req.body;
    const { model: User, isSequelize } = getUserModel();

    if (isSequelize && User) {
      // Use Sequelize
      console.log('📝 Creating user with Sequelize...');
      
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        firstname: firstname || null,
        lastname: lastname || null
      });

      const userData = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        created_at: newUser.created_at
      };

      const { accessToken, refreshToken } = generateTokens(userData);

      // Store refresh token
      await User.update(
        { refresh_token: refreshToken },
        { where: { id: newUser.id } }
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: userData,
        accessToken,
        refreshToken
      });

    } else {
      // Use raw SQL (fallback)
      console.log('📝 Creating user with raw SQL...');
      
      // Check if user already exists
      const userExists = await pool.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (userExists.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await pool.query(
        'INSERT INTO users (username, email, password, firstname, lastname) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, created_at',
        [username, email, hashedPassword, firstname || null, lastname || null]
      );

      const user = newUser.rows[0];
      const { accessToken, refreshToken } = generateTokens(user);

      // Store refresh token in database
      await pool.query(
        'UPDATE users SET refresh_token = $1 WHERE id = $2',
        [refreshToken, user.id]
      );

      res.status(201).json({
        message: 'User registered successfully',
        user,
        accessToken,
        refreshToken
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const { model: User, isSequelize } = getUserModel();

    if (isSequelize && User) {
      // Use Sequelize
      console.log('🔍 Finding user with Sequelize...');
      
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email: username }
          ]
        }
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email
      };

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(userData);

      // Store refresh token
      await User.update(
        { 
          refresh_token: refreshToken,
          last_login: new Date()
        },
        { where: { id: user.id } }
      );

      res.json({
        message: 'Login successful',
        user: userData,
        accessToken,
        refreshToken
      });

    } else {
      // Use raw SQL (fallback)
      console.log('🔍 Finding user with raw SQL...');
      
      // Find user
      const userResult = await pool.query(
        'SELECT id, username, email, password FROM users WHERE username = $1 OR email = $1',
        [username]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = userResult.rows[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Store refresh token in database
      await pool.query(
        'UPDATE users SET refresh_token = $1, last_login = CURRENT_TIMESTAMP WHERE id = $2',
        [refreshToken, user.id]
      );

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        accessToken,
        refreshToken
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = await verifyRefreshToken(refreshToken);
    const { model: User, isSequelize } = getUserModel();

    if (isSequelize && User) {
      // Use Sequelize
      console.log('🔄 Refreshing token with Sequelize...');
      
      const user = await User.findOne({
        where: { id: decoded.id },
        attributes: ['id', 'username', 'email', 'refresh_token']
      });

      if (!user || user.refresh_token !== refreshToken) {
        return res.status(403).json({ message: 'Invalid refresh token' });
      }

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email
      };

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(userData);

      // Update refresh token
      await User.update(
        { refresh_token: newRefreshToken },
        { where: { id: user.id } }
      );

      res.json({
        accessToken,
        refreshToken: newRefreshToken
      });

    } else {
      // Use raw SQL (fallback)
      console.log('🔄 Refreshing token with raw SQL...');
      
      // Check if refresh token exists in database
      const userResult = await pool.query(
        'SELECT id, username, email, refresh_token FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length === 0 || userResult.rows[0].refresh_token !== refreshToken) {
        return res.status(403).json({ message: 'Invalid refresh token' });
      }

      const user = userResult.rows[0];
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

      // Update refresh token in database
      await pool.query(
        'UPDATE users SET refresh_token = $1 WHERE id = $2',
        [newRefreshToken, user.id]
      );

      res.json({
        accessToken,
        refreshToken: newRefreshToken
      });
    }

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Clear refresh token from database
    await pool.query(
      'UPDATE users SET refresh_token = NULL WHERE id = $1',
      [req.user.id]
    );

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, username, email, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: userResult.rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;