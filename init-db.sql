-- Blood Stock Management System - Database Initialization
-- This script runs automatically when PostgreSQL container starts

\c blood_stock_production;

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'Asia/Bangkok';

-- Grant additional privileges
GRANT CREATE ON SCHEMA public TO blood_stock_user;
GRANT USAGE ON SCHEMA public TO blood_stock_user;

-- Ensure user has all necessary permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blood_stock_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO blood_stock_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO blood_stock_user;

-- Log initialization
\echo 'Database initialization completed successfully!'