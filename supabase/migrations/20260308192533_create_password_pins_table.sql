/*
  # Create password_pins table for storing retrievable PINs

  1. New Tables
    - `password_pins`
      - `user_id` (uuid, primary key) - References auth.users
      - `pin` (text) - The 6-digit PIN stored in plain text for retrieval
      - `updated_at` (timestamptz) - Last update timestamp
      
  2. Security
    - Enable RLS on `password_pins` table
    - Users can read their own PIN
    - Users can insert their own PIN
    - Users can update their own PIN
*/

CREATE TABLE IF NOT EXISTS password_pins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE password_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own PIN"
  ON password_pins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PIN"
  ON password_pins
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PIN"
  ON password_pins
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);