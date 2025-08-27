import { query } from '../connection';
import { User } from '../../auth';
import bcrypt from 'bcryptjs';
import { optimizedQuery, withTransaction, invalidateUserCache } from '../optimizer';
import cache from '../../cache';

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  name?: string;
  bio?: string;
}

export interface UpdateUserData {
  name?: string;
  bio?: string;
  avatar_url?: string;
}

// Create a new user
export async function createUser(userData: CreateUserData): Promise<User> {
  const { username, email, password, name, bio } = userData;
  
  // Hash the password
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(password, saltRounds);
  
  const result = await query(
    `INSERT INTO users (username, email, password_hash, name, bio) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, username, email, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login`,
    [username, email, password_hash, name || null, bio || null]
  );
  
  return result.rows[0];
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query(
    `SELECT id, username, email, password_hash, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login 
     FROM users 
     WHERE email = $1 AND is_active = true`,
    [email]
  );
  
  return result.rows[0] || null;
}

// Find user by username
export async function findUserByUsername(username: string): Promise<User | null> {
  const result = await query(
    `SELECT id, username, email, password_hash, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login 
     FROM users 
     WHERE username = $1 AND is_active = true`,
    [username]
  );
  
  return result.rows[0] || null;
}

// Find user by ID
export async function findUserById(id: number): Promise<User | null> {
  try {
    // Try cache first
    const cacheKey = `user:${id}`;
    const cached = await cache.get<User>(cacheKey, { prefix: 'db', ttl: 300 });
    if (cached) {
      return cached;
    }

    const result = await optimizedQuery(
      `SELECT id, username, email, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login 
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [id],
      { cache: true, cacheTTL: 300, cacheKey }
    );
    
    const user = result[0] || null;
    if (user) {
      await cache.set(cacheKey, user, { prefix: 'db', ttl: 300 });
    }
    
    return user;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
}

// Verify user password
export async function verifyUserPassword(email: string, password: string): Promise<User | null> {
  const result = await query(
    `SELECT id, username, email, password_hash, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login 
     FROM users 
     WHERE email = $1 AND is_active = true`,
    [email]
  );
  
  const user = result.rows[0];
  if (!user) return null;
  
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) return null;
  
  // Remove password_hash from returned user object
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Update user profile
export async function updateUser(id: number, updateData: UpdateUserData): Promise<User | null> {
  try {
    return await withTransaction(async (client) => {
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
      
      const result = await client.query(
        `UPDATE users 
         SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount} AND is_active = true 
         RETURNING id, username, email, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login`,
        values
      );
      
      const updatedUser = result.rows[0] || null;
      
      // Invalidate cache after successful update
      if (updatedUser) {
        await invalidateUserCache(id);
      }
      
      return updatedUser;
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Update last login time
export async function updateLastLogin(id: number): Promise<void> {
  await query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );
}

// Check if email exists
export async function emailExists(email: string): Promise<boolean> {
  const result = await query(
    'SELECT 1 FROM users WHERE email = $1',
    [email]
  );
  
  return result.rows.length > 0;
}

// Check if username exists
export async function usernameExists(username: string): Promise<boolean> {
  const result = await query(
    'SELECT 1 FROM users WHERE username = $1',
    [username]
  );
  
  return result.rows.length > 0;
}

// Get user count
export async function getUserCount(): Promise<number> {
  const result = await query(
    'SELECT COUNT(*) as count FROM users WHERE is_active = true'
  );
  
  return parseInt(result.rows[0].count);
}

// Get users with pagination
export async function getUsers(limit: number = 10, offset: number = 0): Promise<User[]> {
  try {
    const cacheKey = `users:limit:${limit}:offset:${offset}`;
    
    const result = await optimizedQuery(
      `SELECT id, username, email, name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at, last_login 
       FROM users 
       WHERE is_active = true 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset],
      { cache: true, cacheTTL: 180, cacheKey } // 3 minutes cache
    );
    
    return result || [];
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

// Deactivate user (soft delete)
export async function deactivateUser(id: number): Promise<boolean> {
  const result = await query(
    'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );
  
  return result.rowCount > 0;
}

// Reactivate user
export async function reactivateUser(id: number): Promise<boolean> {
  const result = await query(
    'UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );
  
  return result.rowCount > 0;
}