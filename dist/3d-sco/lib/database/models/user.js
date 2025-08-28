"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.findUserByEmail = findUserByEmail;
exports.findUserByUsername = findUserByUsername;
exports.findUserById = findUserById;
exports.verifyUserPassword = verifyUserPassword;
exports.updateUser = updateUser;
exports.updateLastLogin = updateLastLogin;
exports.emailExists = emailExists;
exports.usernameExists = usernameExists;
exports.getUserCount = getUserCount;
exports.getUsers = getUsers;
exports.deactivateUser = deactivateUser;
exports.reactivateUser = reactivateUser;
const connection_1 = require("../connection");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const optimizer_1 = require("../optimizer");
const cache_1 = __importDefault(require("../../cache"));
// Create a new user
async function createUser(userData) {
    const { username, email, password, name, bio } = userData;
    // Hash the password
    const saltRounds = 12;
    const password_hash = await bcryptjs_1.default.hash(password, saltRounds);
    const result = await (0, connection_1.query)(`INSERT INTO users (username, email, password_hash, name, bio) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, username, email, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login`, [username, email, password_hash, name || null, bio || null]);
    return result.rows[0];
}
// Find user by email
async function findUserByEmail(email) {
    const result = await (0, connection_1.query)(`SELECT id, username, email, password_hash, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login 
     FROM users 
     WHERE email = $1 AND is_active = true`, [email]);
    return result.rows[0] || null;
}
// Find user by username
async function findUserByUsername(username) {
    const result = await (0, connection_1.query)(`SELECT id, username, email, password_hash, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login 
     FROM users 
     WHERE username = $1 AND is_active = true`, [username]);
    return result.rows[0] || null;
}
// Find user by ID
async function findUserById(id) {
    try {
        // Try cache first
        const cacheKey = `user:${id}`;
        const cached = await cache_1.default.get(cacheKey, { prefix: 'db', ttl: 300 });
        if (cached) {
            return cached;
        }
        const result = await (0, optimizer_1.optimizedQuery)(`SELECT id, username, email, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login 
       FROM users 
       WHERE id = $1 AND is_active = true`, [id], { cache: true, cacheTTL: 300, cacheKey });
        const user = result[0] || null;
        if (user) {
            await cache_1.default.set(cacheKey, user, { prefix: 'db', ttl: 300 });
        }
        return user;
    }
    catch (error) {
        console.error('Error finding user by ID:', error);
        throw error;
    }
}
// Verify user password
async function verifyUserPassword(email, password) {
    const result = await (0, connection_1.query)(`SELECT id, username, email, password_hash, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login 
     FROM users 
     WHERE email = $1 AND is_active = true`, [email]);
    const user = result.rows[0];
    if (!user)
        return null;
    const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!isValidPassword)
        return null;
    // Remove password_hash from returned user object
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
}
// Update user profile
async function updateUser(id, updateData) {
    try {
        return await (0, optimizer_1.withTransaction)(async (client) => {
            const fields = [];
            const values = [];
            let paramCount = 1;
            if (updateData.name !== undefined) {
                fields.push(`name = $${paramCount}`);
                values.push(updateData.name);
                paramCount++;
            }
            if (updateData.bio !== undefined) {
                fields.push(`bio = $${paramCount}`);
                values.push(updateData.bio);
                paramCount++;
            }
            if (updateData.avatar_url !== undefined) {
                fields.push(`avatar_url = $${paramCount}`);
                values.push(updateData.avatar_url);
                paramCount++;
            }
            if (fields.length === 0) {
                // No fields to update, return current user
                return findUserById(id);
            }
            values.push(id);
            const result = await client.query(`UPDATE users 
         SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount} AND is_active = true 
         RETURNING id, username, email, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login`, values);
            const updatedUser = result.rows[0] || null;
            // Invalidate cache after successful update
            if (updatedUser) {
                await (0, optimizer_1.invalidateUserCache)(id);
            }
            return updatedUser;
        });
    }
    catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}
// Update last login time
async function updateLastLogin(id) {
    await (0, connection_1.query)('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
}
// Check if email exists
async function emailExists(email) {
    const result = await (0, connection_1.query)('SELECT 1 FROM users WHERE email = $1', [email]);
    return result.rows.length > 0;
}
// Check if username exists
async function usernameExists(username) {
    const result = await (0, connection_1.query)('SELECT 1 FROM users WHERE username = $1', [username]);
    return result.rows.length > 0;
}
// Get user count
async function getUserCount() {
    const result = await (0, connection_1.query)('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    return parseInt(result.rows[0].count);
}
// Get users with pagination
async function getUsers(limit = 10, offset = 0) {
    try {
        const cacheKey = `users:limit:${limit}:offset:${offset}`;
        const result = await (0, optimizer_1.optimizedQuery)(`SELECT id, username, email, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login 
       FROM users 
       WHERE is_active = true 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`, [limit, offset], { cache: true, cacheTTL: 180, cacheKey } // 3 minutes cache
        );
        return result || [];
    }
    catch (error) {
        console.error('Error getting users:', error);
        throw error;
    }
}
// Deactivate user (soft delete)
async function deactivateUser(id) {
    const result = await (0, connection_1.query)('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    return result.rowCount > 0;
}
// Reactivate user
async function reactivateUser(id) {
    const result = await (0, connection_1.query)('UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    return result.rowCount > 0;
}
//# sourceMappingURL=user.js.map