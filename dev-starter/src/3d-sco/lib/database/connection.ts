import { Pool, PoolClient } from 'pg';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || '3d_sco',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create a connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Database query function with error handling
export async function query(text: string, params?: any[]): Promise<any> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get a client from the pool for transactions
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

// Close the pool (useful for testing or graceful shutdown)
export async function closePool(): Promise<void> {
  await pool.end();
}

// Database health check
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows[0].health === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Initialize database tables (run this once during setup)
export async function initializeDatabase(): Promise<void> {
  try {
    // Check if users table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('Creating database tables...');
      
      // Create users table
      await query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(100),
          bio TEXT,
          avatar_url VARCHAR(500),
          role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP
        );
      `);

      // Create sessions table
      await query(`
        CREATE TABLE user_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ip_address INET,
          user_agent TEXT
        );
      `);

      // Create indexes
      await query('CREATE INDEX idx_users_email ON users(email);');
      await query('CREATE INDEX idx_users_username ON users(username);');
      await query('CREATE INDEX idx_users_role ON users(role);');
      await query('CREATE INDEX idx_sessions_token ON user_sessions(session_token);');
      await query('CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);');
      await query('CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);');

      // Create update trigger function
      await query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      // Create trigger
      await query(`
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
      `);

      console.log('Database tables created successfully!');
    } else {
      console.log('Database tables already exist.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export default pool;