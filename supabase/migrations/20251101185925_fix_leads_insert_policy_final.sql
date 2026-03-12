/*
  # Fix leads INSERT policy - Allow ANYONE to create leads
  
  This migration removes the restrictive with_check condition and allows
  both anonymous and authenticated users to insert leads without any restrictions.
  
  1. Changes
    - Drop the existing restrictive INSERT policy
    - Create a new permissive INSERT policy that allows anyone to create leads
    - The policy uses a simple `true` condition for with_check
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Tout le monde peut créer des leads" ON leads;

-- Create a new permissive INSERT policy
CREATE POLICY "Anyone can insert leads"
  ON leads
  FOR INSERT
  TO public
  WITH CHECK (true);