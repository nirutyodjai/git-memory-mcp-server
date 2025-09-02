-- Git Memory MCP Server - Production Database Initialization
-- This script sets up the production database with proper configurations

-- =============================================================================
-- Database Configuration
-- =============================================================================

-- Set timezone to UTC
SET timezone = 'UTC';

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =============================================================================
-- Performance Optimizations
-- =============================================================================

-- Increase shared_preload_libraries for pg_stat_statements
-- Note: This requires PostgreSQL restart
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Optimize for production workload
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Logging configuration
ALTER SYSTEM SET log_destination = 'stderr';
ALTER SYSTEM SET logging_collector = on;
ALTER SYSTEM SET log_directory = 'pg_log';
ALTER SYSTEM SET log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log';
ALTER SYSTEM SET log_rotation_age = '1d';
ALTER SYSTEM SET log_rotation_size = '100MB';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET log_temp_files = 0;

-- =============================================================================
-- Security Configuration
-- =============================================================================

-- Create application user with limited privileges
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'git_memory_app') THEN
        CREATE ROLE git_memory_app WITH LOGIN PASSWORD 'CHANGE_THIS_PASSWORD';
    END IF;
END
$$;

-- Grant necessary privileges
GRANT CONNECT ON DATABASE git_memory_prod TO git_memory_app;
GRANT USAGE ON SCHEMA public TO git_memory_app;
GRANT CREATE ON SCHEMA public TO git_memory_app;

-- Create read-only user for monitoring
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'git_memory_readonly') THEN
        CREATE ROLE git_memory_readonly WITH LOGIN PASSWORD 'CHANGE_THIS_READONLY_PASSWORD';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE git_memory_prod TO git_memory_readonly;
GRANT USAGE ON SCHEMA public TO git_memory_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO git_memory_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO git_memory_readonly;

-- =============================================================================
-- Monitoring Setup
-- =============================================================================

-- Create monitoring schema
CREATE SCHEMA IF NOT EXISTS monitoring;
GRANT USAGE ON SCHEMA monitoring TO git_memory_readonly;

-- Create function to get database statistics
CREATE OR REPLACE FUNCTION monitoring.get_db_stats()
RETURNS TABLE (
    database_name text,
    total_size bigint,
    table_count bigint,
    index_count bigint,
    active_connections integer,
    total_connections integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        current_database()::text,
        pg_database_size(current_database()),
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public')::bigint,
        (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public')::bigint,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::integer,
        (SELECT count(*) FROM pg_stat_activity)::integer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION monitoring.get_db_stats() TO git_memory_readonly;

-- Create function to get table statistics
CREATE OR REPLACE FUNCTION monitoring.get_table_stats()
RETURNS TABLE (
    schema_name text,
    table_name text,
    row_count bigint,
    table_size bigint,
    index_size bigint,
    total_size bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::text,
        tablename::text,
        n_tup_ins - n_tup_del as row_count,
        pg_relation_size(schemaname||'.'||tablename) as table_size,
        pg_indexes_size(schemaname||'.'||tablename) as index_size,
        pg_total_relation_size(schemaname||'.'||tablename) as total_size
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION monitoring.get_table_stats() TO git_memory_readonly;

-- =============================================================================
-- Backup and Maintenance
-- =============================================================================

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup;

-- Create backup log table
CREATE TABLE IF NOT EXISTS backup.backup_log (
    id SERIAL PRIMARY KEY,
    backup_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running',
    file_path TEXT,
    file_size BIGINT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance log table
CREATE TABLE IF NOT EXISTS backup.maintenance_log (
    id SERIAL PRIMARY KEY,
    operation VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running',
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT USAGE ON SCHEMA backup TO git_memory_app;
GRANT ALL ON ALL TABLES IN SCHEMA backup TO git_memory_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA backup TO git_memory_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA backup GRANT ALL ON TABLES TO git_memory_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA backup GRANT ALL ON SEQUENCES TO git_memory_app;

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Note: These will be created by Prisma migrations, but we can add additional ones here

-- Create indexes for common query patterns (will be added after Prisma migration)
-- These are examples and should be adjusted based on actual schema

/*
-- Example indexes (uncomment and adjust after schema is created)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
    ON users(email) WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_status 
    ON subscriptions(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_created_at 
    ON payments(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_git_memories_user_created 
    ON git_memories(user_id, created_at DESC);
*/

-- =============================================================================
-- Maintenance Functions
-- =============================================================================

-- Function to analyze all tables
CREATE OR REPLACE FUNCTION backup.analyze_all_tables()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    INSERT INTO backup.maintenance_log (operation, start_time) 
    VALUES ('ANALYZE_ALL_TABLES', NOW()) RETURNING id INTO rec;
    
    -- Analyze all user tables
    FOR rec IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE 'ANALYZE ' || quote_ident(rec.schemaname) || '.' || quote_ident(rec.tablename);
    END LOOP;
    
    UPDATE backup.maintenance_log 
    SET end_time = NOW(), status = 'completed' 
    WHERE operation = 'ANALYZE_ALL_TABLES' AND end_time IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to vacuum all tables
CREATE OR REPLACE FUNCTION backup.vacuum_all_tables()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    INSERT INTO backup.maintenance_log (operation, start_time) 
    VALUES ('VACUUM_ALL_TABLES', NOW());
    
    -- Vacuum all user tables
    FOR rec IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE 'VACUUM ANALYZE ' || quote_ident(rec.schemaname) || '.' || quote_ident(rec.tablename);
    END LOOP;
    
    UPDATE backup.maintenance_log 
    SET end_time = NOW(), status = 'completed' 
    WHERE operation = 'VACUUM_ALL_TABLES' AND end_time IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION backup.analyze_all_tables() TO git_memory_app;
GRANT EXECUTE ON FUNCTION backup.vacuum_all_tables() TO git_memory_app;

-- =============================================================================
-- Initial Data Setup
-- =============================================================================

-- This will be handled by Prisma seed script, but we can add system-level data here

-- Create system configuration table
CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial system configuration
INSERT INTO system_config (key, value, description) VALUES
    ('database_version', '1.0.0', 'Database schema version'),
    ('maintenance_mode', 'false', 'System maintenance mode flag'),
    ('backup_retention_days', '30', 'Number of days to retain backups'),
    ('max_connections_per_user', '10', 'Maximum connections per user'),
    ('session_timeout_minutes', '60', 'Session timeout in minutes')
ON CONFLICT (key) DO NOTHING;

-- Grant permissions
GRANT SELECT ON system_config TO git_memory_app;
GRANT SELECT ON system_config TO git_memory_readonly;

-- =============================================================================
-- Triggers for Audit Trail
-- =============================================================================

-- Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Create generic audit function
CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit.audit_log (table_name, operation, new_values, user_name, timestamp)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), current_user, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit.audit_log (table_name, operation, old_values, new_values, user_name, timestamp)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), current_user, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit.audit_log (table_name, operation, old_values, user_name, timestamp)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), current_user, NOW());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_name VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_timestamp 
    ON audit.audit_log(table_name, timestamp DESC);

-- Grant permissions
GRANT USAGE ON SCHEMA audit TO git_memory_app;
GRANT INSERT ON audit.audit_log TO git_memory_app;
GRANT USAGE ON SEQUENCE audit.audit_log_id_seq TO git_memory_app;
GRANT SELECT ON audit.audit_log TO git_memory_readonly;

-- =============================================================================
-- Cleanup and Finalization
-- =============================================================================

-- Reload configuration
SELECT pg_reload_conf();

-- Update statistics
ANALYZE;

-- Log initialization completion
INSERT INTO backup.maintenance_log (operation, status, details) 
VALUES ('DATABASE_INITIALIZATION', 'completed', '{"message": "Production database initialized successfully"}');

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE 'Git Memory MCP Server production database initialization completed successfully!';
    RAISE NOTICE 'Database: %', current_database();
    RAISE NOTICE 'Version: PostgreSQL %', version();
    RAISE NOTICE 'Timestamp: %', NOW();
END
$$;