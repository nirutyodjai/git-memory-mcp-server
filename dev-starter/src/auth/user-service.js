/**
 * User Service - Complete User Management System
 * Handles user registration, authentication, profile management
 */

const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class UserService {
  constructor() {
    this.prisma = new PrismaClient();
    this.jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_key_for_development_only_change_in_production';
    this.saltRounds = 12;
  }

  /**
   * Register a new user
   */
  async registerUser(userData) {
    const { username, email, password, firstName, lastName, role = 'USER' } = userData;

    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email }
          ]
        }
      });

      if (existingUser) {
        throw new Error('User with this username or email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          isActive: true,
          emailVerified: false,
          profile: {
            bio: '',
            avatar: null,
            preferences: JSON.stringify({
              theme: 'light',
              notifications: true,
              language: 'en'
            })
          }
        }
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async loginUser(credentials) {
    const { username, password } = credentials;

    try {
      // Find user by username or email
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email: username }
          ]
        }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Create session
      await this.prisma.session.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          userAgent: 'API Client',
          ipAddress: '127.0.0.1'
        }
      });

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtSecret);
      
      // Find session
      const session = await this.prisma.session.findFirst({
        where: {
          token: refreshToken,
          userId: decoded.userId,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: true
        }
      });

      if (!session) {
        throw new Error('Invalid refresh token');
      }

      if (!session.user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(session.user);

      return {
        accessToken,
        user: {
          id: session.user.id,
          username: session.user.username,
          email: session.user.email,
          role: session.user.role
        }
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logoutUser(refreshToken) {
    try {
      await this.prisma.session.deleteMany({
        where: {
          token: refreshToken
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          profile: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
              likes: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updateData) {
    try {
      const { firstName, lastName, bio, avatar, preferences } = updateData;

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          profile: {
            bio,
            avatar,
            preferences: preferences ? JSON.stringify(preferences) : undefined
          }
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          profile: true
        }
      });

      return user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, passwordData) {
    const { currentPassword, newPassword } = passwordData;

    try {
      // Get current user
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, this.saltRounds);

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      // Invalidate all sessions except current one
      await this.prisma.session.deleteMany({
        where: {
          userId: userId
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(filters = {}) {
    try {
      const { page = 1, limit = 10, role, isActive, search } = filters;
      const skip = (page - 1) * limit;

      const where = {};
      if (role) where.role = role;
      if (typeof isActive === 'boolean') where.isActive = isActive;
      if (search) {
        where.OR = [
          { username: { contains: search } },
          { email: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } }
        ];
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            lastLoginAt: true,
            _count: {
              select: {
                posts: true,
                comments: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.user.count({ where })
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  /**
   * Deactivate user (admin only)
   */
  async deactivateUser(userId) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      });

      // Invalidate all sessions
      await this.prisma.session.deleteMany({
        where: { userId }
      });

      return { success: true };
    } catch (error) {
      console.error('Deactivate user error:', error);
      throw error;
    }
  }

  /**
   * Generate access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      this.jwtSecret,
      { expiresIn: '15m' }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        type: 'refresh'
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      console.log(`Cleaned up ${result.count} expired sessions`);
      return result.count;
    } catch (error) {
      console.error('Session cleanup error:', error);
      throw error;
    }
  }

  /**
   * Initialize user service
   */
  async initialize() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      console.log('✅ UserService initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize UserService:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = UserService;