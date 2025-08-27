import { NextRequest } from 'next/server';

// Admin credentials (in production, use environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AdminUser {
  id: string;
  username: string;
  role: 'admin';
}

// Simple JWT-like token generation (in production, use proper JWT library)
export function generateToken(user: AdminUser): string {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifyToken(token: string): AdminUser | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token is expired
    if (Date.now() > payload.exp) {
      return null;
    }
    
    return {
      id: payload.id,
      username: payload.username,
      role: payload.role
    };
  } catch {
    return null;
  }
}

export function validateCredentials(username: string, password: string): AdminUser | null {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return {
      id: '1',
      username: ADMIN_USERNAME,
      role: 'admin'
    };
  }
  return null;
}

export function getAdminFromRequest(request: NextRequest): AdminUser | null {
  const token = request.cookies.get('admin-token')?.value;
  if (!token) return null;
  
  return verifyToken(token);
}

export function isAuthenticated(request: NextRequest): boolean {
  return getAdminFromRequest(request) !== null;
}

// Async version for API routes that need to verify admin token
export async function verifyAdminToken(request: NextRequest): Promise<AdminUser | null> {
  const token = request.cookies.get('admin-token')?.value;
  if (!token) return null;
  
  return verifyToken(token);
}

// Enhanced user interface for regular users
export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  bio?: string;
  avatar?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Session interface
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Enhanced JWT payload
interface JWTPayload {
  id: string;
  username: string;
  email?: string;
  role: 'user' | 'admin';
  exp: number;
  iat: number;
}

// Generate enhanced JWT token
export function generateUserToken(user: User | AdminUser): string {
  const payload: JWTPayload = {
    id: user.id,
    username: user.username,
    email: 'email' in user ? user.email : undefined,
    role: user.role,
    exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    iat: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Verify enhanced JWT token
export function verifyUserToken(token: string): (User | AdminUser) | null {
  try {
    const payload: JWTPayload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token is expired
    if (Date.now() > payload.exp) {
      return null;
    }
    
    // Return user object based on role
    if (payload.role === 'admin') {
      return {
        id: payload.id,
        username: payload.username,
        role: 'admin'
      } as AdminUser;
    } else {
      return {
        id: payload.id,
        username: payload.username,
        email: payload.email || '',
        role: 'user',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      } as User;
    }
  } catch {
    return null;
  }
}

// Get user from request (supports both admin and regular users)
export function getUserFromRequest(request: NextRequest): (User | AdminUser) | null {
  const adminToken = request.cookies.get('admin-token')?.value;
  const userToken = request.cookies.get('user-token')?.value;
  
  if (adminToken) {
    return verifyToken(adminToken);
  }
  
  if (userToken) {
    return verifyUserToken(userToken);
  }
  
  return null;
}

// Check if user has specific role
export function hasRole(request: NextRequest, role: 'user' | 'admin'): boolean {
  const user = getUserFromRequest(request);
  return user?.role === role;
}

// Password hashing utilities (simple implementation - use bcrypt in production)
export function hashPassword(password: string): string {
  // In production, use bcrypt or similar
  return Buffer.from(password + JWT_SECRET).toString('base64');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}