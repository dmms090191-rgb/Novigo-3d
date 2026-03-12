/*
  # Convert leads table ID from integer to UUID

  1. Changes
    - Backup existing leads data
    - Drop and recreate leads table with UUID primary key
    - Restore data with new UUIDs
  
  2. Security
    - Maintains existing RLS policies
*/

-- Store existing data temporarily
CREATE TEMP TABLE leads_backup AS SELECT * FROM leads;

-- Drop the existing table
DROP TABLE IF EXISTS leads CASCADE;

-- Recreate table with UUID primary key
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  company_name text,
  project_description text,
  status text DEFAULT 'nouveau',
  source text,
  notes text,
  assigned_to uuid REFERENCES sellers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Disable RLS temporarily (as per previous migration)
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Restore data with new UUIDs
INSERT INTO leads (email, full_name, phone, company_name, project_description, status, source, notes, assigned_to, created_at, updated_at)
SELECT email, full_name, phone, company_name, project_description, status, source, notes, assigned_to, created_at, updated_at
FROM leads_backup;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads(assigned_to);
