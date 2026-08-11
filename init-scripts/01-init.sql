-- init-scripts/01-init.sql
-- Initial database setup script
-- Runs automatically when postgres container first starts

-- Enable pgvector extension for vector search
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;
