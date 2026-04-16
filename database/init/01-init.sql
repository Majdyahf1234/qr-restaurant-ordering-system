-- Initial database setup
-- This script runs when PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The schema will be managed by Prisma migrations
-- This file is for any initial database setup that can't be done through Prisma
