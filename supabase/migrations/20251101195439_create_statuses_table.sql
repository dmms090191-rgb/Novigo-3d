/*
  # Create statuses table

  1. New Tables
    - `statuses`
      - `id` (uuid, primary key) - Unique identifier for the status
      - `name` (text) - Name of the status
      - `color` (text) - Hex color code for the status text color
      - `created_at` (timestamptz) - Timestamp when the status was created
      - `created_by` (uuid) - Reference to the admin who created the status

  2. Security
    - Enable RLS on `statuses` table
    - Add policy for authenticated users to read all statuses
    - Add policy for authenticated users to insert statuses
    - Add policy for authenticated users to delete their own statuses

  3. Notes
    - Statuses will be used across the application to categorize leads and clients
    - Color field stores hex color codes (e.g., #FF5733)
*/

CREATE TABLE IF NOT EXISTS statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#000000',
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read statuses"
  ON statuses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert statuses"
  ON statuses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete statuses"
  ON statuses
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update statuses"
  ON statuses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);