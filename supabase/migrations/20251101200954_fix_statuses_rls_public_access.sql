/*
  # Fix statuses table RLS policies for public access

  1. Changes
    - Drop existing restrictive policies that require authentication
    - Create new policies that allow public access (anon role)
    - This enables the application to work without Supabase authentication

  2. Security
    - Allow anyone to read, insert, update, and delete statuses
    - This is acceptable for this application's use case

  3. Notes
    - The application does not use Supabase authentication
    - Public access is required for the status management feature to work
*/

DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read statuses" ON statuses;
  DROP POLICY IF EXISTS "Authenticated users can insert statuses" ON statuses;
  DROP POLICY IF EXISTS "Authenticated users can delete statuses" ON statuses;
  DROP POLICY IF EXISTS "Authenticated users can update statuses" ON statuses;
END $$;

CREATE POLICY "Public can read statuses"
  ON statuses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert statuses"
  ON statuses
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can delete statuses"
  ON statuses
  FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Public can update statuses"
  ON statuses
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);