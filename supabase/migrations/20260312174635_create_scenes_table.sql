/*
  # Create scenes table for 3D/2D editor

  1. New Tables
    - `scenes`
      - `id` (uuid, primary key)
      - `client_id` (integer, optional - for linking to a client)
      - `name` (text) - scene name
      - `terrain` (jsonb) - terrain configuration (width, length, cellSize)
      - `blocks` (jsonb) - array of blocks
      - `walls` (jsonb) - array of walls
      - `bricks` (jsonb) - array of bricks
      - `terrain_cells` (jsonb) - array of terrain cells
      - `grid_settings` (jsonb) - grid configuration
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `scenes` table
    - Add policy for public read/write access (since no auth required for this app)

  3. Notes
    - Using JSONB for flexible storage of scene objects
    - Allows saving complete scene state for restoration
*/

CREATE TABLE IF NOT EXISTS scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id integer REFERENCES clients(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'Ma Scene',
  terrain jsonb,
  blocks jsonb DEFAULT '[]'::jsonb,
  walls jsonb DEFAULT '[]'::jsonb,
  bricks jsonb DEFAULT '[]'::jsonb,
  terrain_cells jsonb DEFAULT '[]'::jsonb,
  grid_settings jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on scenes"
  ON scenes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert on scenes"
  ON scenes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update on scenes"
  ON scenes
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on scenes"
  ON scenes
  FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_scenes_client_id ON scenes(client_id);
CREATE INDEX IF NOT EXISTS idx_scenes_updated_at ON scenes(updated_at DESC);