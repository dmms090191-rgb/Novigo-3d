/*
  # Fix elements_library public read access

  1. Changes
    - Drop the existing SELECT policy that requires authentication
    - Create a new SELECT policy that allows anonymous access
  
  2. Security
    - SELECT is now public (no authentication required)
    - INSERT, UPDATE, DELETE still require admin authentication
*/

DROP POLICY IF EXISTS "Public read access for elements_library" ON elements_library;

CREATE POLICY "Anyone can read elements_library"
  ON elements_library
  FOR SELECT
  TO anon, authenticated
  USING (true);
