/*
  # Create Elements Library Table

  1. New Tables
    - `elements_library`
      - `id` (uuid, primary key)
      - `name` (text) - Element name (e.g., "Porte", "Chaise")
      - `category` (text) - Category (e.g., "Structure", "Mobilier")
      - `icon` (text) - Icon identifier for display
      - `drawing_data` (jsonb) - Recorded drawing strokes and animation data
      - `preview_image` (text) - Base64 or URL of preview thumbnail
      - `width` (integer) - Default width in cm
      - `height` (integer) - Default height in cm
      - `depth` (integer) - Default depth in cm
      - `placement_params` (jsonb) - Parameters for scene placement
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid) - Admin who created the element

  2. Security
    - Enable RLS on `elements_library` table
    - Public read access for all users
    - Write access for authenticated admins
*/

CREATE TABLE IF NOT EXISTS elements_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Mobilier',
  icon text DEFAULT 'box',
  drawing_data jsonb,
  preview_image text,
  width integer DEFAULT 100,
  height integer DEFAULT 100,
  depth integer DEFAULT 100,
  placement_params jsonb DEFAULT '{"snapToGrid": true, "rotatable": true, "scalable": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE elements_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for elements_library"
  ON elements_library
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert elements"
  ON elements_library
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update elements"
  ON elements_library
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete elements"
  ON elements_library
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE INDEX idx_elements_library_category ON elements_library(category);
CREATE INDEX idx_elements_library_name ON elements_library(name);