// =============================================================================
// ENTERPRISE SECURITY DASHBOARD - COMPREHENSIVE TEST SUITE
// Testing Security Features, API Endpoints, and System Integration
// =============================================================================

const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const WebSocket = require('ws');
const Redis = require('ioredis');
const { Pool } = require('pg');

// Import modules to test
const app = require('../server');
const { 
  encryptionUtils, 
  passwordUtils, 
  tokenUtils, 
  mfaUtils,
  validationUtils,
  rateLimitUtils,
  securityHeaders
} = require('../utils/security');
const { databaseManager } = require('../utils/database');
const WebSocketManager = require('../routes/websocket');

// Test configuration
const TEST_CONFIG = {
  jwt: {
    secret: 'test-secret-key-for-testing-only',
    expiresIn: '1h'
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32
  },
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 100
  },
  database: {
    host: 'localhost',
    port: 5432,
    database: 'security_dashboard_test',
    username: 'test_user',
    password: 'test_password'
  }
};

// Mock data
const MOCK_USER = {
  id: 'test-user-123',
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPassword123!',
  role: 'admin',
  permissions: ['read', 'write', 'admin'],
  mfaEnabled: true,
  mfaSecret: 'JBSWY3DPEHPK3PXP'
};

const MOCK_THREAT = {
  id: 'threat-456',
  type: 'brute_force',
  severity: 'high',
  sourceIp: '192.168.1.100',
  targetResource: '/api/auth/login',
  timestamp: new Date().toISOString(),
  details: {
    attempts: 15,
    timeWindow: '5m',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

// =============================================================================
// SECURITY UTILITIES TESTS
// =============================================================================

describe('🔐 Security Utilities', () => {
  
  describe('EncryptionUtils', () => {
    let testData;
    
    beforeEach(() => {
      testData = 'sensitive-test-data-12345';
    });
    
    it('should encrypt and decrypt data correctly', () => {
      const encrypted = encryptionUtils.encrypt(testData);
      expect(encrypted).to.be.an('object');
      expect(encrypted).to.have.property('encryptedData');
      expect(encrypted).to.have.property('iv');
      expect(encrypted).to.have.property('tag');
      
      const decrypted = encryptionUtils.decrypt(encrypted);
      expect(decrypted).to.equal(testData);
    });
    
    it('should generate secure random keys', () => {
      const key1 = encryptionUtils.generateKey();
      const key2 = encryptionUtils.generateKey();
      
      expect(key1).to.be.a('string');
      expect(key2).to.be.a('string');
      expect(key1).to.not.equal(key2);
      expect(key1.length).to.equal(64); // 32 bytes = 64 hex chars
    });
    
    it('should handle encryption errors gracefully', () => {
      expect(() => encryptionUtils.encrypt(null)).to.throw();
      expect(() => encryptionUtils.decrypt({ invalid: 'data' })).to.throw();
    });
  });
  
  describe('PasswordUtils', () => {
    const testPassword = 'TestPassword123!';
    
    it('should hash passwords securely', async () => {
      const hash = await passwordUtils.hashPassword(testPassword);
      expect(hash).to.be.a('string');
      expect(hash).to.not.equal(testPassword);
      expect(hash.length).to.be.greaterThan(50);
    });
    
    it('should verify passwords correctly', async () => {
      const hash = await passwordUtils.hashPassword(testPassword);
      const isValid = await passwordUtils.verifyPassword(testPassword, hash);
      const isInvalid = await passwordUtils.verifyPassword('wrongpassword', hash);
      
      expect(isValid).to.be.true;
      expect(isInvalid).to.be.false;
    });
    
    it('should validate password strength', () => {
      const strongPassword = 'StrongP@ssw0rd123!';
      const weakPassword = 'weak';
      
      const strongResult = passwordUtils.validateStrength(strongPassword);
      const weakResult = passwordUtils.validateStrength(weakPassword);
      
      expect(strongResult.isValid).to.be.true;
      expect(strongResult.score).to.be.greaterThan(3);
      expect(weakResult.isValid).to.be.false;
      expect(weakResult.score).to.be.lessThan(2);
    });
    
    it('should generate secure passwords', () => {
      const password = passwordUtils.generateSecurePassword();
      expect(password).to.be.a('string');
      expect(password.length).to.be.greaterThan(12);
      
      const validation = passwordUtils.validateStrength(password);
      expect(validation.isValid).to.be.true;
    });
  });
  
  describe('TokenUtils', () => {
    it('should generate and verify JWT tokens', () => {
      const payload = { userId: MOCK_USER.id, role: MOCK_USER.role };
      const token = tokenUtils.generateToken(payload);
      
      expect(token).to.be.a('string');
      expect(token.split('.')).to.have.length(3);
      
      const decoded = tokenUtils.verifyToken(token);
      expect(decoded.userId).to.equal(payload.userId);
      expect(decoded.role).to.equal(payload.role);
    });
    
    it('should handle token expiration', (done) => {
      const payload = { userId: MOCK_USER.id };
      const shortToken = tokenUtils.generateToken(payload, '1ms');
      
      setTimeout(() => {
        expect(() => tokenUtils.verifyToken(shortToken)).to.throw();
        done();
      }, 10);
    });
    
    it('should generate secure refresh tokens', () => {
      const refreshToken = tokenUtils.generateRefreshToken();
      expect(refreshToken).to.be.a('string');
      expect(refreshToken.length).to.equal(64);
    });
  });
  
  describe('MFAUtils', () => {
    it('should generate MFA secrets', () => {
      const secret = mfaUtils.generateSecret();
      expect(secret).to.be.an('object');
      expect(secret).to.have.property('secret');
      expect(secret).to.have.property('qrCode');
      expect(secret).to.have.property('backupCodes');
    });
    
    it('should verify TOTP codes', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = mfaUtils.generateToken(secret);
      
      expect(token).to.be.a('string');
      expect(token.length).to.equal(6);
      
      const isValid = mfaUtils.verifyToken(token, secret);
      expect(isValid).to.be.true;
    });
    
    it('should handle backup codes', () => {
      const codes = mfaUtils.generateBackupCodes();
      expect(codes).to.be.an('array');
      expect(codes).to.have.length(10);
      
      codes.forEach(code => {
        expect(code).to.be.a('string');
        expect(code.length).to.equal(8);
      });
    });
  });
});

// =============================================================================
// API ENDPOINT TESTS
// =============================================================================

describe('🌐 API Endpoints', () => {
  let authToken;
  let testUser;
  
  before(async () => {
    // Setup test user and authentication
    testUser = { ...MOCK_USER };
    testUser.password = await passwordUtils.hashPassword(testUser.password);
    
    // Generate auth token
    authToken = tokenUtils.generateToken({
      userId: testUser.id,
      role: testUser.role,
      permissions: testUser.permissions
    });
  });
  
  describe('Authentication Endpoints', () => {
    it('POST /api/auth/login - should authenticate valid users', (done) => {
      request(app)
        .post('/api/auth/login')
        .send({
          username: MOCK_USER.username,
          password: MOCK_USER.password
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('token');
          expect(res.body).to.have.property('user');
          expect(res.body.user).to.not.have.property('password');
          
          done();
        });
    });
    
    it('POST /api/auth/login - should reject invalid credentials', (done) => {
      request(app)
        .post('/api/auth/login')
        .send({
          username: MOCK_USER.username,
          password: 'wrongpassword'
        })
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
          
          done();
        });
    });
    
    it('POST /api/auth/mfa/verify - should verify MFA tokens', (done) => {
      const mfaToken = mfaUtils.generateToken(MOCK_USER.mfaSecret);
      
      request(app)
        .post('/api/auth/mfa/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ token: mfaToken })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('verified', true);
          
          done();
        });
    });
  });
  
  describe('Security Monitoring Endpoints', () => {
    it('GET /api/security/threats - should return threat data', (done) => {
      request(app)
        .get('/api/security/threats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.be.an('array');
          
          done();
        });
    });
    
    it('POST /api/security/incidents - should create security incidents', (done) => {
      const incident = {
        type: 'suspicious_activity',
        severity: 'medium',
        description: 'Test security incident',
        sourceIp: '192.168.1.100'
      };
      
      request(app)
        .post('/api/security/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incident)
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('incident');
          expect(res.body.incident).to.have.property('id');
          
          done();
        });
    });
    
    it('GET /api/security/audit-logs - should return audit logs', (done) => {
      request(app)
        .get('/api/security/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('logs');
          expect(res.body.logs).to.be.an('array');
          
          done();
        });
    });
  });
  
  describe('System Health Endpoints', () => {
    it('GET /api/system/health - should return system health', (done) => {
      request(app)
        .get('/api/system/health')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('status');
          expect(res.body).to.have.property('timestamp');
          expect(res.body).to.have.property('services');
          
          done();
        });
    });
    
    it('GET /api/system/metrics - should return system metrics', (done) => {
      request(app)
        .get('/api/system/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('metrics');
          
          done();
        });
    });
  });
});

// =============================================================================
// WEBSOCKET TESTS
// =============================================================================

describe('🔌 WebSocket Communication', () => {
  let wsServer;
  let wsClient;
  
  before((done) => {
    wsServer = new WebSocketManager({ port: 8081 });
    wsServer.initialize().then(() => {
      done();
    }).catch(done);
  });
  
  after((done) => {
    if (wsClient) {
      wsClient.close();
    }
    wsServer.shutdown().then(() => {
      done();
    }).catch(done);
  });
  
  it('should establish WebSocket connections', (done) => {
    wsClient = new WebSocket('ws://localhost:8081');
    
    wsClient.on('open', () => {
      expect(wsClient.readyState).to.equal(WebSocket.OPEN);
      done();
    });
    
    wsClient.on('error', done);
  });
  
  it('should handle authentication messages', (done) => {
    wsClient = new WebSocket('ws://localhost:8081');
    
    wsClient.on('open', () => {
      const authMessage = {
        type: 'auth',
        token: authToken
      };
      
      wsClient.send(JSON.stringify(authMessage));
    });
    
    wsClient.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'auth_response') {
        expect(message.success).to.be.true;
        done();
      }
    });
    
    wsClient.on('error', done);
  });
  
  it('should broadcast security alerts', (done) => {
    wsClient = new WebSocket('ws://localhost:8081');
    
    wsClient.on('open', () => {
      // Authenticate first
      wsClient.send(JSON.stringify({
        type: 'auth',
        token: authToken
      }));
    });
    
    wsClient.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'security_alert') {
        expect(message).to.have.property('alert');
        expect(message.alert).to.have.property('type');
        expect(message.alert).to.have.property('severity');
        done();
      } else if (message.type === 'auth_response' && message.success) {
        // Simulate security alert
        wsServer.broadcastSecurityAlert(MOCK_THREAT);
      }
    });
    
    wsClient.on('error', done);
  });
});

// =============================================================================
// DATABASE INTEGRATION TESTS
// =============================================================================

describe('🗄️ Database Integration', () => {
  let dbManager;
  
  before(async () => {
    dbManager = databaseManager;
    await dbManager.initialize(TEST_CONFIG.database);
  });
  
  after(async () => {
    await dbManager.shutdown();
  });
  
  describe('PostgreSQL Operations', () => {
    it('should connect to PostgreSQL', async () => {
      const isHealthy = await dbManager.postgres.healthCheck();
      expect(isHealthy).to.be.true;
    });
    
    it('should execute queries safely', async () => {
      const result = await dbManager.postgres.query(
        'SELECT $1 as test_value',
        ['test_data']
      );
      
      expect(result.rows).to.have.length(1);
      expect(result.rows[0].test_value).to.equal('test_data');
    });
    
    it('should handle transactions', async () => {
      const client = await dbManager.postgres.getClient();
      
      try {
        await client.query('BEGIN');
        
        const result = await client.query(
          'SELECT $1 as transaction_test',
          ['test_transaction']
        );
        
        await client.query('COMMIT');
        
        expect(result.rows[0].transaction_test).to.equal('test_transaction');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });
  
  describe('Redis Operations', () => {
    it('should connect to Redis', async () => {
      const isHealthy = await dbManager.redis.healthCheck();
      expect(isHealthy).to.be.true;
    });
    
    it('should set and get values', async () => {
      const key = 'test:key';
      const value = 'test_value';
      
      await dbManager.redis.set(key, value);
      const retrieved = await dbManager.redis.get(key);
      
      expect(retrieved).to.equal(value);
      
      // Cleanup
      await dbManager.redis.del(key);
    });
    
    it('should handle pub/sub operations', (done) => {
      const channel = 'test:channel';
      const message = 'test_message';
      
      dbManager.redis.subscribe(channel, (receivedMessage) => {
        expect(receivedMessage).to.equal(message);
        done();
      });
      
      setTimeout(() => {
        dbManager.redis.publish(channel, message);
      }, 100);
    });
  });
});

// =============================================================================
// SECURITY VULNERABILITY TESTS
// =============================================================================

describe('🛡️ Security Vulnerability Tests', () => {
  
  describe('SQL Injection Protection', () => {
    it('should prevent SQL injection in login', (done) => {
      const maliciousInput = "admin'; DROP TABLE users; --";
      
      request(app)
        .post('/api/auth/login')
        .send({
          username: maliciousInput,
          password: 'password'
        })
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', false);
          done();
        });
    });
  });
  
  describe('XSS Protection', () => {
    it('should sanitize user input', (done) => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      request(app)
        .post('/api/security/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'test',
          description: xssPayload
        })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body.incident.description).to.not.include('<script>');
          done();
        });
    });
  });
  
  describe('Rate Limiting', () => {
    it('should enforce rate limits', function(done) {
      this.timeout(10000);
      
      const requests = [];
      const maxRequests = 105; // Exceed the limit
      
      for (let i = 0; i < maxRequests; i++) {
        requests.push(
          request(app)
            .get('/api/system/health')
            .expect((res) => {
              if (i >= 100) {
                expect(res.status).to.equal(429);
              }
            })
        );
      }
      
      Promise.all(requests).then(() => done()).catch(done);
    });
  });
  
  describe('CSRF Protection', () => {
    it('should require CSRF tokens for state-changing operations', (done) => {
      request(app)
        .post('/api/security/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        // Missing CSRF token
        .send({
          type: 'test',
          description: 'Test incident'
        })
        .expect(403)
        .end(done);
    });
  });
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

describe('⚡ Performance Tests', () => {
  
  it('should handle concurrent requests efficiently', function(done) {
    this.timeout(15000);
    
    const concurrentRequests = 50;
    const requests = [];
    
    const startTime = Date.now();
    
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(
        request(app)
          .get('/api/system/health')
          .expect(200)
      );
    }
    
    Promise.all(requests).then(() => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).to.be.lessThan(5000);
      done();
    }).catch(done);
  });
  
  it('should maintain low memory usage', () => {
    const initialMemory = process.memoryUsage();
    
    // Simulate some operations
    for (let i = 0; i < 1000; i++) {
      const data = encryptionUtils.encrypt(`test-data-${i}`);
      encryptionUtils.decrypt(data);
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).to.be.lessThan(50 * 1024 * 1024);
  });
});

// =============================================================================
// CLEANUP AND TEARDOWN
// =============================================================================

after(async () => {
  // Cleanup test data
  console.log('🧹 Cleaning up test environment...');
  
  // Close database connections
  if (databaseManager) {
    await databaseManager.shutdown();
  }
  
  // Clear any test files or temporary data
  // Additional cleanup as needed
  
  console.log('✅ Test cleanup completed');
});

// =============================================================================
// END OF TEST SUITE
// =============================================================================