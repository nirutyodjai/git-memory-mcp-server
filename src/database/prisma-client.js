// Mock Prisma Client for testing
class MockPrismaClient {
  constructor() {
    this.user = {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    
    this.session = {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
  }

  async $connect() {
    return Promise.resolve();
  }

  async $disconnect() {
    return Promise.resolve();
  }
}

// Export mock client for testing
if (process.env.NODE_ENV === 'test') {
  module.exports = { PrismaClient: MockPrismaClient };
} else {
  // In production, use real Prisma Client
  const { PrismaClient } = require('@prisma/client');
  module.exports = { PrismaClient };
}