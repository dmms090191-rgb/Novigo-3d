/*
  # Remove foreign key constraint from admins table
  
  1. Changes
    - Remove the foreign key constraint that links admins.id to auth.users.id
    - This allows creating admins without requiring Supabase auth users
    
  2. Reason
    - The application uses custom authentication without Supabase auth
    - Admins should be able to be created independently
*/

ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_id_fkey;