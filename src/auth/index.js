/**
 * Authentication Module
 * Main entry point for authentication system
 */

const UserService = require('./user-service');
const AuthMiddleware = require('./auth-middleware');
const AuthRoutes = require('./auth-routes');

class AuthModule {
  constructor() {
    this.userService = new UserService();
    this.authMiddleware = new AuthMiddleware();
    this.authRoutes = new AuthRoutes();
  }

  /**
   * Initialize authentication module
   */
  async initialize() {
    try {
      // Initialize user service
      await this.userService.initialize();
      
      // Create admin user if not exists
      await this.createDefaultAdmin();
      
      console.log('✅ Authentication module initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize authentication module:', error);
      throw error;
    }
  }

  /**
   * Create default admin user
   */
  async createDefaultAdmin() {
    try {
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      
      // Check if admin user already exists
      const existingAdmin = await this.userService.prisma.user.findFirst({
        where: {
          OR: [
            { username: adminUsername },
            { role: 'ADMIN' }
          ]
        }
      });

      if (!existingAdmin) {
        await this.userService.registerUser({
          username: adminUsername,
          email: 'admin@git-memory-mcp.com',
          password: adminPassword,
          firstName: 'System',
          lastName: 'Administrator',
          role: 'ADMIN'
        });
        
        console.log(`✅ Default admin user created: ${adminUsername}`);
        console.log(`⚠️  Please change the default password after first login`);
      } else {
        console.log('ℹ️  Admin user already exists');
      }
    } catch (error) {
      console.error('❌ Failed to create default admin user:', error);
      // Don't throw error here, as this is not critical for system startup
    }
  }

  /**
   * Get authentication routes
   */
  getRoutes() {
    return this.authRoutes.getRouter();
  }

  /**
   * Get authentication middleware
   */
  getMiddleware() {
    return this.authMiddleware;
  }

  /**
   * Get user service
   */
  getUserService() {
    return this.userService;
  }

  /**
   * Close all connections
   */
  async close() {
    try {
      await this.authRoutes.close();
      await this.userService.disconnect();
      await this.authMiddleware.disconnect();
      console.log('✅ Authentication module closed successfully');
    } catch (error) {
      console.error('❌ Error closing authentication module:', error);
    }
  }

  /**
   * Health check for authentication module
   */
  async healthCheck() {
    try {
      // Test database connection
      await this.userService.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        components: {
          database: 'connected',
          userService: 'active',
          authMiddleware: 'active',
          authRoutes: 'active'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        components: {
          database: 'disconnected',
          userService: 'error',
          authMiddleware: 'unknown',
          authRoutes: 'unknown'
        }
      };
    }
  }
}

module.exports = AuthModule;