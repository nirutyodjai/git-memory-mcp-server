"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.validateCredentials = validateCredentials;
exports.getAdminFromRequest = getAdminFromRequest;
exports.isAuthenticated = isAuthenticated;
exports.verifyAdminToken = verifyAdminToken;
exports.generateUserToken = generateUserToken;
exports.verifyUserToken = verifyUserToken;
exports.getUserFromRequest = getUserFromRequest;
exports.hasRole = hasRole;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
// Admin credentials (in production, use environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || (() => {
    console.warn('Warning: ADMIN_USERNAME not set in environment variables. Using default.');
    return 'admin';
})();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (() => {
    console.warn('Warning: ADMIN_PASSWORD not set in environment variables. Using default.');
    return 'password';
})();
const JWT_SECRET = process.env.JWT_SECRET || (() => {
    console.warn('Warning: JWT_SECRET not set in environment variables. Using insecure default.');
    return 'your-secret-key';
})();
// Simple JWT-like token generation (in production, use proper JWT library)
function generateToken(user) {
    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}
function verifyToken(token) {
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
    }
    catch {
        return null;
    }
}
function validateCredentials(username, password) {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        return {
            id: '1',
            username: ADMIN_USERNAME,
            role: 'admin'
        };
    }
    return null;
}
function getAdminFromRequest(request) {
    const token = request.cookies.get('admin-token')?.value;
    if (!token)
        return null;
    return verifyToken(token);
}
function isAuthenticated(request) {
    return getAdminFromRequest(request) !== null;
}
// Async version for API routes that need to verify admin token
async function verifyAdminToken(request) {
    const token = request.cookies.get('admin-token')?.value;
    if (!token)
        return null;
    return verifyToken(token);
}
// Generate enhanced JWT token
function generateUserToken(user) {
    const payload = {
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
function verifyUserToken(token) {
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
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
            };
        }
        else {
            return {
                id: payload.id,
                username: payload.username,
                email: payload.email || '',
                role: 'user',
                isActive: true,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }
    }
    catch {
        return null;
    }
}
// Get user from request (supports both admin and regular users)
function getUserFromRequest(request) {
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
function hasRole(request, role) {
    const user = getUserFromRequest(request);
    return user?.role === role;
}
// Password hashing utilities (simple implementation - use bcrypt in production)
function hashPassword(password) {
    // In production, use bcrypt or similar
    return Buffer.from(password + JWT_SECRET).toString('base64');
}
function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}
