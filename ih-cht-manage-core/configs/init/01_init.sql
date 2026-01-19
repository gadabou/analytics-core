-- Initialize database schema
-- This script runs automatically when PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema for the application
CREATE SCHEMA IF NOT EXISTS kendeya;

-- Grant privileges
GRANT ALL PRIVILEGES ON SCHEMA kendeya TO current_user;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
END $$;
