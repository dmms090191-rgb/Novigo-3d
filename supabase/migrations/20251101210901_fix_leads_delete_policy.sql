/*
  # Fix leads table RLS policies for delete operations

  1. Changes
    - Drop all existing policies on leads table
    - Add SELECT policy for public access (read leads)
    - Add INSERT policy for public access (create leads)
    - Add UPDATE policy for public access (modify leads)
    - Add DELETE policy for public access (remove leads)
    
  2. Security
    - Table has RLS enabled
    - All operations allowed for testing purposes
    - In production, these should be restricted to authenticated admins only
*/

-- Drop all existing policies if any
DROP POLICY IF EXISTS "Anyone can view leads" ON leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
DROP POLICY IF EXISTS "Anyone can update leads" ON leads;
DROP POLICY IF EXISTS "Anyone can delete leads" ON leads;

-- Allow SELECT (read)
CREATE POLICY "Anyone can view leads"
  ON leads
  FOR SELECT
  USING (true);

-- Allow INSERT (create)
CREATE POLICY "Anyone can insert leads"
  ON leads
  FOR INSERT
  WITH CHECK (true);

-- Allow UPDATE (modify)
CREATE POLICY "Anyone can update leads"
  ON leads
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow DELETE (remove)
CREATE POLICY "Anyone can delete leads"
  ON leads
  FOR DELETE
  USING (true);