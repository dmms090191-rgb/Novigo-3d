/*
  # Convert clients table to use numeric ID

  1. Changes
    - Backup existing clients data
    - Drop and recreate clients table with numeric ID
    - Restore data with numeric IDs (starting from 10000)
  
  2. Security
    - Maintains existing RLS policies
*/

-- Store existing data temporarily
CREATE TEMP TABLE clients_backup AS SELECT * FROM clients;

-- Drop the existing table
DROP TABLE IF EXISTS clients CASCADE;

-- Recreate table with numeric ID
CREATE TABLE IF NOT EXISTS clients (
  id integer PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  company_name text,
  phone text,
  address text,
  project_description text,
  status text DEFAULT 'nouveau',
  status_id uuid REFERENCES statuses(id),
  assigned_agent_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Allow public insert on clients"
  ON clients
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public read on clients"
  ON clients
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public update on clients"
  ON clients
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on clients"
  ON clients
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Restore data with numeric IDs
DO $$
DECLARE
  client_record RECORD;
  new_id integer := 10000;
BEGIN
  FOR client_record IN SELECT * FROM clients_backup ORDER BY created_at
  LOOP
    INSERT INTO clients (id, email, full_name, company_name, phone, address, project_description, status, status_id, assigned_agent_name, created_at, updated_at)
    VALUES (new_id, client_record.email, client_record.full_name, client_record.company_name, client_record.phone, client_record.address, client_record.project_description, client_record.status, client_record.status_id, client_record.assigned_agent_name, client_record.created_at, client_record.updated_at);
    new_id := new_id + 1;
  END LOOP;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS clients_email_idx ON clients(email);
CREATE INDEX IF NOT EXISTS clients_status_id_idx ON clients(status_id);
