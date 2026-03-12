/*
  # Fix clients table RLS policies for public update access

  1. Changes
    - Drop existing restrictive UPDATE policy that requires authentication
    - Create new policy that allows public access for updates (anon role)
    - This enables status updates without Supabase authentication

  2. Security
    - Allow anyone to update client records including status changes
    - This is acceptable for this application's use case

  3. Notes
    - The application does not use Supabase authentication
    - Public access is required for the status update feature to work
*/

DO $$
BEGIN
  DROP POLICY IF EXISTS "Clients can update own data" ON clients;
END $$;

CREATE POLICY "Public can update clients"
  ON clients
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);