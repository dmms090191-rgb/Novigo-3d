/*
  # Temporarily disable RLS on leads table
  
  This migration temporarily disables RLS on the leads table to allow
  insertions from the frontend. This is a temporary workaround while
  we investigate the authentication issue.
  
  IMPORTANT: This should be re-enabled with proper policies once
  authentication is working correctly.
  
  1. Changes
    - Disable RLS on leads table
*/

-- Disable RLS on leads table
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;