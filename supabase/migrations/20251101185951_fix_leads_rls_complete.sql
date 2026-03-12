/*
  # Complete fix for leads RLS policies
  
  This migration completely rebuilds the RLS policies for the leads table
  to allow anyone (anonymous or authenticated) to insert leads.
  
  1. Changes
    - Drop ALL existing policies
    - Create new policies with correct roles (anon, authenticated)
    - Ensure INSERT works for both anonymous and authenticated users
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
DROP POLICY IF EXISTS "Tout le monde peut créer des leads" ON leads;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent voir les leads" ON leads;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent modifier des leads" ON leads;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent supprimer des leads" ON leads;

-- Allow anyone (anon or authenticated) to INSERT leads
CREATE POLICY "Enable insert for all users"
  ON leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to SELECT leads
CREATE POLICY "Enable select for authenticated users"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to UPDATE leads
CREATE POLICY "Enable update for authenticated users"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to DELETE leads
CREATE POLICY "Enable delete for authenticated users"
  ON leads
  FOR DELETE
  TO authenticated
  USING (true);