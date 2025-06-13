-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- This file runs when the PostgreSQL container starts for the first time
-- It ensures that the UUID extension is available for use in migrations