# User Authentication System

This document describes the user authentication system implemented in the 3D-SCO portfolio application.

## Overview

The authentication system provides:
- User registration and login
- JWT-based session management
- Role-based access control (admin/user)
- Password hashing with bcrypt
- Protected API routes
- Rate limiting for security

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

### User Sessions Table
```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET
);
```

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure your database settings:

```bash
cp .env.example .env
```

Update the following variables in `.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=3d_sco
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 2. Database Setup

Ensure PostgreSQL is running and create the database:

```sql
CREATE DATABASE 3d_sco;
```

Initialize the database with tables and sample data:

```bash
npm run db:init
```

This will:
- Create the `users` and `user_sessions` tables
- Add necessary indexes
- Create a default admin user
- Create a sample test user

### 3. Install Dependencies

All required dependencies should already be installed, but if needed:

```bash
npm install
```

### 4. Start the Application

```bash
npm run dev
```

## API Endpoints

### Authentication Routes

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "name": "string" // optional
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "name": "Test User",
    "role": "user"
  }
}
```

#### POST `/api/auth/login`
Login with username/email and password.

**Request Body:**
```json
{
  "login": "username_or_email",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "name": "Test User",
    "role": "user"
  }
}
```

#### POST `/api/auth/logout`
Logout and clear authentication cookies.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### GET `/api/auth/me`
Get current user information (requires authentication).

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "name": "Test User",
    "bio": "User bio",
    "role": "user",
    "is_active": true,
    "email_verified": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT `/api/auth/me`
Update user profile (requires authentication).

**Request Body:**
```json
{
  "name": "string", // optional
  "bio": "string"   // optional
}
```

## Frontend Components

### UserAuthProvider
Context provider that manages user authentication state.

```tsx
import { useUserAuth } from '@/contexts/user-auth';

function MyComponent() {
  const { user, login, register, logout, loading } = useUserAuth();
  
  // Use authentication state and methods
}
```

### AuthModal
Reusable modal component for login and registration.

```tsx
import { AuthModal } from '@/components/auth/AuthModal';

function Header() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowAuthModal(true)}>Login</button>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}
```

### UserProfile
Dropdown component showing user information and profile options.

```tsx
import { UserProfile } from '@/components/auth/UserProfile';

function Header() {
  const { user } = useUserAuth();
  
  return (
    <>
      {user && <UserProfile />}
    </>
  );
}
```

## Security Features

### Password Security
- Passwords are hashed using bcrypt with salt rounds of 12
- Minimum password requirements can be enforced via validation

### JWT Tokens
- Tokens are signed with a secret key
- Tokens expire after 7 days by default
- Tokens are stored in HTTP-only cookies for security

### Rate Limiting
- Login attempts: 5 per 15 minutes per IP
- Registration: 3 per 15 minutes per IP
- General API: 100 requests per 15 minutes per IP

### Input Validation
- All inputs are validated using Zod schemas
- SQL injection protection through parameterized queries
- XSS protection through proper data sanitization

## Default Accounts

After running `npm run db:init`, the following accounts are available:

### Admin Account
- **Username:** admin
- **Email:** admin@3d-sco.com
- **Password:** admin123 (or value from `ADMIN_PASSWORD` env var)
- **Role:** admin

### Test User Account
- **Username:** testuser
- **Email:** test@example.com
- **Password:** test123
- **Role:** user

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists: `CREATE DATABASE 3d_sco;`
4. Check firewall settings if using remote database

### Authentication Not Working
1. Verify `JWT_SECRET` is set in `.env`
2. Check browser cookies are enabled
3. Ensure API routes are not being cached
4. Check network tab for API request/response details

### Rate Limiting Issues
1. Wait for rate limit window to reset (15 minutes)
2. Check IP address if behind proxy
3. Adjust rate limits in `middleware.ts` if needed

## Future Enhancements

- Email verification system
- Password reset functionality
- OAuth integration (Google, GitHub, etc.)
- Two-factor authentication (2FA)
- Session management dashboard
- User activity logging
- Advanced role permissions