// Use require for JavaScript modules to avoid TypeScript declaration issues
const UserService = require('../../src/auth/user-service');
const AuthMiddleware = require('../../src/auth/auth-middleware');
const AuthRoutes = require('../../src/auth/auth-routes');
const AuthModule = require('../../src/auth/index');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../../src/database/prisma-client.js');

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
  });

  describe('UserService Integration', () => {
    it('should create UserService instance', () => {
      expect(UserService).toBeDefined();
      expect(typeof UserService).toBe('function');
    });

    it('should have required methods', () => {
      const userService = new UserService();
      expect(typeof userService.registerUser).toBe('function');
      expect(typeof userService.loginUser).toBe('function');
      expect(typeof userService.getUserProfile).toBe('function');
      expect(typeof userService.initialize).toBe('function');
    });
  });

  describe('AuthMiddleware Integration', () => {
    it('should create AuthMiddleware instance', () => {
      expect(AuthMiddleware).toBeDefined();
      expect(typeof AuthMiddleware).toBe('function');
    });

    it('should have required methods', () => {
      const authMiddleware = new AuthMiddleware();
      expect(typeof authMiddleware.verifyToken).toBe('function');
      expect(typeof authMiddleware.optionalAuth).toBe('function');
      expect(typeof authMiddleware.requireRole).toBe('function');
    });
  });

  describe('AuthRoutes Integration', () => {
    it('should create AuthRoutes instance', () => {
      expect(AuthRoutes).toBeDefined();
      expect(typeof AuthRoutes).toBe('function');
    });

    it('should have required methods', () => {
      const authRoutes = new AuthRoutes();
      expect(typeof authRoutes.getRouter).toBe('function');
    });
  });

  describe('AuthModule Integration', () => {
    it('should export AuthModule class', () => {
      expect(AuthModule).toBeDefined();
      expect(typeof AuthModule).toBe('function');
    });

    it('should create AuthModule instance with required components', () => {
      const authModule = new AuthModule();
      expect(authModule.userService).toBeDefined();
      expect(authModule.authMiddleware).toBeDefined();
      expect(authModule.authRoutes).toBeDefined();
    });
  });
});