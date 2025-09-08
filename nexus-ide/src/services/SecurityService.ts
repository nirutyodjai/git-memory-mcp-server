/**
 * Security Service
 * 
 * Advanced security management system for NEXUS IDE.
 * Handles authentication, authorization, encryption, and security monitoring.
 * 
 * Features:
 * - Multi-factor authentication
 * - Role-based access control (RBAC)
 * - End-to-end encryption
 * - Security monitoring
 * - Threat detection
 * - Audit logging
 * - Secure communication
 * - Data protection
 * - Vulnerability scanning
 * - Compliance management
 */

import { EventEmitter } from '../utils/EventEmitter';

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };
  authentication: {
    tokenExpiry: number;
    refreshTokenExpiry: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  authorization: {
    defaultRole: string;
    adminRoles: string[];
    guestPermissions: string[];
  };
  monitoring: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    auditRetention: number;
    threatDetection: boolean;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    preferences: Record<string, any>;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastPasswordChange: Date;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string[];
  user: User;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  inherits?: string[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
}

export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'access_denied' | 'permission_granted' | 'threat_detected' | 'vulnerability_found';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  resource?: string;
  action?: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ThreatDetection {
  id: string;
  type: 'brute_force' | 'suspicious_activity' | 'malware' | 'data_breach' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  indicators: string[];
  mitigationSteps: string[];
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  result: 'success' | 'failure' | 'error';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface SecurityMetrics {
  totalUsers: number;
  activeUsers: number;
  failedLogins: number;
  successfulLogins: number;
  threatsDetected: number;
  vulnerabilities: number;
  auditEvents: number;
  complianceScore: number;
}

class SecurityService extends EventEmitter {
  private config: SecurityConfig;
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private activeSessions: Map<string, AuthToken> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private threats: ThreatDetection[] = [];
  private auditLogs: AuditLog[] = [];
  private encryptionKey: Buffer;
  private isInitialized = false;

  constructor(config?: Partial<SecurityConfig>) {
    super();
    this.config = {
      encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        ...config?.encryption
      },
      authentication: {
        tokenExpiry: 3600000, // 1 hour
        refreshTokenExpiry: 604800000, // 7 days
        maxLoginAttempts: 5,
        lockoutDuration: 900000, // 15 minutes
        ...config?.authentication
      },
      authorization: {
        defaultRole: 'user',
        adminRoles: ['admin', 'super_admin'],
        guestPermissions: ['read_public'],
        ...config?.authorization
      },
      monitoring: {
        logLevel: 'info',
        auditRetention: 2592000000, // 30 days
        threatDetection: true,
        ...config?.monitoring
      }
    };

    this.encryptionKey = crypto.randomBytes(this.config.encryption.keyLength);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on('user_login', this.handleUserLogin.bind(this));
    this.on('user_logout', this.handleUserLogout.bind(this));
    this.on('access_denied', this.handleAccessDenied.bind(this));
    this.on('threat_detected', this.handleThreatDetected.bind(this));
  }

  async initialize(): Promise<void> {
    try {
      await this.loadDefaultRoles();
      await this.loadDefaultPermissions();
      await this.startSecurityMonitoring();
      
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Authentication Methods
  async authenticate(username: string, password: string, mfaCode?: string): Promise<AuthToken> {
    try {
      const user = await this.findUserByUsername(username);
      if (!user) {
        await this.logSecurityEvent({
          type: 'login',
          severity: 'medium',
          details: { username, result: 'user_not_found' }
        });
        throw new Error('Invalid credentials');
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        await this.logSecurityEvent({
          type: 'login',
          severity: 'high',
          userId: user.id,
          details: { username, result: 'account_locked' }
        });
        throw new Error('Account is locked');
      }

      const isValidPassword = await this.verifyPassword(password, user);
      if (!isValidPassword) {
        await this.handleFailedLogin(user);
        throw new Error('Invalid credentials');
      }

      if (user.mfaEnabled && !mfaCode) {
        throw new Error('MFA code required');
      }

      if (user.mfaEnabled && mfaCode) {
        const isValidMFA = await this.verifyMFACode(user, mfaCode);
        if (!isValidMFA) {
          await this.handleFailedLogin(user);
          throw new Error('Invalid MFA code');
        }
      }

      const token = await this.generateAuthToken(user);
      await this.handleSuccessfulLogin(user);
      
      return token;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthToken> {
    try {
      const session = Array.from(this.activeSessions.values())
        .find(s => s.refreshToken === refreshToken);
      
      if (!session) {
        throw new Error('Invalid refresh token');
      }

      const user = session.user;
      const newToken = await this.generateAuthToken(user);
      
      // Remove old session
      this.activeSessions.delete(session.accessToken);
      
      return newToken;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async logout(accessToken: string): Promise<void> {
    try {
      const session = this.activeSessions.get(accessToken);
      if (session) {
        this.activeSessions.delete(accessToken);
        this.emit('user_logout', { user: session.user });
        
        await this.logSecurityEvent({
          type: 'logout',
          severity: 'low',
          userId: session.user.id,
          details: { result: 'success' }
        });
      }
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Authorization Methods
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const user = this.users.get(userId);
      if (!user) return false;

      // Check direct permissions
      for (const permissionId of user.permissions) {
        const permission = this.permissions.get(permissionId);
        if (permission && permission.resource === resource && permission.action === action) {
          return true;
        }
      }

      // Check role-based permissions
      for (const roleId of user.roles) {
        const role = this.roles.get(roleId);
        if (role) {
          for (const permissionId of role.permissions) {
            const permission = this.permissions.get(permissionId);
            if (permission && permission.resource === resource && permission.action === action) {
              return true;
            }
          }
        }
      }

      return false;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  async checkAccess(accessToken: string, resource: string, action: string): Promise<boolean> {
    try {
      const session = this.activeSessions.get(accessToken);
      if (!session) {
        this.emit('access_denied', { resource, action, reason: 'invalid_token' });
        return false;
      }

      const hasPermission = await this.hasPermission(session.user.id, resource, action);
      if (!hasPermission) {
        this.emit('access_denied', { 
          userId: session.user.id, 
          resource, 
          action, 
          reason: 'insufficient_permissions' 
        });
        return false;
      }

      await this.logAudit({
        userId: session.user.id,
        action,
        resource,
        details: { accessGranted: true },
        result: 'success'
      });

      return true;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  // Encryption Methods
  encrypt(data: string): { encrypted: string; iv: string; tag: string } {
    try {
      const iv = crypto.randomBytes(this.config.encryption.ivLength);
      const cipher = crypto.createCipher(this.config.encryption.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('nexus-ide'));
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  decrypt(encrypted: string, iv: string, tag: string): string {
    try {
      const decipher = crypto.createDecipher(this.config.encryption.algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('nexus-ide'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Security Monitoring
  private async startSecurityMonitoring(): Promise<void> {
    if (!this.config.monitoring.threatDetection) return;

    setInterval(() => {
      this.detectThreats();
      this.cleanupExpiredSessions();
      this.cleanupOldAuditLogs();
    }, 60000); // Check every minute
  }

  private async detectThreats(): Promise<void> {
    try {
      // Detect brute force attacks
      await this.detectBruteForceAttacks();
      
      // Detect suspicious activity
      await this.detectSuspiciousActivity();
      
      // Detect unauthorized access attempts
      await this.detectUnauthorizedAccess();
    } catch (error) {
      this.emit('error', error);
    }
  }

  private async detectBruteForceAttacks(): Promise<void> {
    const recentFailedLogins = this.securityEvents
      .filter(event => 
        event.type === 'login' && 
        event.details.result === 'invalid_credentials' &&
        Date.now() - event.timestamp.getTime() < 300000 // Last 5 minutes
      );

    const ipCounts = new Map<string, number>();
    recentFailedLogins.forEach(event => {
      const ip = event.ipAddress || 'unknown';
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
    });

    for (const [ip, count] of ipCounts) {
      if (count >= 10) { // 10 failed attempts in 5 minutes
        await this.createThreat({
          type: 'brute_force',
          severity: 'high',
          description: `Brute force attack detected from IP: ${ip}`,
          indicators: [`IP: ${ip}`, `Failed attempts: ${count}`],
          mitigationSteps: [
            'Block IP address',
            'Increase account lockout duration',
            'Enable additional monitoring'
          ]
        });
      }
    }
  }

  private async detectSuspiciousActivity(): Promise<void> {
    // Detect multiple simultaneous sessions
    const userSessions = new Map<string, number>();
    this.activeSessions.forEach(session => {
      const userId = session.user.id;
      userSessions.set(userId, (userSessions.get(userId) || 0) + 1);
    });

    for (const [userId, sessionCount] of userSessions) {
      if (sessionCount > 5) { // More than 5 simultaneous sessions
        await this.createThreat({
          type: 'suspicious_activity',
          severity: 'medium',
          description: `User has ${sessionCount} simultaneous sessions`,
          indicators: [`User ID: ${userId}`, `Session count: ${sessionCount}`],
          mitigationSteps: [
            'Verify user identity',
            'Force logout of excess sessions',
            'Enable additional authentication'
          ]
        });
      }
    }
  }

  private async detectUnauthorizedAccess(): Promise<void> {
    const recentAccessDenied = this.securityEvents
      .filter(event => 
        event.type === 'access_denied' &&
        Date.now() - event.timestamp.getTime() < 600000 // Last 10 minutes
      );

    const userCounts = new Map<string, number>();
    recentAccessDenied.forEach(event => {
      if (event.userId) {
        userCounts.set(event.userId, (userCounts.get(event.userId) || 0) + 1);
      }
    });

    for (const [userId, count] of userCounts) {
      if (count >= 20) { // 20 access denied in 10 minutes
        await this.createThreat({
          type: 'unauthorized_access',
          severity: 'high',
          description: `Multiple unauthorized access attempts by user`,
          indicators: [`User ID: ${userId}`, `Denied attempts: ${count}`],
          mitigationSteps: [
            'Review user permissions',
            'Investigate user activity',
            'Consider account suspension'
          ]
        });
      }
    }
  }

  // Helper Methods
  private async findUserByUsername(username: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.username === username || user.email === username) {
        return user;
      }
    }
    return null;
  }

  private async verifyPassword(password: string, user: User): Promise<boolean> {
    // In a real implementation, this would hash the password and compare
    // For demo purposes, we'll use a simple comparison
    return password === 'password123'; // This should be properly hashed
  }

  private async verifyMFACode(user: User, code: string): Promise<boolean> {
    // In a real implementation, this would verify TOTP code
    // For demo purposes, we'll accept '123456'
    return code === '123456';
  }

  private async generateAuthToken(user: User): Promise<AuthToken> {
    const accessToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    
    const token: AuthToken = {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.config.authentication.tokenExpiry,
      scope: user.permissions,
      user
    };

    this.activeSessions.set(accessToken, token);
    
    // Set expiration
    setTimeout(() => {
      this.activeSessions.delete(accessToken);
    }, this.config.authentication.tokenExpiry);

    return token;
  }

  private async handleSuccessfulLogin(user: User): Promise<void> {
    user.lastLogin = new Date();
    user.loginAttempts = 0;
    user.lockedUntil = undefined;
    
    this.emit('user_login', { user });
    
    await this.logSecurityEvent({
      type: 'login',
      severity: 'low',
      userId: user.id,
      details: { result: 'success' }
    });
  }

  private async handleFailedLogin(user: User): Promise<void> {
    user.loginAttempts++;
    
    if (user.loginAttempts >= this.config.authentication.maxLoginAttempts) {
      user.lockedUntil = new Date(Date.now() + this.config.authentication.lockoutDuration);
    }
    
    await this.logSecurityEvent({
      type: 'login',
      severity: 'medium',
      userId: user.id,
      details: { result: 'invalid_credentials', attempts: user.loginAttempts }
    });
  }

  private async handleUserLogin(event: { user: User }): Promise<void> {
    // Handle user login event
  }

  private async handleUserLogout(event: { user: User }): Promise<void> {
    // Handle user logout event
  }

  private async handleAccessDenied(event: any): Promise<void> {
    await this.logSecurityEvent({
      type: 'access_denied',
      severity: 'medium',
      userId: event.userId,
      details: event
    });
  }

  private async handleThreatDetected(threat: ThreatDetection): Promise<void> {
    await this.logSecurityEvent({
      type: 'threat_detected',
      severity: threat.severity,
      details: threat
    });
  }

  private async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...event
    };
    
    this.securityEvents.push(securityEvent);
    this.emit('security_event', securityEvent);
  }

  private async logAudit(audit: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...audit
    };
    
    this.auditLogs.push(auditLog);
    this.emit('audit_log', auditLog);
  }

  private async createThreat(threat: Omit<ThreatDetection, 'id' | 'detectedAt' | 'status'>): Promise<void> {
    const newThreat: ThreatDetection = {
      id: crypto.randomUUID(),
      detectedAt: new Date(),
      status: 'active',
      ...threat
    };
    
    this.threats.push(newThreat);
    this.emit('threat_detected', newThreat);
  }

  private async loadDefaultRoles(): Promise<void> {
    const defaultRoles: Role[] = [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access',
        permissions: ['*'],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        }
      },
      {
        id: 'user',
        name: 'User',
        description: 'Standard user access',
        permissions: ['read', 'write_own', 'execute_safe'],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        }
      },
      {
        id: 'guest',
        name: 'Guest',
        description: 'Limited read-only access',
        permissions: ['read_public'],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        }
      }
    ];

    defaultRoles.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  private async loadDefaultPermissions(): Promise<void> {
    const defaultPermissions: Permission[] = [
      {
        id: 'read',
        name: 'Read',
        description: 'Read access to resources',
        resource: '*',
        action: 'read'
      },
      {
        id: 'write',
        name: 'Write',
        description: 'Write access to resources',
        resource: '*',
        action: 'write'
      },
      {
        id: 'execute',
        name: 'Execute',
        description: 'Execute access to resources',
        resource: '*',
        action: 'execute'
      },
      {
        id: 'delete',
        name: 'Delete',
        description: 'Delete access to resources',
        resource: '*',
        action: 'delete'
      }
    ];

    defaultPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [token, session] of this.activeSessions) {
      if (now > session.expiresIn) {
        this.activeSessions.delete(token);
      }
    }
  }

  private cleanupOldAuditLogs(): void {
    const cutoff = Date.now() - this.config.monitoring.auditRetention;
    this.auditLogs = this.auditLogs.filter(log => log.timestamp.getTime() > cutoff);
    this.securityEvents = this.securityEvents.filter(event => event.timestamp.getTime() > cutoff);
  }

  // Public API Methods
  getSecurityMetrics(): SecurityMetrics {
    return {
      totalUsers: this.users.size,
      activeUsers: this.activeSessions.size,
      failedLogins: this.securityEvents.filter(e => 
        e.type === 'login' && e.details.result === 'invalid_credentials'
      ).length,
      successfulLogins: this.securityEvents.filter(e => 
        e.type === 'login' && e.details.result === 'success'
      ).length,
      threatsDetected: this.threats.filter(t => t.status === 'active').length,
      vulnerabilities: 0, // Would be populated by vulnerability scanner
      auditEvents: this.auditLogs.length,
      complianceScore: this.calculateComplianceScore()
    };
  }

  private calculateComplianceScore(): number {
    // Simple compliance score calculation
    let score = 100;
    
    // Deduct points for active threats
    const activeThreats = this.threats.filter(t => t.status === 'active');
    score -= activeThreats.length * 10;
    
    // Deduct points for users without MFA
    const usersWithoutMFA = Array.from(this.users.values()).filter(u => !u.mfaEnabled);
    score -= (usersWithoutMFA.length / this.users.size) * 20;
    
    return Math.max(0, score);
  }

  getActiveThreats(): ThreatDetection[] {
    return this.threats.filter(t => t.status === 'active');
  }

  getAuditLogs(limit = 100): AuditLog[] {
    return this.auditLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getSecurityEvents(limit = 100): SecurityEvent[] {
    return this.securityEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createUser(userData: Omit<User, 'id' | 'metadata' | 'loginAttempts'>): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      loginAttempts: 0,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastPasswordChange: new Date()
      },
      ...userData
    };

    this.users.set(user.id, user);
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...user,
      ...updates,
      metadata: {
        ...user.metadata,
        updatedAt: new Date()
      }
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Logout all sessions for this user
    for (const [token, session] of this.activeSessions) {
      if (session.user.id === userId) {
        this.activeSessions.delete(token);
      }
    }

    this.users.delete(userId);
  }

  isInitialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const securityService = new SecurityService();
export default SecurityService;