import { NextRequest } from 'next/server';
export interface AdminUser {
    id: string;
    username: string;
    role: 'admin';
}
export declare function generateToken(user: AdminUser): string;
export declare function verifyToken(token: string): AdminUser | null;
export declare function validateCredentials(username: string, password: string): AdminUser | null;
export declare function getAdminFromRequest(request: NextRequest): AdminUser | null;
export declare function isAuthenticated(request: NextRequest): boolean;
export declare function verifyAdminToken(request: NextRequest): Promise<AdminUser | null>;
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
export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    ipAddress?: string;
    userAgent?: string;
}
export declare function generateUserToken(user: User | AdminUser): string;
export declare function verifyUserToken(token: string): (User | AdminUser) | null;
export declare function getUserFromRequest(request: NextRequest): (User | AdminUser) | null;
export declare function hasRole(request: NextRequest, role: 'user' | 'admin'): boolean;
export declare function hashPassword(password: string): string;
export declare function verifyPassword(password: string, hash: string): boolean;
//# sourceMappingURL=auth.d.ts.map