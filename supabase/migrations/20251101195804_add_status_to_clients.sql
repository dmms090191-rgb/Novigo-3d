/*
  # Add status column to clients table

  1. Changes
    - Add `status_id` column to `clients` table as a foreign key to `statuses` table
    - This allows each lead/client to have an assigned status
    - Status is optional (nullable) by default

  2. Security
    - No RLS changes needed, existing policies cover the new column

  3. Notes
    - Leads can now be assigned custom statuses created by admins
    - Status colors will be displayed in the UI
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'status_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN status_id uuid REFERENCES statuses(id) ON DELETE SET NULL;
  END IF;
END $$;