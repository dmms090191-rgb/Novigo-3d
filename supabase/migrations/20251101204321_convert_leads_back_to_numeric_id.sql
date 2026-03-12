/*
  # Convert leads table back to numeric ID

  1. Changes
    - Backup existing leads data
    - Drop and recreate leads table with numeric ID
    - Restore data with numeric IDs (starting from 10000)
  
  2. Security
    - Maintains RLS disabled status
*/

-- Store existing data temporarily
CREATE TEMP TABLE leads_backup AS SELECT * FROM leads;

-- Drop the existing table
DROP TABLE IF EXISTS leads CASCADE;

-- Recreate table with numeric ID
CREATE TABLE IF NOT EXISTS leads (
  id integer PRIMARY KEY,
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

-- Disable RLS (as per previous migrations)
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Restore data with numeric IDs
DO $$
DECLARE
  lead_record RECORD;
  new_id integer := 10000;
BEGIN
  FOR lead_record IN SELECT * FROM leads_backup ORDER BY created_at
  LOOP
    INSERT INTO leads (id, email, full_name, phone, company_name, project_description, status, source, notes, assigned_to, created_at, updated_at)
    VALUES (new_id, lead_record.email, lead_record.full_name, lead_record.phone, lead_record.company_name, lead_record.project_description, lead_record.status, lead_record.source, lead_record.notes, lead_record.assigned_to, lead_record.created_at, lead_record.updated_at);
    new_id := new_id + 1;
  END LOOP;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads(assigned_to);
