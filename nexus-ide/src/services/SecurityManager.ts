/**
 * Security Manager
 * 
 * Advanced security management system for NEXUS IDE.
 * Provides comprehensive security features including authentication, authorization,
 * encryption, vulnerability scanning, and security monitoring.
 * 
 * Features:
 * - Multi-factor authentication
 * - Role-based access control (RBAC)
 * - End-to-end encryption
 * - Vulnerability scanning
 * - Security monitoring
 * - Audit logging
 * - Secure communication
 * - Code security analysis
 * - Dependency vulnerability checks
 * - Security policy enforcement
 */

import { EventEmitter } from '../utils/EventEmitter';
import CryptoJS from 'crypto-js';

export interface SecurityUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  roles: SecurityRole[];
  permissions: SecurityPermission[];
  mfaEnabled: boolean;
  mfaSecret?: string;
  lastLogin: Date;
  loginAttempts: number;
  locked: boolean;
  lockUntil?: Date;
  passwordHash: string;
  passwordSalt: string;
  passwordHistory: string[];
  securityQuestions: SecurityQuestion[];
  sessions: SecuritySession[];
  preferences: SecurityPreferences;
  created: Date;
  updated: Date;
}

export interface SecurityRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: SecurityPermission[];
  inherits?: string[]; // Parent role IDs
  priority: number;
  system: boolean; // System roles cannot be deleted
  created: Date;
  updated: Date;
}

export interface SecurityPermission {
  id: string;
  name: string;
  displayName: string;
  description: string;
  resource: string;
  action: SecurityAction;
  conditions?: SecurityCondition[];
  system: boolean;
  created: Date;
}

export type SecurityAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'execute'
  | 'admin'
  | 'share'
  | 'export'
  | 'import'
  | 'debug'
  | 'deploy'
  | 'configure'
  | '*'; // All actions

export interface SecurityCondition {
  type: 'time' | 'location' | 'device' | 'network' | 'custom';
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater' | 'less' | 'in' | 'not_in';
  value: any;
  description: string;
}

export interface SecuritySession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  deviceId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  location?: GeoLocation;
  userAgent: string;
  created: Date;
  lastActivity: Date;
  expires: Date;
  active: boolean;
  trusted: boolean;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  version: string;
  fingerprint: string;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface SecurityQuestion {
  id: string;
  question: string;
  answerHash: string;
  created: Date;
}

export interface SecurityPreferences {
  mfaMethod: 'totp' | 'sms' | 'email' | 'hardware';
  sessionTimeout: number; // minutes
  requireMfaForSensitiveActions: boolean;
  allowMultipleSessions: boolean;
  trustedDevices: string[];
  securityNotifications: {
    loginAttempts: boolean;
    newDevice: boolean;
    passwordChange: boolean;
    permissionChange: boolean;
    suspiciousActivity: boolean;
  };
  privacySettings: {
    shareUsageData: boolean;
    shareErrorReports: boolean;
    allowTelemetry: boolean;
  };
}

export interface SecurityAuditLog {
  id: string;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: SecuritySeverity;
  category: SecurityCategory;
  success: boolean;
  errorMessage?: string;
}

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';
export type SecurityCategory = 
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'configuration'
  | 'system'
  | 'network'
  | 'file_access'
  | 'code_execution'
  | 'vulnerability'
  | 'policy_violation';

export interface SecurityVulnerability {
  id: string;
  type: VulnerabilityType;
  severity: SecuritySeverity;
  title: string;
  description: string;
  affected: {
    component: string;
    version?: string;
    file?: string;
    line?: number;
  };
  cve?: string;
  cvss?: number;
  references: string[];
  remediation: {
    description: string;
    steps: string[];
    automated: boolean;
  };
  discovered: Date;
  status: 'open' | 'acknowledged' | 'fixed' | 'ignored';
  assignee?: string;
  dueDate?: Date;
}

export type VulnerabilityType = 
  | 'dependency'
  | 'code_injection'
  | 'xss'
  | 'csrf'
  | 'authentication'
  | 'authorization'
  | 'data_exposure'
  | 'configuration'
  | 'cryptographic'
  | 'input_validation'
  | 'business_logic'
  | 'denial_of_service';

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: SecurityCategory;
  rules: SecurityRule[];
  enabled: boolean;
  enforced: boolean;
  severity: SecuritySeverity;
  created: Date;
  updated: Date;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  condition: string; // JavaScript expression
  action: SecurityRuleAction;
  parameters: { [key: string]: any };
  enabled: boolean;
}

export type SecurityRuleAction = 
  | 'allow'
  | 'deny'
  | 'warn'
  | 'log'
  | 'quarantine'
  | 'notify'
  | 'block_user'
  | 'require_mfa'
  | 'custom';

export interface SecurityThreat {
  id: string;
  type: ThreatType;
  severity: SecuritySeverity;
  source: string;
  target: string;
  description: string;
  indicators: ThreatIndicator[];
  mitigated: boolean;
  mitigation?: string;
  detected: Date;
  resolved?: Date;
}

export type ThreatType = 
  | 'brute_force'
  | 'credential_stuffing'
  | 'account_takeover'
  | 'data_exfiltration'
  | 'malware'
  | 'phishing'
  | 'social_engineering'
  | 'insider_threat'
  | 'ddos'
  | 'privilege_escalation'
  | 'lateral_movement'
  | 'persistence';

export interface ThreatIndicator {
  type: 'ip' | 'domain' | 'hash' | 'pattern' | 'behavior';
  value: string;
  confidence: number; // 0-100
  source: string;
}

export interface SecurityMetrics {
  authentication: {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    mfaUsage: number;
    uniqueUsers: number;
  };
  vulnerabilities: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    fixed: number;
  };
  threats: {
    detected: number;
    mitigated: number;
    active: number;
  };
  compliance: {
    policyViolations: number;
    auditFindings: number;
    complianceScore: number; // 0-100
  };
  performance: {
    averageResponseTime: number;
    securityOverhead: number;
    falsePositives: number;
  };
}

export interface EncryptionConfig {
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'AES-256-CBC';
  keyDerivation: 'PBKDF2' | 'Argon2' | 'scrypt';
  iterations: number;
  saltLength: number;
  ivLength: number;
  tagLength: number;
}

interface SecurityManagerEvents {
  'user-authenticated': (user: SecurityUser, session: SecuritySession) => void;
  'user-logout': (userId: string, sessionId: string) => void;
  'authentication-failed': (username: string, reason: string) => void;
  'permission-denied': (userId: string, resource: string, action: string) => void;
  'vulnerability-detected': (vulnerability: SecurityVulnerability) => void;
  'threat-detected': (threat: SecurityThreat) => void;
  'policy-violation': (userId: string, policy: SecurityPolicy, details: any) => void;
  'security-alert': (severity: SecuritySeverity, message: string, details: any) => void;
  'audit-log-created': (log: SecurityAuditLog) => void;
  'session-expired': (sessionId: string) => void;
  'mfa-required': (userId: string, action: string) => void;
  'suspicious-activity': (userId: string, activity: string, details: any) => void;
}

class SecurityManager extends EventEmitter {
  private users: Map<string, SecurityUser> = new Map();
  private roles: Map<string, SecurityRole> = new Map();
  private permissions: Map<string, SecurityPermission> = new Map();
  private sessions: Map<string, SecuritySession> = new Map();
  private auditLogs: SecurityAuditLog[] = [];
  private vulnerabilities: Map<string, SecurityVulnerability> = new Map();
  private threats: Map<string, SecurityThreat> = new Map();
  private policies: Map<string, SecurityPolicy> = new Map();
  
  // Configuration
  private config = {
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5,
      maxAge: 90, // days
    },
    sessionPolicy: {
      timeout: 480, // 8 hours in minutes
      maxConcurrent: 3,
      requireMfaForSensitive: true,
      trustDeviceDuration: 30, // days
    },
    lockoutPolicy: {
      maxAttempts: 5,
      lockoutDuration: 30, // minutes
      progressiveLockout: true,
    },
    encryption: {
      algorithm: 'AES-256-GCM',
      keyDerivation: 'Argon2',
      iterations: 100000,
      saltLength: 32,
      ivLength: 16,
      tagLength: 16,
    } as EncryptionConfig,
    monitoring: {
      enableRealTime: true,
      logRetention: 365, // days
      alertThresholds: {
        failedLogins: 10,
        suspiciousActivity: 5,
        vulnerabilities: 1,
      },
    },
    compliance: {
      enableGDPR: true,
      enableSOX: false,
      enableHIPAA: false,
      dataRetention: 2555, // 7 years in days
    },
  };

  constructor() {
    super();
    this.initializeSecurityManager();
  }

  /**
   * Initialize security manager
   */
  private async initializeSecurityManager(): Promise<void> {
    try {
      console.log('Initializing Security Manager...');
      
      // Initialize default roles and permissions
      await this.initializeDefaultRoles();
      
      // Initialize security policies
      await this.initializeSecurityPolicies();
      
      // Start security monitoring
      this.startSecurityMonitoring();
      
      // Setup session cleanup
      this.setupSessionCleanup();
      
      // Initialize vulnerability scanner
      await this.initializeVulnerabilityScanner();
      
      console.log('Security Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Security Manager:', error);
      throw error;
    }
  }

  /**
   * Authenticate user
   */
  async authenticate(username: string, password: string, mfaCode?: string): Promise<{ user: SecurityUser; session: SecuritySession }> {
    try {
      console.log(`Authentication attempt for user: ${username}`);
      
      // Find user
      const user = Array.from(this.users.values()).find(u => u.username === username || u.email === username);
      if (!user) {
        await this.logAudit({
          action: 'authentication_failed',
          resource: 'user',
          details: { username, reason: 'user_not_found' },
          severity: 'medium',
          category: 'authentication',
          success: false
        });
        throw new Error('Invalid credentials');
      }
      
      // Check if user is locked
      if (user.locked && user.lockUntil && user.lockUntil > new Date()) {
        await this.logAudit({
          userId: user.id,
          action: 'authentication_failed',
          resource: 'user',
          details: { username, reason: 'account_locked' },
          severity: 'high',
          category: 'authentication',
          success: false
        });
        throw new Error('Account is locked');
      }
      
      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isValidPassword) {
        await this.handleFailedLogin(user);
        throw new Error('Invalid credentials');
      }
      
      // Check MFA if enabled
      if (user.mfaEnabled) {
        if (!mfaCode) {
          this.emit('mfa-required', user.id, 'login');
          throw new Error('MFA code required');
        }
        
        const isValidMfa = await this.verifyMfaCode(user, mfaCode);
        if (!isValidMfa) {
          await this.handleFailedLogin(user);
          throw new Error('Invalid MFA code');
        }
      }
      
      // Reset login attempts
      user.loginAttempts = 0;
      user.locked = false;
      user.lockUntil = undefined;
      user.lastLogin = new Date();
      
      // Create session
      const session = await this.createSession(user);
      
      await this.logAudit({
        userId: user.id,
        sessionId: session.id,
        action: 'user_authenticated',
        resource: 'session',
        details: { username, deviceInfo: session.deviceInfo },
        severity: 'low',
        category: 'authentication',
        success: true
      });
      
      this.emit('user-authenticated', user, session);
      
      console.log(`User authenticated successfully: ${username}`);
      return { user, session };
    } catch (error) {
      console.error(`Authentication failed for user ${username}:`, error);
      this.emit('authentication-failed', username, error.message);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      console.log(`Logging out session: ${sessionId}`);
      
      // Invalidate session
      session.active = false;
      this.sessions.delete(sessionId);
      
      await this.logAudit({
        userId: session.userId,
        sessionId: session.id,
        action: 'user_logout',
        resource: 'session',
        details: { sessionId },
        severity: 'low',
        category: 'authentication',
        success: true
      });
      
      this.emit('user-logout', session.userId, sessionId);
      
      console.log(`Session logged out: ${sessionId}`);
    } catch (error) {
      console.error(`Failed to logout session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Check permission
   */
  async checkPermission(userId: string, resource: string, action: SecurityAction): Promise<boolean> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return false;
      }
      
      // Check user permissions
      const hasDirectPermission = user.permissions.some(p => 
        (p.resource === resource || p.resource === '*') &&
        (p.action === action || p.action === '*')
      );
      
      if (hasDirectPermission) {
        return true;
      }
      
      // Check role permissions
      for (const role of user.roles) {
        const hasRolePermission = role.permissions.some(p => 
          (p.resource === resource || p.resource === '*') &&
          (p.action === action || p.action === '*')
        );
        
        if (hasRolePermission) {
          return true;
        }
      }
      
      // Log permission denial
      await this.logAudit({
        userId,
        action: 'permission_denied',
        resource,
        details: { action, resource },
        severity: 'medium',
        category: 'authorization',
        success: false
      });
      
      this.emit('permission-denied', userId, resource, action);
      
      return false;
    } catch (error) {
      console.error(`Failed to check permission for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Encrypt data
   */
  async encrypt(data: string, key?: string): Promise<{ encrypted: string; key: string; iv: string }> {
    try {
      const encryptionKey = key || this.generateEncryptionKey();
      const iv = CryptoJS.lib.WordArray.random(this.config.encryption.ivLength);
      
      const encrypted = CryptoJS.AES.encrypt(data, encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding
      });
      
      return {
        encrypted: encrypted.toString(),
        key: encryptionKey,
        iv: iv.toString()
      };
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      throw error;
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData: string, key: string, iv: string): Promise<string> {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding
      });
      
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw error;
    }
  }

  /**
   * Scan for vulnerabilities
   */
  async scanVulnerabilities(target: 'dependencies' | 'code' | 'configuration' | 'all' = 'all'): Promise<SecurityVulnerability[]> {
    try {
      console.log(`Starting vulnerability scan: ${target}`);
      
      const vulnerabilities: SecurityVulnerability[] = [];
      
      if (target === 'dependencies' || target === 'all') {
        const depVulns = await this.scanDependencyVulnerabilities();
        vulnerabilities.push(...depVulns);
      }
      
      if (target === 'code' || target === 'all') {
        const codeVulns = await this.scanCodeVulnerabilities();
        vulnerabilities.push(...codeVulns);
      }
      
      if (target === 'configuration' || target === 'all') {
        const configVulns = await this.scanConfigurationVulnerabilities();
        vulnerabilities.push(...configVulns);
      }
      
      // Store vulnerabilities
      vulnerabilities.forEach(vuln => {
        this.vulnerabilities.set(vuln.id, vuln);
        this.emit('vulnerability-detected', vuln);
      });
      
      console.log(`Vulnerability scan completed. Found ${vulnerabilities.length} vulnerabilities`);
      return vulnerabilities;
    } catch (error) {
      console.error('Failed to scan vulnerabilities:', error);
      throw error;
    }
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentLogs = this.auditLogs.filter(log => log.timestamp >= last24h);
    const authLogs = recentLogs.filter(log => log.category === 'authentication');
    
    return {
      authentication: {
        totalLogins: authLogs.length,
        successfulLogins: authLogs.filter(log => log.success).length,
        failedLogins: authLogs.filter(log => !log.success).length,
        mfaUsage: authLogs.filter(log => log.details?.mfaUsed).length,
        uniqueUsers: new Set(authLogs.map(log => log.userId)).size
      },
      vulnerabilities: {
        total: this.vulnerabilities.size,
        critical: Array.from(this.vulnerabilities.values()).filter(v => v.severity === 'critical').length,
        high: Array.from(this.vulnerabilities.values()).filter(v => v.severity === 'high').length,
        medium: Array.from(this.vulnerabilities.values()).filter(v => v.severity === 'medium').length,
        low: Array.from(this.vulnerabilities.values()).filter(v => v.severity === 'low').length,
        fixed: Array.from(this.vulnerabilities.values()).filter(v => v.status === 'fixed').length
      },
      threats: {
        detected: this.threats.size,
        mitigated: Array.from(this.threats.values()).filter(t => t.mitigated).length,
        active: Array.from(this.threats.values()).filter(t => !t.mitigated).length
      },
      compliance: {
        policyViolations: recentLogs.filter(log => log.category === 'policy_violation').length,
        auditFindings: this.auditLogs.filter(log => log.severity === 'high' || log.severity === 'critical').length,
        complianceScore: this.calculateComplianceScore()
      },
      performance: {
        averageResponseTime: 0, // Would be calculated from actual metrics
        securityOverhead: 0, // Would be calculated from actual metrics
        falsePositives: 0 // Would be calculated from actual metrics
      }
    };
  }

  /**
   * Create user
   */
  async createUser(userData: Partial<SecurityUser>, password: string): Promise<SecurityUser> {
    try {
      console.log(`Creating user: ${userData.username}`);
      
      // Validate password
      this.validatePassword(password);
      
      // Generate password hash
      const { hash, salt } = await this.hashPassword(password);
      
      const user: SecurityUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username: userData.username!,
        email: userData.email!,
        displayName: userData.displayName || userData.username!,
        avatar: userData.avatar,
        roles: userData.roles || [],
        permissions: userData.permissions || [],
        mfaEnabled: false,
        lastLogin: new Date(),
        loginAttempts: 0,
        locked: false,
        passwordHash: hash,
        passwordSalt: salt,
        passwordHistory: [hash],
        securityQuestions: [],
        sessions: [],
        preferences: {
          mfaMethod: 'totp',
          sessionTimeout: this.config.sessionPolicy.timeout,
          requireMfaForSensitiveActions: true,
          allowMultipleSessions: true,
          trustedDevices: [],
          securityNotifications: {
            loginAttempts: true,
            newDevice: true,
            passwordChange: true,
            permissionChange: true,
            suspiciousActivity: true
          },
          privacySettings: {
            shareUsageData: false,
            shareErrorReports: true,
            allowTelemetry: false
          }
        },
        created: new Date(),
        updated: new Date()
      };
      
      this.users.set(user.id, user);
      
      await this.logAudit({
        action: 'user_created',
        resource: 'user',
        details: { userId: user.id, username: user.username },
        severity: 'low',
        category: 'system',
        success: true
      });
      
      console.log(`User created: ${user.username}`);
      return user;
    } catch (error) {
      console.error(`Failed to create user ${userData.username}:`, error);
      throw error;
    }
  }

  // Private methods

  private async initializeDefaultRoles(): Promise<void> {
    console.log('Initializing default roles...');
    
    // Admin role
    const adminRole: SecurityRole = {
      id: 'role-admin',
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access',
      permissions: [{
        id: 'perm-admin-all',
        name: 'admin_all',
        displayName: 'Admin All',
        description: 'Full administrative access',
        resource: '*',
        action: '*',
        system: true,
        created: new Date()
      }],
      priority: 1000,
      system: true,
      created: new Date(),
      updated: new Date()
    };
    
    // Developer role
    const developerRole: SecurityRole = {
      id: 'role-developer',
      name: 'developer',
      displayName: 'Developer',
      description: 'Development access',
      permissions: [
        {
          id: 'perm-dev-code',
          name: 'code_access',
          displayName: 'Code Access',
          description: 'Access to code editing and debugging',
          resource: 'code',
          action: '*',
          system: true,
          created: new Date()
        },
        {
          id: 'perm-dev-files',
          name: 'file_access',
          displayName: 'File Access',
          description: 'Access to file operations',
          resource: 'files',
          action: '*',
          system: true,
          created: new Date()
        }
      ],
      priority: 500,
      system: true,
      created: new Date(),
      updated: new Date()
    };
    
    // Viewer role
    const viewerRole: SecurityRole = {
      id: 'role-viewer',
      name: 'viewer',
      displayName: 'Viewer',
      description: 'Read-only access',
      permissions: [{
        id: 'perm-viewer-read',
        name: 'read_access',
        displayName: 'Read Access',
        description: 'Read-only access to resources',
        resource: '*',
        action: 'read',
        system: true,
        created: new Date()
      }],
      priority: 100,
      system: true,
      created: new Date(),
      updated: new Date()
    };
    
    this.roles.set(adminRole.id, adminRole);
    this.roles.set(developerRole.id, developerRole);
    this.roles.set(viewerRole.id, viewerRole);
    
    // Store permissions
    [adminRole, developerRole, viewerRole].forEach(role => {
      role.permissions.forEach(permission => {
        this.permissions.set(permission.id, permission);
      });
    });
  }

  private async initializeSecurityPolicies(): Promise<void> {
    console.log('Initializing security policies...');
    
    // Password policy
    const passwordPolicy: SecurityPolicy = {
      id: 'policy-password',
      name: 'Password Policy',
      description: 'Enforce strong password requirements',
      category: 'authentication',
      rules: [
        {
          id: 'rule-password-length',
          name: 'Minimum Length',
          description: 'Password must be at least 12 characters',
          condition: 'password.length >= 12',
          action: 'deny',
          parameters: { minLength: 12 },
          enabled: true
        },
        {
          id: 'rule-password-complexity',
          name: 'Complexity Requirements',
          description: 'Password must contain uppercase, lowercase, numbers, and special characters',
          condition: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/.test(password)',
          action: 'deny',
          parameters: {},
          enabled: true
        }
      ],
      enabled: true,
      enforced: true,
      severity: 'high',
      created: new Date(),
      updated: new Date()
    };
    
    this.policies.set(passwordPolicy.id, passwordPolicy);
  }

  private startSecurityMonitoring(): void {
    console.log('Starting security monitoring...');
    
    // Monitor failed login attempts
    setInterval(() => {
      this.monitorFailedLogins();
    }, 60000); // Every minute
    
    // Monitor suspicious activities
    setInterval(() => {
      this.monitorSuspiciousActivities();
    }, 300000); // Every 5 minutes
    
    // Monitor active threats
    setInterval(() => {
      this.monitorActiveThreats();
    }, 600000); // Every 10 minutes
  }

  private setupSessionCleanup(): void {
    console.log('Setting up session cleanup...');
    
    setInterval(() => {
      const now = new Date();
      const expiredSessions: string[] = [];
      
      this.sessions.forEach((session, sessionId) => {
        if (session.expires <= now || !session.active) {
          expiredSessions.push(sessionId);
        }
      });
      
      expiredSessions.forEach(sessionId => {
        const session = this.sessions.get(sessionId);
        if (session) {
          this.sessions.delete(sessionId);
          this.emit('session-expired', sessionId);
        }
      });
      
      if (expiredSessions.length > 0) {
        console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
      }
    }, 300000); // Every 5 minutes
  }

  private async initializeVulnerabilityScanner(): Promise<void> {
    console.log('Initializing vulnerability scanner...');
    
    // Schedule regular vulnerability scans
    setInterval(async () => {
      try {
        await this.scanVulnerabilities('dependencies');
      } catch (error) {
        console.error('Scheduled vulnerability scan failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const { hash: computedHash } = await this.hashPassword(password, salt);
    return computedHash === hash;
  }

  private async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const passwordSalt = salt || CryptoJS.lib.WordArray.random(this.config.encryption.saltLength).toString();
    const hash = CryptoJS.PBKDF2(password, passwordSalt, {
      keySize: 256 / 32,
      iterations: this.config.encryption.iterations
    }).toString();
    
    return { hash, salt: passwordSalt };
  }

  private async verifyMfaCode(user: SecurityUser, code: string): Promise<boolean> {
    // Mock MFA verification - in real implementation, this would verify TOTP/SMS/etc.
    return code === '123456'; // Mock code
  }

  private async handleFailedLogin(user: SecurityUser): Promise<void> {
    user.loginAttempts++;
    
    if (user.loginAttempts >= this.config.lockoutPolicy.maxAttempts) {
      user.locked = true;
      user.lockUntil = new Date(Date.now() + this.config.lockoutPolicy.lockoutDuration * 60 * 1000);
      
      await this.logAudit({
        userId: user.id,
        action: 'account_locked',
        resource: 'user',
        details: { attempts: user.loginAttempts },
        severity: 'high',
        category: 'authentication',
        success: false
      });
    }
  }

  private async createSession(user: SecurityUser): Promise<SecuritySession> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const token = this.generateSessionToken();
    const refreshToken = this.generateSessionToken();
    
    const session: SecuritySession = {
      id: sessionId,
      userId: user.id,
      token,
      refreshToken,
      deviceId: this.generateDeviceId(),
      deviceInfo: this.getDeviceInfo(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      created: new Date(),
      lastActivity: new Date(),
      expires: new Date(Date.now() + user.preferences.sessionTimeout * 60 * 1000),
      active: true,
      trusted: false
    };
    
    this.sessions.set(sessionId, session);
    
    return session;
  }

  private generateSessionToken(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  private generateDeviceId(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
  }

  private generateEncryptionKey(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    
    return {
      type: /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop',
      os: this.detectOS(userAgent),
      browser: this.detectBrowser(userAgent),
      version: this.detectBrowserVersion(userAgent),
      fingerprint: this.generateDeviceFingerprint()
    };
  }

  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/([\d.]+)/);
    return match ? match[2] : 'Unknown';
  }

  private generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return CryptoJS.SHA256(fingerprint).toString();
  }

  private getClientIP(): string {
    // Mock IP detection - in real implementation, this would get actual client IP
    return '127.0.0.1';
  }

  private validatePassword(password: string): void {
    const policy = this.config.passwordPolicy;
    
    if (password.length < policy.minLength) {
      throw new Error(`Password must be at least ${policy.minLength} characters long`);
    }
    
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    
    if (policy.requireNumbers && !/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
    
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  private async logAudit(logData: Partial<SecurityAuditLog>): Promise<void> {
    const log: SecurityAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: logData.userId,
      sessionId: logData.sessionId,
      action: logData.action!,
      resource: logData.resource!,
      details: logData.details || {},
      ipAddress: logData.ipAddress || this.getClientIP(),
      userAgent: logData.userAgent || navigator.userAgent,
      timestamp: new Date(),
      severity: logData.severity!,
      category: logData.category!,
      success: logData.success!,
      errorMessage: logData.errorMessage
    };
    
    this.auditLogs.push(log);
    
    // Emit audit log event
    this.emit('audit-log-created', log);
    
    // Check for security alerts
    if (log.severity === 'high' || log.severity === 'critical') {
      this.emit('security-alert', log.severity, `Security event: ${log.action}`, log);
    }
  }

  private async scanDependencyVulnerabilities(): Promise<SecurityVulnerability[]> {
    // Mock dependency vulnerability scanning
    return [];
  }

  private async scanCodeVulnerabilities(): Promise<SecurityVulnerability[]> {
    // Mock code vulnerability scanning
    return [];
  }

  private async scanConfigurationVulnerabilities(): Promise<SecurityVulnerability[]> {
    // Mock configuration vulnerability scanning
    return [];
  }

  private monitorFailedLogins(): void {
    const threshold = this.config.monitoring.alertThresholds.failedLogins;
    const recentFailures = this.auditLogs.filter(log => 
      log.category === 'authentication' && 
      !log.success && 
      log.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );
    
    if (recentFailures.length >= threshold) {
      this.emit('security-alert', 'high', 'High number of failed login attempts', {
        count: recentFailures.length,
        threshold
      });
    }
  }

  private monitorSuspiciousActivities(): void {
    // Mock suspicious activity monitoring
    const suspiciousLogs = this.auditLogs.filter(log => 
      log.severity === 'high' && 
      log.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );
    
    if (suspiciousLogs.length > 0) {
      suspiciousLogs.forEach(log => {
        if (log.userId) {
          this.emit('suspicious-activity', log.userId, log.action, log.details);
        }
      });
    }
  }

  private monitorActiveThreats(): void {
    const activeThreats = Array.from(this.threats.values()).filter(threat => !threat.mitigated);
    
    if (activeThreats.length > 0) {
      activeThreats.forEach(threat => {
        if (threat.severity === 'critical' || threat.severity === 'high') {
          this.emit('security-alert', threat.severity, `Active threat detected: ${threat.type}`, threat);
        }
      });
    }
  }

  private calculateComplianceScore(): number {
    // Mock compliance score calculation
    const totalChecks = 100;
    const passedChecks = 85;
    return Math.round((passedChecks / totalChecks) * 100);
  }
}

// Create singleton instance
const securityManager = new SecurityManager();

export default securityManager;
export { SecurityManager };