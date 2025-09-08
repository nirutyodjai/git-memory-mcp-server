/**
 * Authentication Routes
 * Complete REST API endpoints for user authentication and management
 */

const express = require('express');
const UserService = require('./user-service');
const AuthMiddleware = require('./auth-middleware');

class AuthRoutes {
  constructor() {
    this.router = express.Router();
    this.userService = new UserService();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    // Public routes
    this.router.post('/register', this.register.bind(this));
    this.router.post('/login', this.login.bind(this));
    this.router.post('/refresh', this.refreshToken.bind(this));
    this.router.post('/logout', this.logout.bind(this));
    
    // Protected routes
    this.router.get('/profile', this.authMiddleware.verifyToken, this.getProfile.bind(this));
    this.router.put('/profile', this.authMiddleware.verifyToken, this.updateProfile.bind(this));
    this.router.post('/change-password', this.authMiddleware.verifyToken, this.changePassword.bind(this));
    
    // Admin routes
    this.router.get('/users', 
      this.authMiddleware.verifyToken, 
      this.authMiddleware.requireAdmin, 
      this.getAllUsers.bind(this)
    );
    this.router.put('/users/:userId/deactivate', 
      this.authMiddleware.verifyToken, 
      this.authMiddleware.requireAdmin, 
      this.deactivateUser.bind(this)
    );
    this.router.get('/users/:userId', 
      this.authMiddleware.verifyToken, 
      this.authMiddleware.requireModerator, 
      this.getUserById.bind(this)
    );
    
    // Health check
    this.router.get('/health', this.healthCheck.bind(this));
  }

  /**
   * Register new user
   * POST /auth/register
   */
  async register(req, res) {
    try {
      const { username, email, password, firstName, lastName, role } = req.body;

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username, email, and password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Username validation
      if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({
          success: false,
          error: 'Username must be at least 3 characters and contain only letters, numbers, and underscores'
        });
      }

      const user = await this.userService.registerUser({
        username,
        email,
        password,
        firstName,
        lastName,
        role: role || 'USER'
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Registration failed'
      });
    }
  }

  /**
   * User login
   * POST /auth/login
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required'
        });
      }

      const result = await this.userService.loginUser({ username, password });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role
          },
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Login failed'
      });
    }
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }

      const result = await this.userService.refreshToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          user: result.user
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Token refresh failed'
      });
    }
  }

  /**
   * User logout
   * POST /auth/logout
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await this.userService.logoutUser(refreshToken);
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }

  /**
   * Get user profile
   * GET /auth/profile
   */
  async getProfile(req, res) {
    try {
      const user = await this.userService.getUserProfile(req.user.id);

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  }

  /**
   * Update user profile
   * PUT /auth/profile
   */
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, bio, avatar, preferences } = req.body;

      const user = await this.userService.updateUserProfile(req.user.id, {
        firstName,
        lastName,
        bio,
        avatar,
        preferences
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }

  /**
   * Change password
   * POST /auth/change-password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 6 characters long'
        });
      }

      await this.userService.changePassword(req.user.id, {
        currentPassword,
        newPassword
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to change password'
      });
    }
  }

  /**
   * Get all users (admin only)
   * GET /auth/users
   */
  async getAllUsers(req, res) {
    try {
      const { page, limit, role, isActive, search } = req.query;
      
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        role,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search
      };

      const result = await this.userService.getAllUsers(filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get users'
      });
    }
  }

  /**
   * Get user by ID (moderator/admin only)
   * GET /auth/users/:userId
   */
  async getUserById(req, res) {
    try {
      const { userId } = req.params;

      const user = await this.userService.getUserProfile(userId);

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  }

  /**
   * Deactivate user (admin only)
   * PUT /auth/users/:userId/deactivate
   */
  async deactivateUser(req, res) {
    try {
      const { userId } = req.params;

      if (userId === req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot deactivate your own account'
        });
      }

      await this.userService.deactivateUser(userId);

      res.json({
        success: true,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to deactivate user'
      });
    }
  }

  /**
   * Health check
   * GET /auth/health
   */
  async healthCheck(req, res) {
    try {
      // Test database connection
      await this.userService.prisma.$queryRaw`SELECT 1`;
      
      res.json({
        success: true,
        message: 'Authentication service is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        success: false,
        error: 'Authentication service is unhealthy',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get router instance
   */
  getRouter() {
    return this.router;
  }

  /**
   * Close connections
   */
  async close() {
    await this.userService.disconnect();
    await this.authMiddleware.disconnect();
  }
}

module.exports = AuthRoutes;