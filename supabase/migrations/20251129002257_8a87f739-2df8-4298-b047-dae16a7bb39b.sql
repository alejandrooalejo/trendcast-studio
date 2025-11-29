-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move vector extension from public to extensions schema
-- First drop it from public, then recreate in extensions
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Grant usage on extensions schema to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;

-- Update search_path to include extensions schema
ALTER DATABASE postgres SET search_path TO public, extensions;